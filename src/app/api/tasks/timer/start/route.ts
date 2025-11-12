import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

// POST /api/tasks/timer/start - Start a timer for a task
export const POST = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    const taskCheck = await db.query(
      `SELECT "id" FROM "task" WHERE "id" = $1 AND "userId" = $2`,
      [taskId, user.id],
    );

    if (!taskCheck.rows[0]) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 },
      );
    }

    await db.query(
      `UPDATE "task_session"
       SET "stoppedat" = NOW()
       WHERE "userid" = $1 AND "stoppedat" IS NULL`,
      [user.id],
    );

    const sessionId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const result = await db.query(
      `INSERT INTO "task_session" ("id", "userid", "taskid", "startedat")
       VALUES ($1, $2, $3, NOW())
       RETURNING "id", "userid", "taskid", "startedat", "stoppedat"`,
      [sessionId, user.id, taskId],
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to start timer", error);
    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 },
    );
  }
};
