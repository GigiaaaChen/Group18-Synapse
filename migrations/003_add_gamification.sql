-- Add gamification fields to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "xp" INTEGER DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "petHappiness" INTEGER DEFAULT 100;

-- Add completedAt timestamp to task table
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;
