-- Create friendships table
CREATE TABLE IF NOT EXISTS "friendship" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "friendId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "unique_friendship" UNIQUE ("userId", "friendId"),
  CONSTRAINT "no_self_friendship" CHECK ("userId" != "friendId")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_friendship_userId" ON "friendship"("userId");
CREATE INDEX IF NOT EXISTS "idx_friendship_friendId" ON "friendship"("friendId");
CREATE INDEX IF NOT EXISTS "idx_friendship_status" ON "friendship"("status");

-- Add trigger to update updatedAt
CREATE OR REPLACE FUNCTION update_friendship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_friendship_updated_at
  BEFORE UPDATE ON "friendship"
  FOR EACH ROW
  EXECUTE FUNCTION update_friendship_updated_at();
