import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import type { Task, GoalFrequency } from "@/types/task";

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
    let isCompletingTask = false;
    let isUncompletingTask = false;
    let taskDueDate: string | null = null;
    let taskIsGoal = false;
    let taskGoalFrequency: GoalFrequency | null = null;

    // Fetch current task state if changing completion status
    if (body.completed !== undefined) {
      const currentTask = await db.query(
        `SELECT "dueDate", "completed", "isGoal", "goalFrequency"
         FROM "task"
         WHERE "id" = $1 AND "userId" = $2`,
        [taskId, user.id],
      );

      if (currentTask.rows[0]) {
        taskDueDate = currentTask.rows[0].dueDate;
        taskIsGoal = currentTask.rows[0].isGoal;
        taskGoalFrequency = currentTask.rows[0].goalFrequency as GoalFrequency;

        if (body.completed === true && !currentTask.rows[0].completed) {
          isCompletingTask = true;
        } else if (body.completed === false && currentTask.rows[0].completed) {
          isUncompletingTask = true;
        }
      }
    }

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

      // Set completedAt when marking as complete
      if (body.completed === true) {
        updates.push(`"completedAt" = NOW()`);
      } else {
        updates.push(`"completedAt" = NULL`);
      }
    }

    if (body.progress !== undefined) {
      const progress = Math.min(Math.max(Number(body.progress) || 0, 0), 100);
      updates.push(`"progress" = $${index++}`);
      values.push(progress);
    }

    if (body.isGoal !== undefined) {
      updates.push(`"isGoal" = $${index++}`);
      values.push(Boolean(body.isGoal));

      if (body.isGoal) {
        updates.push(`"dueDate" = NULL`);

        const freq = body.goalFrequency;
        if (freq !== "daily" && freq !== "weekly") {
          throw new Error(
            "Goal frequency must be 'daily' or 'weekly' when setting a goal",
          );
        }
        updates.push(`"goalFrequency" = $${index++}`);
        values.push(freq);
      } else {
        updates.push(`"goalFrequency" = NULL`);
      }
    } else if (body.goalFrequency !== undefined) {
      if (body.goalFrequency === null) {
        updates.push(`"goalFrequency" = NULL`);
      } else if (
        body.goalFrequency === "daily" ||
        body.goalFrequency === "weekly"
      ) {
        updates.push(`"goalFrequency" = $${index++}`);
        values.push(body.goalFrequency);
      } else {
        throw new Error("Invalid goal frequency");
      }
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
          "progress",
          "isGoal",
          "goalFrequency",
          to_char("completedAt", 'YYYY-MM-DD"T"HH24:MI:SS') AS "completedAt"
      `,
      values,
    );

    const row = result.rows[0];

    if (!row) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Handle XP changes for completing/uncompleting tasks
    if (isCompletingTask || isUncompletingTask) {
      const completedAt = new Date();
      const dueDate = taskDueDate ? new Date(taskDueDate) : null;
      let xpChange = 0;

      if (taskIsGoal && taskGoalFrequency === "weekly") {
        xpChange = 30;
      }
      else if (dueDate) {
        const completedDate = new Date(completedAt.toDateString());
        const dueDateOnly = new Date(dueDate.toDateString());

        if (completedDate <= dueDateOnly) {
          xpChange = 10;
        } else {
          xpChange = 5;
        }
      }
      else {
        xpChange = 10;
      }

      // Add XP for completing, subtract XP for uncompleting
      const xpModifier = isCompletingTask ? xpChange : -xpChange;

      await db.query(
        `UPDATE "user" SET "xp" = GREATEST(COALESCE("xp", 0) + $1, 0) WHERE "id" = $2`,
        [xpModifier, user.id],
      );
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

    /********** deleting task and modifying current xp */ 
    const existing = await db.query(
      `
        SELECT "completed", "dueDate", "completedAt"
        FROM "task"
        WHERE "userId" = $1
          AND "id" = $2
      `,
      [user.id, taskId],
    );

    const row = existing.rows[0] as
      | { completed: boolean; dueDate: string | null; completedAt: string | null }
      | undefined; // using typescript type assertion

    if (!row) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If the task was completed, subtract the XP it had given
    let xpModifier = 0;

    if (row.completed) {
      const dueDate = row.dueDate ? new Date(row.dueDate) : null;
      const completedAt = row.completedAt ? new Date(row.completedAt) : new Date();

      let xpChange = 0;

      if (dueDate) {
        const completedDate = new Date(completedAt.toDateString());
        const dueDateOnly = new Date(dueDate.toDateString());

        // on time
        if (completedDate <= dueDateOnly) {
          xpChange = 10; 
        } 
        // late
        else {
          xpChange = 5; 
        }
      } 
      // no due date
      else {
        xpChange = 10;
      }

      // Deleting a completed task should REMOVE that XP
      xpModifier = -xpChange;
    }

    if (xpModifier !== 0) {
      await db.query(
        `UPDATE "user" SET "xp" = GREATEST(COALESCE("xp", 0) + $1, 0) WHERE "id" = $2`,
        [xpModifier, user.id],
      );
    }

    /********** finished deleting task and modifying current xp */

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
