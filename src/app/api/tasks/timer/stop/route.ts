import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

// POST /api/tasks/timer/stop
export const POST = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);

    const activeSession = await db.query(
      `SELECT ts."id", ts."taskid", ts."startedat", t."category"
       FROM "task_session" ts
       JOIN "task" t ON t."id" = ts."taskid"
       WHERE ts."userid" = $1 AND ts."stoppedat" IS NULL
       LIMIT 1`,
      [user.id],
    );

    if (!activeSession.rows[0]) {
      return NextResponse.json(
        { error: "No active timer" },
        { status: 404 },
      );
    }

    const session = activeSession.rows[0];

    const stoppedSession = await db.query(
      `UPDATE "task_session"
       SET "stoppedat" = NOW()
       WHERE "id" = $1
       RETURNING "id", "userid", "taskid", "startedat", "stoppedat"`,
      [session.id],
    );

    const startTime = new Date(session.startedat);
    const stopTime = new Date(stoppedSession.rows[0].stoppedat);
    const durationMs = stopTime.getTime() - startTime.getTime();
    const durationMinutes = Math.floor(durationMs / 1000 / 60);

    const pointsPerMinute: { [key: string]: number } = {
      work: 2,
      exercise: 3,
      "self-care": 2.5,
      hobby: 2,
      personal: 2,
      health: 3,
      study: 2.5,
    };

    const category = session.category || "personal";
    const carePoints = Math.floor(
      durationMinutes * (pointsPerMinute[category] || 2),
    );
    
    if (carePoints > 0) {
      await db.query(
        `UPDATE "user"
         SET "petHappiness" = LEAST("petHappiness" + $1, 100)
         WHERE "id" = $2`,
        [carePoints, user.id],
      );
    }

    return NextResponse.json({
      session: stoppedSession.rows[0],
      durationMinutes,
      carePoints,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to stop timer", error);
    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 },
    );
  }
};
