import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromSession } from "@/lib/session";

function periodBounds(p: "daily" | "weekly") {
  const now = new Date();
  if (p === "daily") {
    const start = new Date(now); start.setHours(0,0,0,0);
    const end   = new Date(now); end.setHours(23,59,59,999);
    return { start, end };
  }
  // Weekly: Monday 00:00 to Sunday 23:59:59
  const day = now.getDay(); // 0..6
  const diffToMon = (day + 6) % 7;
  const start = new Date(now); start.setDate(now.getDate() - diffToMon); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const goals = (await db.query(
    `SELECT category, period, minutes_target AS "minutesTarget"
     FROM goals WHERE user_id = $1`, [user.id]
  )).rows as { category: string; period: "daily" | "weekly"; minutesTarget: number }[];

  const results: any[] = [];
  for (const g of goals) {
    const { start, end } = periodBounds(g.period);

    // Aggregate minutes from completed tasks in window
    const sql = `
      SELECT COALESCE(SUM(
        COALESCE(actual_duration_minutes, 0)
      ), 0) AS "mins"
      FROM tasks
      WHERE user_id = $1
        AND category = $2
        AND completed = TRUE
        AND completed_at IS NOT NULL
        AND completed_at >= $3 AND completed_at <= $4
    `;
    const row = (await db.query(sql, [user.id, g.category, start, end])).rows[0];
    const minutesLogged = Number(row?.mins ?? 0);

    const minutesRemaining = Math.max(0, g.minutesTarget - minutesLogged);
    results.push({
      category: g.category,
      period: g.period,
      minutesTarget: g.minutesTarget,
      minutesLogged,
      minutesRemaining,
      met: minutesLogged >= g.minutesTarget,
    });
  }

  return Response.json(results);
}
