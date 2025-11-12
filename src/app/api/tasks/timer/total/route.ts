import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

// GET /api/tasks/timer/total
export const GET = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);

    const result = await db.query(
      `SELECT
        ts."taskid",
        SUM(
          CASE
            WHEN ts."stoppedat" IS NULL THEN
              EXTRACT(EPOCH FROM (NOW() - ts."startedat"))
            ELSE
              EXTRACT(EPOCH FROM (ts."stoppedat" - ts."startedat"))
          END
        ) as "totalSeconds"
       FROM "task_session" ts
       WHERE ts."userid" = $1
       GROUP BY ts."taskid"`,
      [user.id],
    );

    const timeByTask: { [key: string]: number } = {};
    for (const row of result.rows) {
      timeByTask[row.taskid] = Math.floor(row.totalSeconds || 0);
    }

    return NextResponse.json({ timeByTask });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to get total time", error);
    return NextResponse.json(
      { error: "Failed to get total time" },
      { status: 500 },
    );
  }
};
