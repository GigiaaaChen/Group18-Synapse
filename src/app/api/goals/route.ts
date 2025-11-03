import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromSession } from "@/lib/session"; // use your existing helper

export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const rows = (await db.query(
    `SELECT id, user_id AS "userId", category, period,
            minutes_target AS "minutesTarget",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM goals WHERE user_id = $1
     ORDER BY category, period`, [user.id]
  )).rows;

  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { category, period, minutesTarget } = body || {};
  if (!category || !period || typeof minutesTarget !== "number")
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });

  const sql = `
    INSERT INTO goals (user_id, category, period, minutes_target)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, category, period)
    DO UPDATE SET minutes_target = EXCLUDED.minutes_target, updated_at = NOW()
    RETURNING id, user_id AS "userId", category, period, minutes_target AS "minutesTarget",
              created_at AS "createdAt", updated_at AS "updatedAt";
  `;
  const row = (await db.query(sql, [user.id, category, period, minutesTarget])).rows[0];
  return Response.json(row, { status: 201 });
}
