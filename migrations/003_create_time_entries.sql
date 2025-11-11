-- Per-task time logs; exactly one active (open) timer per user
CREATE TABLE IF NOT EXISTS "time_entry" (
  "id"           TEXT PRIMARY KEY,
  "user_id"      TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "task_id"      TEXT NOT NULL REFERENCES "task"("id") ON DELETE CASCADE,
  "started_at"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at"     TIMESTAMP,
  "duration_min" INTEGER, -- set when ended
  "createdAt"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- one active timer per user (ended_at IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "ux_time_entry_user_active"
  ON "time_entry"("user_id")
  WHERE "ended_at" IS NULL;

CREATE INDEX IF NOT EXISTS "ix_time_entry_user" ON "time_entry"("user_id");
CREATE INDEX IF NOT EXISTS "ix_time_entry_task" ON "time_entry"("task_id");
CREATE INDEX IF NOT EXISTS "ix_time_entry_started_at" ON "time_entry"("started_at");

-- keep updatedAt fresh
CREATE OR REPLACE FUNCTION set_time_entry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_time_entry_updated_at"
BEFORE UPDATE ON "time_entry"
FOR EACH ROW
EXECUTE FUNCTION set_time_entry_updated_at();

-- auto-stop existing active timer for this user before starting a new one
CREATE OR REPLACE FUNCTION auto_stop_active_timer()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "time_entry"
  SET "ended_at" = CURRENT_TIMESTAMP,
      "duration_min" = FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "started_at"))/60)
  WHERE "user_id" = NEW."user_id"
    AND "ended_at" IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_time_entry_autostop"
BEFORE INSERT ON "time_entry"
FOR EACH ROW
EXECUTE FUNCTION auto_stop_active_timer();

-- when a timer is ended, compute duration_min if it wasn't set
CREATE OR REPLACE FUNCTION finalize_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."ended_at" IS NOT NULL AND (NEW."duration_min" IS NULL OR NEW."duration_min" < 0) THEN
    NEW."duration_min" = FLOOR(EXTRACT(EPOCH FROM (NEW."ended_at" - NEW."started_at"))/60);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_time_entry_finalize_duration"
BEFORE UPDATE ON "time_entry"
FOR EACH ROW
WHEN (OLD."ended_at" IS DISTINCT FROM NEW."ended_at")
EXECUTE FUNCTION finalize_time_entry_duration();
