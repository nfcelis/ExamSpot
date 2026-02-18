-- Migration: Add new question types
-- Run this in Supabase SQL Editor before reimporting questions

-- Step 1: Drop the existing type CHECK constraint on question_bank
-- (PostgreSQL auto-names inline constraints as tablename_columnname_check)
DO $$ DECLARE
  v_constraint TEXT;
BEGIN
  SELECT c.conname INTO v_constraint
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'question_bank'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%type%IN%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE question_bank DROP CONSTRAINT %I', v_constraint);
    RAISE NOTICE 'Dropped constraint: %', v_constraint;
  ELSE
    RAISE NOTICE 'No type constraint found, skipping drop';
  END IF;
END $$;

-- Step 2: Add new constraint with expanded types
ALTER TABLE question_bank
  ADD CONSTRAINT question_bank_type_check
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
