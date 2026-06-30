-- prisma/optional-db-constraints.sql
--
-- DB-001 FIX (optional, manual): the application already caps `answers`
-- JSON at 50KB via zod (src/lib/validations.ts), but that's an app-layer
-- check only — a direct database write (psql, a future internal script,
-- a bug elsewhere) could bypass it entirely. Prisma's schema language has
-- no CHECK-constraint support compatible with the `prisma db push`
-- workflow this project uses, so this is provided as a separate, optional
-- script instead of something embedded in schema.prisma.
--
-- HOW TO RUN: open the Neon SQL Editor (console.neon.tech → your project →
-- SQL Editor) and paste this in. Safe to run multiple times (IF NOT EXISTS
-- guards). NOT required for the app to function — purely defense in depth.
--
-- NOTE: if you ever add a question/answer type that legitimately needs
-- larger payloads (e.g. embedding images as base64 in an answer), raise
-- the 51200 figures below (50 * 1024) accordingly, or this constraint will
-- start rejecting valid submissions.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_answers_max_size'
  ) THEN
    ALTER TABLE "QuizSubmission"
      ADD CONSTRAINT quiz_answers_max_size
      CHECK (pg_column_size(answers) <= 51200);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'homework_answers_max_size'
  ) THEN
    ALTER TABLE "HomeworkSubmission"
      ADD CONSTRAINT homework_answers_max_size
      CHECK (pg_column_size(answers) <= 51200);
  END IF;
END $$;

-- To remove later if it ever becomes too restrictive:
--   ALTER TABLE "QuizSubmission"     DROP CONSTRAINT quiz_answers_max_size;
--   ALTER TABLE "HomeworkSubmission" DROP CONSTRAINT homework_answers_max_size;
