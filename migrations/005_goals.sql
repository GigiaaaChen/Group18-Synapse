CREATE TABLE IF NOT EXISTS "goal" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,

    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'personal',

    -- daily | weekly
    "frequency" TEXT NOT NULL CHECK ("frequency" IN ('daily', 'weekly')),

    -- weekly: 0 = Sunday, 1 = Monday, ... 6 = Saturday
    "repeatDay" INT CHECK ("repeatDay" BETWEEN 0 AND 6),

    "endDate" DATE NOT NULL,

    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_goal_user" ON "goal" ("userId");
CREATE INDEX IF NOT EXISTS "idx_goal_endDate" ON "goal" ("endDate");

CREATE TABLE IF NOT EXISTS "goal_occurrence" (
    "id" TEXT PRIMARY KEY,
    "goalId" TEXT NOT NULL REFERENCES "goal"("id") ON DELETE CASCADE,

    "deadline" TIMESTAMP NOT NULL,

    "completed" BOOLEAN NOT NULL DEFAULT FALSE,
    "completedAt" TIMESTAMP,

    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_occ_goal" ON "goal_occurrence" ("goalId");
CREATE INDEX IF NOT EXISTS "idx_occ_deadline" ON "goal_occurrence" ("deadline");


-- ========================================
-- ENSURE DEADLINE ALWAYS HAS TIME 23:59:00
-- ========================================
CREATE OR REPLACE FUNCTION enforce_1159pm_deadline()
RETURNS TRIGGER AS $$
BEGIN
    -- Force deadline time to 23:59:00
    NEW.deadline := date_trunc('day', NEW.deadline) + INTERVAL '23 hours 59 minutes';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_occ_deadline_1159pm ON "goal_occurrence";

CREATE TRIGGER trg_occ_deadline_1159pm
BEFORE INSERT OR UPDATE ON "goal_occurrence"
FOR EACH ROW EXECUTE FUNCTION enforce_1159pm_deadline();

CREATE OR REPLACE FUNCTION expire_old_occurrences()
RETURNS VOID AS $$
BEGIN
    DELETE FROM "goal_occurrence"
    WHERE "deadline" < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

