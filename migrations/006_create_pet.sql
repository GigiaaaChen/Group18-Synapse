-- Migration 006: Create Pet System
-- Creates pet table for storing coins and customization data

CREATE TABLE IF NOT EXISTS pet (
  id TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 0,
  "equippedItems" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pet_userId ON pet("userId");

-- Seed pet records for existing users
INSERT INTO pet (id, "userId", coins)
SELECT gen_random_uuid()::text, id, 0
FROM "user"
WHERE NOT EXISTS (SELECT 1 FROM pet WHERE pet."userId" = "user".id);
