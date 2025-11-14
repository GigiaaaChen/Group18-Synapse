import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { getLevelProgress, getPetStage } from "@/lib/pet";

export const GET = async (request: NextRequest) => {
	try {
		const user = await requireUser(request);

		// Get user XP
		const userResult = await db.query(`SELECT xp FROM "user" WHERE id = $1`, [
			user.id,
		]);

		if (userResult.rows.length === 0) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const { xp } = userResult.rows[0];

		// Get or create pet record
		const petResult = await db.query(
			`
      INSERT INTO pet (id, "userId", coins)
      VALUES (gen_random_uuid()::text, $1, 0)
      ON CONFLICT ("userId")
      DO UPDATE SET "userId" = EXCLUDED."userId"
      RETURNING coins, "equippedItems"
    `,
			[user.id],
		);

		const { coins, equippedItems } = petResult.rows[0];

		// Calculate happiness using PostgreSQL function
		const happinessResult = await db.query(
			`SELECT calculate_pet_happiness($1) as happiness`,
			[user.id],
		);
		const happiness = happinessResult.rows[0]?.happiness || 100;

		// Calculate level and progress
		const levelProgress = getLevelProgress(xp || 0);
		const stage = getPetStage(levelProgress.level);

		return NextResponse.json({
			level: levelProgress.level,
			xp: xp || 0,
			currentXP: levelProgress.currentXP,
			maxXP: levelProgress.maxXP,
			percentage: levelProgress.percentage,
			stage,
			coins: coins || 0,
			happiness,
			equippedItems: equippedItems || [],
		});
	} catch (error) {
		if (error instanceof UnauthorizedError) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		console.error("Failed to fetch pet data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch pet data" },
			{ status: 500 },
		);
	}
};
