import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import type { GoalDraft } from "@/types/goal";

function getNextSunday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (7 - day) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const createOccurrences = async (goalId: string, draft: GoalDraft) => {
  const inserts: Promise<any>[] = [];

  const end = new Date(draft.endDate);
  end.setHours(23, 59, 0, 0);

  const current = new Date();
  current.setHours(0, 0, 0, 0);

  let cursor = new Date(current);

  while (cursor <= end) {
    let deadline: Date;

    if (draft.frequency === "daily") {
      deadline = new Date(cursor);
      deadline.setHours(23, 59, 0, 0);
    } else {
      const weekStart = getNextSunday(cursor);
      deadline = new Date(weekStart);
      const repeatDay = draft.repeatDay ?? 0; // 0 = Sunday
      deadline.setDate(weekStart.getDate() + repeatDay);
      deadline.setHours(23, 59, 0, 0);
    }

    if (deadline > end) break;

    inserts.push(
      db
        .query(
          `INSERT INTO "goal_occurrence"
           ("id", "goalId", "deadline")
           VALUES (gen_random_uuid(), $1, $2)
           RETURNING *`,
          [goalId, deadline.toISOString()]
        )
        .then((res) => res.rows[0])
    );

    cursor.setDate(cursor.getDate() + (draft.frequency === "daily" ? 1 : 7));
  }

  const rows = await Promise.all(inserts);
  return rows;
};

// GET all goals + occurrences
export const GET = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);

    const goals = await db.query(
      `
      SELECT * FROM "goal"
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
    `,
      [user.id]
    );

    const occurrences = await db.query(
      `
      SELECT * FROM "goal_occurrence"
      WHERE "goalId" IN (
        SELECT "id" FROM "goal" WHERE "userId" = $1
      )
      ORDER BY "deadline"
    `,
      [user.id]
    );

    return NextResponse.json({
      goals: goals.rows,
      occurrences: occurrences.rows,
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load goals" }, { status: 500 });
  }
};

// POST create goal
export const POST = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as GoalDraft;

    const goalInsert = await db.query(
      `INSERT INTO "goal"
       ("id", "userId", "title", "category", "frequency", "repeatDay", "endDate")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user.id,
        body.title,
        body.category,
        body.frequency,
        body.repeatDay ?? null,
        body.endDate,
      ]
    );

    const goal = goalInsert.rows[0];
    const occurrences = await createOccurrences(goal.id, body);

    return NextResponse.json({ goal, occurrences }, { status: 201 });
  } catch (e) {
    console.error("Failed to create goal", e);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 400 });
  }
};
