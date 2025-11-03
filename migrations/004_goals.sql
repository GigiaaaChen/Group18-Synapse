-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('personal','work','health','study')),
  period TEXT NOT NULL CHECK (period IN ('daily','weekly')),
  minutes_target INTEGER NOT NULL CHECK (minutes_target >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category, period)
);

-- Add fields needed for time aggregation on tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE tasks
SET completed_at = NOW()
WHERE completed = TRUE AND completed_at IS NULL;
