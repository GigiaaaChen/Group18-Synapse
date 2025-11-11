ALTER TABLE task
  ADD COLUMN IF NOT EXISTS is_goal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_cadence TEXT CHECK (goal_cadence IN ('daily','weekly')),
  ADD COLUMN IF NOT EXISTS goal_target_per_period INTEGER,
  ADD COLUMN IF NOT EXISTS goal_category TEXT,
  ADD COLUMN IF NOT EXISTS goal_active BOOLEAN NOT NULL DEFAULT true;
