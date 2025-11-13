import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import type { Task, TaskDraft, GoalFrequency } from "@/types/task";

interface TaskRow {
  id: string;
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;
  completedAt: string | null;
  isGoal: boolean;
  goalFrequency: GoalFrequency;
}

const mapRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  dueDate: row.dueDate ? row.dueDate : null,
  category: row.category,
  completed: row.completed,
  progress: row.progress,
  completedAt: row.completedAt,
  isGoal: row.isGoal,
  goalFrequency: row.goalFrequency,
});

const sanitizeDraft = (draft: Partial<TaskDraft>): TaskDraft => {
  const title = draft.title?.trim();
  if (!title) {
    throw new Error("Title is required");
  }

  const category = draft.category?.trim() || "personal";
  const completed = draft.completed ?? false;

  const progress =
    typeof draft.progress === "number" && draft.progress >= 0
      ? draft.progress
      : 0;

  let dueDate: string | null = draft.dueDate ?? null;
  if (dueDate === "") {
    dueDate = null;
  }

  const isGoal = draft.isGoal ?? false;
  let goalFrequency: GoalFrequency = draft.goalFrequency ?? null;

  if (isGoal) {
    dueDate = null;

    if (goalFrequency !== "daily" && goalFrequency !== "weekly") {
      throw new Error("Goal frequency must be 'daily' or 'weekly' for goals");
    }
  } else {
    goalFrequency = null;
  }

  return {
    title,
    category,
    completed,
    progress,
    dueDate,
    isGoal,
    goalFrequency,
  };
};

export const GET = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);

  const result = await db.query<TaskRow>(
    `
          SELECT
            "id",
            "title",
            to_char("dueDate", 'YYYY-MM-DD') AS "dueDate",
            "category",
            "completed",
            "progress",
            "isGoal",
            "goalFrequency",
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
      title: body.title,
      dueDate: body.dueDate,
      category: body.category,
      completed: body.completed,
      progress: body.progress,
      isGoal: body.isGoal,
      goalFrequency: body.goalFrequency,
    });

    const id = crypto.randomUUID();

    const result = await db.query<TaskRow>(
      `
        INSERT INTO "task" (
          "id",
          "userId",
          "title",
          "dueDate",
          "category",
          "completed",
          "progress",
          "isGoal",
          "goalFrequency"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          "id",
          "title",
          to_char("dueDate", 'YYYY-MM-DD') AS "dueDate",
          "category",
          "completed",
          "progress",
          "completedAt",
          "isGoal",
          "goalFrequency"
      `,
      [
        id,
        user.id,
        prepared.title,
        prepared.dueDate,
        prepared.category,
        prepared.completed,
        prepared.progress,
        prepared.isGoal,
        prepared.goalFrequency,
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
