CREATE TABLE IF NOT EXISTS "task" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "dueDate" DATE,
    "category" TEXT DEFAULT 'personal',
    "completed" BOOLEAN DEFAULT FALSE,
    "progress" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_task_userId" ON "task"("userId");
CREATE INDEX IF NOT EXISTS "idx_task_completed" ON "task"("userId", "completed");
