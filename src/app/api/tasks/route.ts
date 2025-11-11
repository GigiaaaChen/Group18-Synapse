import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import type { Task, TaskDraft } from "@/types/task";

interface TaskRow {
  id: string;
  userId: string;
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;
  is_goal: boolean;
  goal_cadence: "daily" | "weekly" | null;
  goal_target_per_period: number | null;
  goal_category: string | null;
  goal_active: boolean;
}

const mapRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  user_id: row.userId,
  title: row.title,
  category: row.category,
  due_date: row.dueDate,
  completed: row.completed,
  progress: row.progress,
  is_goal: row.is_goal,
  goal_cadence: row.goal_cadence,
  goal_target_per_period: row.goal_target_per_period,
  goal_category: row.goal_category,
  goal_active: row.goal_active,
});

const sanitizeDraft = (draft: TaskDraft) => {
  const title = draft.title?.trim();
  if (!title) throw new Error("Title is required");
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
    is_goal: Boolean(draft.is_goal),
    goal_cadence: draft.goal_cadence ?? null,
    goal_target_per_period: draft.goal_target_per_period ?? null,
    goal_category: draft.goal_category ?? null,
    goal_active: draft.goal_active ?? true,
  };
};

export const GET = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);

    const result = await db.query(
      `
        SELECT
          id,
          "userId",
          "title",
          to_char("dueDate", 'YYYY-MM-DD') AS "dueDate",
          "category",
          "completed",
          "progress",
          "is_goal",
          "goal_cadence",
          "goal_target_per_period",
          "goal_category",
          "goal_active"
        FROM "task"
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
      `,
      [user.id]
    );

    return NextResponse.json(result.rows.map(mapRowToTask));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 }
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
      is_goal: body.is_goal,
      goal_cadence: body.goal_cadence,
      goal_target_per_period: body.goal_target_per_period,
      goal_category: body.goal_category,
      goal_active: body.goal_active,
    });

    const id = crypto.randomUUID();
    const dueDateFinal = prepared.is_goal ? null : prepared.dueDate;

    const result = await db.query(
      `
        INSERT INTO "task" (
          "id",
          "userId",
          "title",
          "dueDate",
          "category",
          "completed",
          "progress",
          "is_goal",
          "goal_cadence",
          "goal_target_per_period",
          "goal_category",
          "goal_active"
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING
          id,
          "userId",
          "title",
          to_char("dueDate", 'YYYY-MM-DD') AS "dueDate",
          "category",
          "completed",
          "progress",
          "is_goal",
          "goal_cadence",
          "goal_target_per_period",
          "goal_category",
          "goal_active"
      `,
      [
        id,
        user.id,
        prepared.title,
        dueDateFinal,
        prepared.category,
        prepared.completed,
        prepared.progress,
        prepared.is_goal,
        prepared.goal_cadence,
        prepared.goal_target_per_period,
        prepared.goal_category,
        prepared.goal_active,
      ]
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
