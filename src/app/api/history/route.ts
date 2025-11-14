import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { getLevel, getPetStage } from "@/lib/pet";

interface TaskRow {
	id: string;
	title: string;
	completedAt: string;
	xpAwarded: number;
	coinsAwarded: number;
}

export const GET = async (request: NextRequest) => {
	try {
		const user = await requireUser(request);

		// Fetch all completed tasks with XP and coins awarded
		const tasksResult = await db.query(
			`SELECT
				id,
				title,
				to_char("completedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "completedAt",
				COALESCE("xpAwarded", 0) as "xpAwarded",
				COALESCE("coinsAwarded", 0) as "coinsAwarded"
			FROM task
			WHERE "userId" = $1 AND completed = true AND "completedAt" IS NOT NULL
			ORDER BY "completedAt" ASC`,
			[user.id],
		);

		const tasks = tasksResult.rows.map((row: TaskRow) => ({
			id: row.id,
			title: row.title,
			completedAt: row.completedAt,
			xpAwarded: Number(row.xpAwarded),
			coinsAwarded: Number(row.coinsAwarded),
		}));

		// Generate evolution history based on XP milestones
		const evolutions: Array<{
			id: string;
			level: number;
			form: string;
			evolvedAt: string;
		}> = [];

		let runningXP = 0;
		let currentLevel = 1;

		for (const task of tasks) {
			runningXP += task.xpAwarded;
			const newLevel = getLevel(runningXP);

			// If level changed, record an evolution
			if (newLevel > currentLevel) {
				evolutions.push({
					id: `evo-${newLevel}`,
					level: newLevel,
					form: getPetStage(newLevel),
					evolvedAt: task.completedAt,
				});
				currentLevel = newLevel;
			}
		}

		return NextResponse.json({
			tasks,
			evolutions,
		});
	} catch (error) {
		if (error instanceof UnauthorizedError) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		console.error("Failed to fetch history:", error);
		return NextResponse.json(
			{ error: "Failed to fetch history" },
			{ status: 500 },
		);
	}
};
