import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId");
  if (!taskId) return NextResponse.json({ entries: [] });

  const { rows } = await db.query(
    `SELECT "id","task_id","started_at","ended_at","duration_min"
     FROM "time_entry"
     WHERE "user_id"=$1 AND "task_id"=$2 AND "ended_at" IS NOT NULL
     ORDER BY "started_at" DESC
     LIMIT 20`,
    [user.id, taskId]
  );

  const entries = rows.map((r: any) => ({
    id: r.id,
    taskId: r.task_id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationMin: r.duration_min,
  }));
  return NextResponse.json({ entries });
}
