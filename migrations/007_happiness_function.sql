-- Function to calculate pet happiness based on task activity
-- This function computes happiness in real-time based on:
-- 1. Time since last completed task
-- 2. Number of tasks completed in last 7 days
-- 3. Total time spent on tasks in last 7 days

CREATE OR REPLACE FUNCTION calculate_pet_happiness(user_id_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_happiness INTEGER := 50;
  recency_bonus INTEGER := 0;
  activity_bonus INTEGER := 0;
  time_bonus INTEGER := 0;
  final_happiness INTEGER;

  last_completed_at TIMESTAMP;
  hours_since_last NUMERIC;
  days_since_last NUMERIC;

  tasks_last_7_days INTEGER;
  total_minutes_last_7_days NUMERIC;
BEGIN
  -- Get last completed task time
  SELECT "completedAt" INTO last_completed_at
  FROM task
  WHERE "userId" = user_id_param
    AND completed = true
    AND "completedAt" IS NOT NULL
  ORDER BY "completedAt" DESC
  LIMIT 1;

  -- Calculate recency bonus
  IF last_completed_at IS NOT NULL THEN
    hours_since_last := EXTRACT(EPOCH FROM (NOW() - last_completed_at)) / 3600;
    days_since_last := hours_since_last / 24;

    IF days_since_last < 1 THEN
      recency_bonus := 30;  -- Completed today
    ELSIF days_since_last < 2 THEN
      recency_bonus := 20;  -- Yesterday
    ELSIF days_since_last < 3 THEN
      recency_bonus := 10;  -- 2 days ago
    ELSIF days_since_last < 7 THEN
      -- 3-7 days: decay from 10 to 0
      recency_bonus := GREATEST(0, 10 - FLOOR((days_since_last - 2) * 3));
    ELSE
      recency_bonus := 0;  -- After 7 days, no bonus
    END IF;
  END IF;

  -- Get tasks completed in last 7 days
  SELECT COUNT(*) INTO tasks_last_7_days
  FROM task
  WHERE "userId" = user_id_param
    AND completed = true
    AND "completedAt" >= NOW() - INTERVAL '7 days';

  -- Calculate activity bonus (2 points per task, max 20)
  activity_bonus := LEAST(20, tasks_last_7_days * 2);

  -- Get total time spent in last 7 days
  SELECT COALESCE(
    SUM(EXTRACT(EPOCH FROM (COALESCE(stoppedat, NOW()) - startedat))) / 60,
    0
  ) INTO total_minutes_last_7_days
  FROM task_session
  WHERE userid = user_id_param
    AND startedat >= NOW() - INTERVAL '7 days';

  -- Calculate time bonus (1 point per 30 minutes, max 20)
  time_bonus := LEAST(20, FLOOR(total_minutes_last_7_days / 30));

  -- Calculate final happiness
  final_happiness := base_happiness + recency_bonus + activity_bonus + time_bonus;

  -- Clamp to 0-100
  RETURN GREATEST(0, LEAST(100, final_happiness));
END;
$$;

-- Add happiness column to pet table if it doesn't exist
ALTER TABLE pet
ADD COLUMN IF NOT EXISTS happiness INTEGER DEFAULT 100;

-- Update existing pets to have initial happiness
UPDATE pet
SET happiness = 100
WHERE happiness IS NULL;
