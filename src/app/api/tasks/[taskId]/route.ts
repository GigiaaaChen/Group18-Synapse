import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import type { Task } from "@/types/task";

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

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) => {
  try {
    const { taskId } = await params;
    const user = await requireUser(request);
    const body = (await request.json()) as Partial<Task> & {
      dueDate?: string | null;
    };

    const updates: string[] = [];
    const values: Array<string | number | null | boolean> = [];
    let i = 1;

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) throw new Error("Title is required");
      updates.push(`"title" = $${i++}`);
      values.push(title);
    }

    const is_goal = body.is_goal;
    const dueSnake = body.due_date;
    const dueCamel = (body as any).dueDate;
    const dueProvided = dueSnake !== undefined || dueCamel !== undefined;
    const dueValue = is_goal === true ? null : (dueSnake ?? dueCamel ?? null);
    if (dueProvided || is_goal === true) {
      updates.push(`"dueDate" = $${i++}`);
      values.push(dueValue);
    }

    if (body.category !== undefined) {
      updates.push(`"category" = $${i++}`);
      values.push(body.category ?? "personal");
    }

    if (body.completed !== undefined) {
      updates.push(`"completed" = $${i++}`);
      values.push(Boolean(body.completed));
    }

    if (body.progress !== undefined) {
      const progress = Math.min(Math.max(Number(body.progress) || 0, 0), 100);
      updates.push(`"progress" = $${i++}`);
      values.push(progress);
    }

    if (is_goal !== undefined) {
      updates.push(`"is_goal" = $${i++}`);
      values.push(Boolean(is_goal));
      if (is_goal === true) {
        updates.push(`"goal_cadence" = $${i++}`);
        values.push((body.goal_cadence as any) ?? null);
        updates.push(`"goal_target_per_period" = $${i++}`);
        values.push(body.goal_target_per_period ?? null);
        updates.push(`"goal_category" = $${i++}`);
        values.push(body.goal_category ?? null);
        updates.push(`"goal_active" = $${i++}`);
        values.push(
          typeof body.goal_active === "boolean" ? body.goal_active : true,
        );
      } else if (is_goal === false) {
        updates.push(`"goal_cadence" = NULL, "goal_target_per_period" = NULL, "goal_category" = NULL, "goal_active" = TRUE`);
      }
    } else {
      if (body.goal_cadence !== undefined) {
        updates.push(`"goal_cadence" = $${i++}`);
        values.push((body.goal_cadence as any) ?? null);
      }
      if (body.goal_target_per_period !== undefined) {
        updates.push(`"goal_target_per_period" = $${i++}`);
        values.push(body.goal_target_per_period ?? null);
      }
      if (body.goal_category !== undefined) {
        updates.push(`"goal_category" = $${i++}`);
        values.push(body.goal_category ?? null);
      }
      if (body.goal_active !== undefined) {
        updates.push(`"goal_active" = $${i++}`);
        values.push(Boolean(body.goal_active));
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 },
      );
    }

    updates.push(`"updatedAt" = NOW()`);

    const posUser = i++;
    values.push(user.id);
    const posTask = i++;
    values.push(taskId);

    const result = await db.query(
      `
        UPDATE "task"
        SET ${updates.join(", ")}
        WHERE "userId" = $${posUser}
          AND "id" = $${posTask}
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
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
};
