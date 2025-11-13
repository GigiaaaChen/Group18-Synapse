import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const POST = async (
  req: NextRequest,
  { params }: { params: { goalId: string } }
) => {
  const user = await requireUser(req);
  const { goalId } = params;

  const { occurrenceId } = await req.json();

  const occurrenceRes = await db.query(
    `UPDATE "goal_occurrence"
     SET "completed" = TRUE,
         "completedAt" = NOW()
     WHERE "id" = $1
     RETURNING *`,
    [occurrenceId]
  );

  if (!occurrenceRes.rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const goalRes = await db.query(
    `SELECT "frequency"
     FROM "goal"
     WHERE "id" = $1 AND "userId" = $2`,
    [goalId, user.id]
  );

  if (!goalRes.rows[0]) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const xp = goalRes.rows[0].frequency === "daily" ? 10 : 100;

  await db.query(
    `UPDATE "user"
     SET "xp" = COALESCE("xp", 0) + $1
     WHERE "id" = $2`,
    [xp, user.id]
  );

  return NextResponse.json({
    success: true,
    occurrence: occurrenceRes.rows[0],
    xpGain: xp,
  });
};
