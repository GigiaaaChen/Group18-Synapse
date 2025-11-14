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

    // Handle XP and coin changes for completing/uncompleting tasks
    if (isCompletingTask || isUncompletingTask) {
      const completedAt = new Date();
      const dueDate = taskDueDate ? new Date(taskDueDate) : null;
      let xpChange = 0;
      let coinChange = 1; // Base coin reward

      // Calculate time spent on task from task_session table
      const sessionResult = await db.query(
        `SELECT
          COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(stoppedat, NOW()) - startedat))), 0) as total_seconds
         FROM task_session
         WHERE taskid = $1 AND userid = $2`,
        [taskId, user.id],
      );

      const totalSeconds = Number(sessionResult.rows[0]?.total_seconds || 0);
      const totalMinutes = totalSeconds / 60;

      if (taskIsGoal && taskGoalFrequency === "weekly") {
        xpChange = 30;
        coinChange = 3; // 3x coins for weekly goals

        // Bonus XP for time spent (1 XP per 10 minutes)
        xpChange += Math.floor(totalMinutes / 10);
      }
      else if (dueDate) {
        const completedDate = new Date(completedAt.toDateString());
        const dueDateOnly = new Date(dueDate.toDateString());

        if (completedDate <= dueDateOnly) {
          xpChange = 10;
        } else {
          xpChange = 5; // Late penalty for XP
        }
        // Coins stay 1 regardless of late/on-time

        // Bonus XP for time spent (1 XP per 10 minutes)
        xpChange += Math.floor(totalMinutes / 10);
      }
      else {
        xpChange = 10;

        // Bonus XP for time spent (1 XP per 10 minutes)
        xpChange += Math.floor(totalMinutes / 10);
      }

      // Add for completing, subtract for uncompleting
      const xpModifier = isCompletingTask ? xpChange : -xpChange;
      const coinModifier = isCompletingTask ? coinChange : -coinChange;

      // Store awarded amounts in task table
      if (isCompletingTask) {
        await db.query(
          `UPDATE task SET "xpAwarded" = $1, "coinsAwarded" = $2 WHERE id = $3`,
          [xpChange, coinChange, taskId],
        );
      } else {
        // Reset awarded amounts when uncompleting
        await db.query(
          `UPDATE task SET "xpAwarded" = 0, "coinsAwarded" = 0 WHERE id = $1`,
          [taskId],
        );
      }

      // Update user XP
      await db.query(
        `UPDATE "user" SET "xp" = GREATEST(COALESCE("xp", 0) + $1, 0) WHERE "id" = $2`,
        [xpModifier, user.id],
      );

      // Update pet coins (create pet record if it doesn't exist)
      await db.query(
        `
        INSERT INTO pet (id, "userId", coins)
        VALUES (gen_random_uuid()::text, $1, $2)
        ON CONFLICT ("userId")
        DO UPDATE SET coins = GREATEST(COALESCE(pet.coins, 0) + $2, 0)
        `,
        [user.id, coinModifier],
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

    /********** deleting task and modifying current xp and coins */
    const existing = await db.query(
      `
        SELECT "completed", "xpAwarded", "coinsAwarded"
        FROM "task"
        WHERE "userId" = $1
          AND "id" = $2
      `,
      [user.id, taskId],
    );

    const row = existing.rows[0] as
      | { completed: boolean; xpAwarded: number; coinsAwarded: number }
      | undefined;

    if (!row) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If the task was completed, subtract the XP and coins it had given
    if (row.completed) {
      const xpModifier = -(row.xpAwarded || 0);
      const coinModifier = -(row.coinsAwarded || 0);

      // Update user XP
      if (xpModifier !== 0) {
        await db.query(
          `UPDATE "user" SET "xp" = GREATEST(COALESCE("xp", 0) + $1, 0) WHERE "id" = $2`,
          [xpModifier, user.id],
        );
      }

      // Update pet coins
      if (coinModifier !== 0) {
        await db.query(
          `UPDATE pet SET coins = GREATEST(COALESCE(coins, 0) + $1, 0) WHERE "userId" = $2`,
          [coinModifier, user.id],
        );
      }
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
