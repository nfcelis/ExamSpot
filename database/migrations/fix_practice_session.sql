-- Migration: Fix practice session constraints
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Allow 'practice' status in exams table
-- ============================================================
DO $$ DECLARE
  v_constraint TEXT;
BEGIN
  SELECT c.conname INTO v_constraint
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'exams'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%status%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE exams DROP CONSTRAINT %I', v_constraint);
    RAISE NOTICE 'Dropped exams status constraint: %', v_constraint;
  END IF;
END $$;

ALTER TABLE exams
  ADD CONSTRAINT exams_status_check
  CHECK (status IN ('draft', 'published', 'archived', 'practice'));

-- ============================================================
-- 2. Allow all 8 question types in the legacy questions table
-- ============================================================
DO $$ DECLARE
  v_constraint TEXT;
BEGIN
  SELECT c.conname INTO v_constraint
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'questions'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%type%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE questions DROP CONSTRAINT %I', v_constraint);
    RAISE NOTICE 'Dropped questions type constraint: %', v_constraint;
  END IF;
END $$;

ALTER TABLE questions
  ADD CONSTRAINT questions_type_check
  CHECK (type IN (
    'multiple_choice',
    'true_false',
    'multi_select',
    'open_ended',
    'written_response',
    'fill_blank',
    'matching',
    'ordering'
  ));

-- ============================================================
-- 3. Grant execute permission on start_practice_session
-- ============================================================
GRANT EXECUTE ON FUNCTION public.start_practice_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_practice_categories TO authenticated;
