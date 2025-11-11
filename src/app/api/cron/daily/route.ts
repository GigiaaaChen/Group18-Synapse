import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

export const GET = async (req: NextRequest) => {
  try {
    const user = await requireUser(req);
    const consume = req.nextUrl.searchParams.get("consume") === "1";

    if (consume) {
      const { rows } = await db.query(
        `
        WITH due AS (
          SELECT t.id, t.title, t.goal_category, t.progress, t.goal_target_per_period
          FROM "task" t
          WHERE t."userId" = $1
            AND t.is_goal = true
            AND t.goal_active = true
            AND t.goal_cadence = 'daily'
            AND COALESCE(t.progress,0) < 100
            AND NOT EXISTS (
              SELECT 1 FROM reminder_log r
              WHERE r.user_id = $1
                AND r.task_id = t.id
                AND r.type = 'daily'
                AND r.period_start_date = CURRENT_DATE
            )
        ), ins AS (
          INSERT INTO reminder_log (user_id, task_id, type, period_start_date)
          SELECT $1, id, 'daily', CURRENT_DATE FROM due
          RETURNING task_id
        )
        SELECT d.id, d.title, d.goal_category, d.progress, d.goal_target_per_period
        FROM due d;
        `,
        [user.id]
      );
      const items = rows.map((r) => ({
        id: r.id as string,
        title: r.title as string,
        category: (r.goal_category as string) ?? "General",
        progress: Number(r.progress ?? 0),
        target: Number(r.goal_target_per_period ?? 100),
        text: `Keep going on ${r.goal_category ?? "your goal"} — ${r.progress ?? 0}% so far.`,
      }));
      return NextResponse.json({ reminders: items });
    } else {
      const { rows } = await db.query(
        `
        SELECT t.id, t.title, t.goal_category, t.progress, t.goal_target_per_period
        FROM "task" t
        WHERE t."userId" = $1
          AND t.is_goal = true
          AND t.goal_active = true
          AND t.goal_cadence = 'daily'
          AND COALESCE(t.progress,0) < 100
          AND NOT EXISTS (
            SELECT 1 FROM reminder_log r
            WHERE r.user_id = $1
              AND r.task_id = t.id
              AND r.type = 'daily'
              AND r.period_start_date = CURRENT_DATE
          );
        `,
        [user.id]
      );
      const items = rows.map((r) => ({
        id: r.id as string,
        title: r.title as string,
        category: (r.goal_category as string) ?? "General",
        progress: Number(r.progress ?? 0),
        target: Number(r.goal_target_per_period ?? 100),
        text: `Keep going on ${r.goal_category ?? "your goal"} — ${r.progress ?? 0}% so far.`,
      }));
      return NextResponse.json({ reminders: items });
    }
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ reminders: [] }, { status: 200 });
  }
};
