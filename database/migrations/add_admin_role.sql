-- ============================================
-- MIGRATION: Admin Role & New Architecture
-- Run this in Supabase SQL Editor AFTER the initial schema
-- ============================================

-- ============================================
-- 1. UPDATE question_bank TABLE
-- ============================================

-- Add new columns to question_bank
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'imported'));
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS ai_generation_metadata JSONB;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'));
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS reference_material TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS reference_page TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS avg_score DECIMAL(5,2);
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS allow_partial_credit BOOLEAN DEFAULT false;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make category NOT NULL with a default for existing rows
UPDATE question_bank SET category = 'General' WHERE category IS NULL;
ALTER TABLE question_bank ALTER COLUMN category SET NOT NULL;
ALTER TABLE question_bank ALTER COLUMN category SET DEFAULT 'General';

-- New indexes for question_bank
CREATE INDEX IF NOT EXISTS idx_question_bank_status ON question_bank(status);
CREATE INDEX IF NOT EXISTS idx_question_bank_subcategory ON question_bank(subcategory);
CREATE INDEX IF NOT EXISTS idx_question_bank_tags ON question_bank USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_bank_type ON question_bank(type);

-- ============================================
-- 2. CREATE practice_config TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS practice_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questions_per_practice INTEGER NOT NULL DEFAULT 10,
  time_limit_minutes INTEGER,
  difficulty_distribution JSONB DEFAULT '{"easy": 30, "medium": 50, "hard": 20}'::jsonb,
  categories_enabled TEXT[],
  show_correct_answers BOOLEAN DEFAULT true,
  allow_retry BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Singleton constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_practice_config_singleton ON practice_config((1));

-- Insert default config
INSERT INTO practice_config (questions_per_practice, time_limit_minutes)
VALUES (10, 15)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. CREATE exam_questions TABLE (Many-to-Many)
-- ============================================

CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_bank_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, question_bank_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON exam_questions(question_bank_id);

-- ============================================
-- 4. CREATE ai_feedback_reviews TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ai_feedback_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_answer_id UUID REFERENCES exam_answers(id) ON DELETE CASCADE NOT NULL,
  original_feedback TEXT NOT NULL,
  original_score NUMERIC NOT NULL,
  original_ai_analysis JSONB NOT NULL,
  reviewed_by UUID REFERENCES profiles(id) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_decision TEXT NOT NULL CHECK (admin_decision IN ('approved', 'rejected', 'modified')),
  modified_feedback TEXT,
  modified_score NUMERIC,
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_reviews_exam_answer ON ai_feedback_reviews(exam_answer_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_reviews_reviewed_by ON ai_feedback_reviews(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_reviews_decision ON ai_feedback_reviews(admin_decision);

-- ============================================
-- 5. UPDATE exam_attempts TABLE
-- ============================================

ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS is_practice BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_exam_attempts_is_practice ON exam_attempts(is_practice);

-- ============================================
-- 6. UPDATE exam_answers TABLE
-- ============================================

ALTER TABLE exam_answers ADD COLUMN IF NOT EXISTS feedback_status TEXT DEFAULT 'auto' CHECK (feedback_status IN ('auto', 'pending_review', 'reviewed'));
CREATE INDEX IF NOT EXISTS idx_exam_answers_feedback_status ON exam_answers(feedback_status);

-- ============================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE practice_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. DROP OLD POLICIES (if they exist) AND CREATE NEW ONES
-- ============================================

-- question_bank: Drop old policies
DROP POLICY IF EXISTS "Public questions are viewable by everyone" ON question_bank;
DROP POLICY IF EXISTS "Users can create question bank items" ON question_bank;
DROP POLICY IF EXISTS "Users can update own question bank items" ON question_bank;
DROP POLICY IF EXISTS "Users can delete own question bank items" ON question_bank;

-- question_bank: Admins have full access
CREATE POLICY "Admins have full access to question bank"
ON question_bank FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- question_bank: Teachers can view approved questions
CREATE POLICY "Teachers can view approved questions"
ON question_bank FOR SELECT
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'teacher'
  )
);

-- question_bank: Students can view approved questions (for practice RPC)
CREATE POLICY "Students can view approved questions for practice"
ON question_bank FOR SELECT
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'student'
  )
);

-- practice_config: Only admins can modify
CREATE POLICY "Only admins can modify practice config"
ON practice_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- practice_config: Everyone authenticated can view
CREATE POLICY "Everyone can view practice config"
ON practice_config FOR SELECT
USING (auth.uid() IS NOT NULL);

-- exam_questions: Teachers can manage questions in their exams
CREATE POLICY "Teachers can manage questions in their exams"
ON exam_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_questions.exam_id
    AND exams.created_by = auth.uid()
  )
);

-- exam_questions: Students can view questions in published exams
CREATE POLICY "Students can view questions in published exams"
ON exam_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_questions.exam_id
    AND exams.status = 'published'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'student'
    )
  )
);

-- exam_questions: Admins can view all exam_questions
CREATE POLICY "Admins can view all exam questions"
ON exam_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ai_feedback_reviews: Only admins can manage
CREATE POLICY "Only admins can manage feedback reviews"
ON ai_feedback_reviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 9. SUPABASE FUNCTIONS
-- ============================================

-- Function: Get exam questions for student (without correct answers)
CREATE OR REPLACE FUNCTION get_exam_questions_for_student(exam_id_param UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  question_text TEXT,
  options JSONB,
  points INTEGER,
  order_index INTEGER,
  explanation TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_id_param
    AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Exam not available';
  END IF;

  RETURN QUERY
  SELECT
    qb.id,
    qb.type,
    qb.question_text,
    qb.options,
    qb.points,
    eq.order_index,
    NULL::TEXT as explanation
  FROM exam_questions eq
  JOIN question_bank qb ON qb.id = eq.question_bank_id
  WHERE eq.exam_id = exam_id_param
  ORDER BY eq.order_index;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_exam_questions_for_student TO authenticated;

-- Function: Get random questions for practice
CREATE OR REPLACE FUNCTION get_random_questions_for_practice(
  num_questions INTEGER,
  categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  question_text TEXT,
  options JSONB,
  points INTEGER,
  difficulty TEXT
)
SECURITY DEFINER
AS $$
DECLARE
  config_difficulty JSONB;
  easy_count INTEGER;
  medium_count INTEGER;
  hard_count INTEGER;
BEGIN
  SELECT difficulty_distribution INTO config_difficulty
  FROM practice_config
  LIMIT 1;

  easy_count := FLOOR(num_questions * (config_difficulty->>'easy')::NUMERIC / 100);
  medium_count := FLOOR(num_questions * (config_difficulty->>'medium')::NUMERIC / 100);
  hard_count := num_questions - easy_count - medium_count;

  RETURN QUERY
  (
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM question_bank qb
    WHERE qb.status = 'approved'
    AND qb.difficulty = 'easy'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM()
    LIMIT easy_count
  )
  UNION ALL
  (
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM question_bank qb
    WHERE qb.status = 'approved'
    AND qb.difficulty = 'medium'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM()
    LIMIT medium_count
  )
  UNION ALL
  (
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM question_bank qb
    WHERE qb.status = 'approved'
    AND qb.difficulty = 'hard'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM()
    LIMIT hard_count
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_random_questions_for_practice TO authenticated;

-- Function: Get question bank stats (for admin analytics)
CREATE OR REPLACE FUNCTION get_question_bank_stats()
RETURNS TABLE (
  total_questions BIGINT,
  approved_count BIGINT,
  pending_count BIGINT,
  rejected_count BIGINT,
  ai_generated_count BIGINT,
  manual_count BIGINT,
  imported_count BIGINT,
  categories_count BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_questions,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_count,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_count,
    COUNT(*) FILTER (WHERE source = 'ai_generated')::BIGINT as ai_generated_count,
    COUNT(*) FILTER (WHERE source = 'manual')::BIGINT as manual_count,
    COUNT(*) FILTER (WHERE source = 'imported')::BIGINT as imported_count,
    COUNT(DISTINCT category)::BIGINT as categories_count
  FROM question_bank;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_question_bank_stats TO authenticated;
