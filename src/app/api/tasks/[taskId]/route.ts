import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import type { Task } from "@/types/task";

interface TaskRow {
  id: string;
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;
}

const mapRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  dueDate: row.dueDate ? row.dueDate : null,
  category: row.category,
  completed: row.completed,
  progress: row.progress,
});

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) => {
  try {
    const { taskId } = await params;
    const user = await requireUser(request);
    const body = (await request.json()) as Partial<Task>;
    const updates: string[] = [];
    const values: Array<string | number | null | boolean> = [];
    let index = 1;

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) {
        throw new Error("Title is required");
      }
      updates.push(`"title" = $${index++}`);
      values.push(title);
    }

    if (body.dueDate !== undefined) {
      updates.push(`"dueDate" = $${index++}`);
      values.push(body.dueDate || null);
    }

    if (body.category !== undefined) {
      updates.push(`"category" = $${index++}`);
      values.push(body.category || "personal");
    }

    if (body.completed !== undefined) {
      updates.push(`"completed" = $${index++}`);
      values.push(Boolean(body.completed));
    }

    if (body.progress !== undefined) {
      const progress = Math.min(Math.max(Number(body.progress) || 0, 0), 100);
      updates.push(`"progress" = $${index++}`);
      values.push(progress);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 },
      );
    }

    updates.push(`"updatedAt" = NOW()`);

    const userParamPosition = index++;
    values.push(user.id);
    const taskParamPosition = index++;
    values.push(taskId);

    const result = await db.query(
      `
        UPDATE "task"
        SET ${updates.join(", ")}
        WHERE "userId" = $${userParamPosition}
          AND "id" = $${taskParamPosition}
        RETURNING
          id,
          "title",
          to_char("dueDate", 'YYYY-MM-DD') AS "dueDate",
          "category",
          "completed",
          "progress"
      `,
      values,
    );

    const row = result.rows[0];

    if (!row) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(mapRowToTask(row));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to update task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) => {
  try {
    const { taskId } = await params;
    const user = await requireUser(request);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to delete task", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
};
