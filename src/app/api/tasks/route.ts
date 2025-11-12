import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import type { Task, TaskDraft } from "@/types/task";

interface TaskRow {
  id: string;
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;
  completedAt: string | null;
}

const mapRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  dueDate: row.dueDate ? row.dueDate : null,
  category: row.category,
  completed: row.completed,
  progress: row.progress,
  completedAt: row.completedAt,
});

const sanitizeDraft = (draft: TaskDraft) => {
  const title = draft.title?.trim();
  if (!title) {
    throw new Error("Title is required");
  }

  const progress =
    typeof draft.progress === "number"
      ? Math.min(Math.max(draft.progress, 0), 100)
      : 0;

  return {
    title,
    dueDate: draft.dueDate || null,
    category: draft.category || "personal",
    completed: Boolean(draft.completed),
    progress,
  };
};

export const GET = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);

    const result = await db.query(
      `
        SELECT
          id,
          "title",
          to_char("dueDate", 'YYYY-MM-DD') AS "dueDate",
          "category",
          "completed",
          "progress",
          to_char("completedAt", 'YYYY-MM-DD"T"HH24:MI:SS') AS "completedAt"
        FROM "task"
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
      `,
      [user.id],
    );

    return NextResponse.json(result.rows.map(mapRowToTask));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to load tasks", error);
    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 },
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as Partial<TaskDraft>;

    const prepared = sanitizeDraft({
      title: body.title ?? "",
      dueDate: body.dueDate ?? null,
      category: body.category ?? "personal",
      completed: body.completed ?? false,
      progress: body.progress ?? 0,
    });

    const id = crypto.randomUUID();

    const result = await db.query(
      `
        INSERT INTO "task" (
          "id",
          "userId",
          "title",
          "dueDate",
          "category",
          "completed",
          "progress"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          "title",
          to_char("dueDate", 'YYYY-MM-DD') AS "dueDate",
          "category",
          "completed",
          "progress",
          to_char("completedAt", 'YYYY-MM-DD"T"HH24:MI:SS') AS "completedAt"
      `,
      [
        id,
        user.id,
        prepared.title,
        prepared.dueDate,
        prepared.category,
        prepared.completed,
        prepared.progress,
      ],
    );

    return NextResponse.json(mapRowToTask(result.rows[0]), { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};
