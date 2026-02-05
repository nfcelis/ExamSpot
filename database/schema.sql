-- ExamSpot Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  is_public BOOLEAN DEFAULT true,
  access_link TEXT UNIQUE,
  link_expiration TIMESTAMP WITH TIME ZONE,
  randomize_order BOOLEAN DEFAULT false,
  time_limit INTEGER, -- minutes (NULL = no limit)
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'open_ended', 'fill_blank', 'matching')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  terms JSONB,
  points INTEGER DEFAULT 10,
  explanation TEXT,
  material_reference TEXT,
  order_index INTEGER DEFAULT 0,
  allow_partial_credit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Attempts
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER, -- seconds
  is_completed BOOLEAN DEFAULT false
);

-- Exam Answers
CREATE TABLE exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer JSONB,
  is_correct BOOLEAN DEFAULT false,
  score NUMERIC DEFAULT 0,
  feedback TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question Bank
CREATE TABLE question_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT,
  tags TEXT[],
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'open_ended', 'fill_blank', 'matching')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  points INTEGER DEFAULT 10,
  explanation TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_exam_answers_attempt_id ON exam_answers(attempt_id);
CREATE INDEX idx_question_bank_created_by ON question_bank(created_by);
CREATE INDEX idx_question_bank_category ON question_bank(category);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Exams: teachers can CRUD their own, everyone can read published+public
CREATE POLICY "Published public exams are viewable by everyone"
  ON exams FOR SELECT
  USING (
    (status = 'published' AND is_public = true)
    OR created_by = auth.uid()
  );

CREATE POLICY "Teachers can create exams"
  ON exams FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can update own exams"
  ON exams FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Teachers can delete own exams"
  ON exams FOR DELETE
  USING (created_by = auth.uid());

-- Questions: viewable if exam is accessible, editable by exam owner
CREATE POLICY "Questions are viewable if exam is accessible"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = questions.exam_id
      AND (
        (exams.status = 'published' AND exams.is_public = true)
        OR exams.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can manage questions for own exams"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = questions.exam_id
      AND exams.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can update questions for own exams"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = questions.exam_id
      AND exams.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete questions for own exams"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = questions.exam_id
      AND exams.created_by = auth.uid()
    )
  );

-- Materials: viewable if exam is accessible, manageable by exam owner
CREATE POLICY "Materials are viewable if exam is accessible"
  ON materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = materials.exam_id
      AND (
        (exams.status = 'published' AND exams.is_public = true)
        OR exams.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can manage materials for own exams"
  ON materials FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Teachers can delete materials they uploaded"
  ON materials FOR DELETE
  USING (uploaded_by = auth.uid());

-- Exam Attempts: users can see own attempts, teachers can see attempts on their exams
CREATE POLICY "Users can view own attempts"
  ON exam_attempts FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_attempts.exam_id
      AND exams.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create own attempts"
  ON exam_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attempts"
  ON exam_attempts FOR UPDATE
  USING (user_id = auth.uid());

-- Exam Answers: users can see own answers, teachers can see answers on their exams
CREATE POLICY "Users can view own answers"
  ON exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
      AND (
        exam_attempts.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM exams
          WHERE exams.id = exam_attempts.exam_id
          AND exams.created_by = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create own answers"
  ON exam_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own answers"
  ON exam_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
    )
  );

-- Question Bank: creators can manage, public ones are viewable
CREATE POLICY "Public questions are viewable by everyone"
  ON question_bank FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create question bank items"
  ON question_bank FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own question bank items"
  ON question_bank FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own question bank items"
  ON question_bank FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on exams
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_exam_updated
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-materials', 'exam-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: teachers can upload/delete, everyone can read
CREATE POLICY "Anyone can read exam materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exam-materials');

CREATE POLICY "Authenticated users can upload exam materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exam-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own exam materials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'exam-materials' AND auth.uid() = owner);
