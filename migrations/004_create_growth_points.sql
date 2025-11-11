CREATE TABLE IF NOT EXISTS "growth_points" (
  "id"          TEXT PRIMARY KEY,
  "user_id"     TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "task_id"     TEXT NOT NULL REFERENCES "task"("id") ON DELETE CASCADE,
  "category"    TEXT NOT NULL,     -- work, exercise, self-care, hobby
  "duration_min" INTEGER NOT NULL, -- total minutes from timer
  "points"      INTEGER NOT NULL,  -- computed from duration and category
  "createdAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ix_growth_points_user" ON "growth_points"("user_id");
CREATE INDEX IF NOT EXISTS "ix_growth_points_task" ON "growth_points"("task_id");

-- points rule (adjust multipliers freely)
CREATE OR REPLACE FUNCTION compute_growth_points(_category TEXT, _minutes INTEGER)
RETURNS INTEGER AS $$
DECLARE
  factor NUMERIC := CASE
    WHEN _category = 'work' THEN 1.0
    WHEN _category = 'exercise' THEN 2.0
    WHEN _category = 'self-care' THEN 1.5
    WHEN _category = 'hobby' THEN 1.2
    ELSE 1.0
  END;
BEGIN
  RETURN GREATEST(0, FLOOR(_minutes * factor))::INT;
END;
$$ LANGUAGE plpgsql;

-- when a time_entry is ended, write a growth_points row
CREATE OR REPLACE FUNCTION insert_growth_points_from_time_entry()
RETURNS TRIGGER AS $$
DECLARE
  cat TEXT;
  pts INTEGER;
BEGIN
  IF NEW."ended_at" IS NOT NULL THEN
    -- get task category at time of completion
    SELECT "category" INTO cat FROM "task" WHERE "id" = NEW."task_id";

    -- compute points
    pts := compute_growth_points(cat, COALESCE(NEW."duration_min", 0));

    -- insert record
    INSERT INTO "growth_points" ("id","user_id","task_id","category","duration_min","points")
    VALUES (gen_random_uuid()::TEXT, NEW."user_id", NEW."task_id", cat, COALESCE(NEW."duration_min",0), pts);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_time_entry_growth_points"
AFTER UPDATE ON "time_entry"
FOR EACH ROW
WHEN (OLD."ended_at" IS DISTINCT FROM NEW."ended_at" AND NEW."ended_at" IS NOT NULL)
EXECUTE FUNCTION insert_growth_points_from_time_entry();
