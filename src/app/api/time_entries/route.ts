import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session"; // <- singular

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO "time_entry" ("id","user_id","task_id") VALUES ($1,$2,$3)`,
      [id, user.id, taskId]
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/time_entries failed:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Only stop your own timer
    const result = await db.query(
      `UPDATE "time_entry"
         SET "ended_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1 AND "user_id" = $2
       RETURNING "id"`,
      [id, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Timer not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PATCH /api/time_entries failed:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
