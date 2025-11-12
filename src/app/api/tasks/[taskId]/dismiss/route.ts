import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) => {
  try {
    const { taskId } = await params;
    const user = await requireUser(request);

    // Delete the task
    const result = await db.query(
      `
        DELETE FROM "task"
        WHERE "userId" = $1
          AND "id" = $2
        RETURNING id
      `,
      [user.id, taskId],
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Apply penalty: -5 XP and -10 pet happiness
    await db.query(
      `
        UPDATE "user"
        SET
          "xp" = GREATEST(COALESCE("xp", 0) - 5, 0),
          "petHappiness" = GREATEST(COALESCE("petHappiness", 100) - 10, 0)
        WHERE "id" = $1
      `,
      [user.id],
    );

    return NextResponse.json({ success: true, penalty: { xp: -5, petHappiness: -10 } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to dismiss task", error);
    return NextResponse.json(
      { error: "Failed to dismiss task" },
      { status: 500 },
    );
  }
};
