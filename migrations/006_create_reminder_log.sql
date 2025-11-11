CREATE TABLE IF NOT EXISTS reminder_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily','weekly')),
  period_start_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, type, period_start_date)
);
