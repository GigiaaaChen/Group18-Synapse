ALTER TABLE "task"
ADD COLUMN "isGoal" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "task"
ADD COLUMN "goalFrequency" TEXT;

ALTER TABLE "task"
ADD CONSTRAINT "chk_task_goalFrequency"
CHECK (
  "goalFrequency" IS NULL
  OR "goalFrequency" IN ('daily', 'weekly')
);
