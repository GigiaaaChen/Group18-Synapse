import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const POST = async (
  req: NextRequest,
  { params }: { params: { goalId: string } } // goalId in URL is unused; we trust occurrenceId
) => {
  try {
    const user = await requireUser(req);

    const { occurrenceId } = await req.json();

    // 1) Mark the occurrence as completed
    const occurrenceRes = await db.query(
      `UPDATE "goal_occurrence"
       SET "completed" = TRUE,
           "completedAt" = NOW()
       WHERE "id" = $1
       RETURNING *`,
      [occurrenceId]
    );

    if (!occurrenceRes.rows[0]) {
      // occurrenceId is invalid
      return NextResponse.json(
        { error: "Occurrence not found" },
        { status: 404 }
      );
    }

    // 2) Find the goal for this occurrence and ensure it belongs to this user
    const goalRes = await db.query(
      `
      SELECT g."frequency"
      FROM "goal" g
      JOIN "goal_occurrence" go ON go."goalId" = g."id"
      WHERE go."id" = $1
        AND g."userId" = $2
      `,
      [occurrenceId, user.id]
    );

    if (!goalRes.rows[0]) {
      // Occurrence exists but its goal doesn't match this user
      return NextResponse.json(
        { error: "Goal for this occurrence does not belong to the current user" },
        { status: 404 }
      );
    }

    const frequency: "daily" | "weekly" = goalRes.rows[0].frequency;
    const xp = frequency === "daily" ? 10 : 100;

    // 3) Award XP
    await db.query(
      `UPDATE "user"
       SET "xp" = COALESCE("xp", 0) + $1
       WHERE "id" = $2`,
      [xp, user.id]
    );

    // 4) Return updated occurrence + xpGain
    return NextResponse.json({
      success: true,
      occurrence: occurrenceRes.rows[0],
      xpGain: xp,
    });
  } catch (e) {
    console.error("POST /api/goals/[goalId]/complete error:", e);
    return NextResponse.json(
      { error: "Failed to complete occurrence" },
      { status: 400 }
    );
  }
};
