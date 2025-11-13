import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const GET = async (req: NextRequest) => {
  const user = await requireUser(req);

  const occurrences = await db.query(
    `
    SELECT go.*
    FROM "goal_occurrence" go
    JOIN "goal" g ON g."id" = go."goalId"
    WHERE g."userId" = $1
    ORDER BY go."deadline"
  `,
    [user.id]
  );

  return NextResponse.json({ occurrences: occurrences.rows });
};
