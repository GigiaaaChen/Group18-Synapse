import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

// GET /api/tasks/timer/active - Get active timer session
export const GET = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);

    const result = await db.query(
      `SELECT ts."id", ts."userid", ts."taskid", ts."startedat", ts."stoppedat", t."title", t."category"
       FROM "task_session" ts
       JOIN "task" t ON t."id" = ts."taskid"
       WHERE ts."userid" = $1 AND ts."stoppedat" IS NULL
       LIMIT 1`,
      [user.id],
    );

    if (!result.rows[0]) {
      return NextResponse.json({ activeTimer: null });
    }

    return NextResponse.json({ activeTimer: result.rows[0] });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to get active timer", error);
    return NextResponse.json(
      { error: "Failed to get active timer" },
      { status: 500 },
    );
  }
};
