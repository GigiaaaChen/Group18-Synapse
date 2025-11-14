import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

export const GET = async (request: NextRequest) => {
	try {
		const user = await requireUser(request);

		const result = await db.query(
			`SELECT xp FROM "user" WHERE id = $1`,
			[user.id],
		);

		if (!result.rows[0]) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({
			xp: result.rows[0].xp || 0,
		});
	} catch (error) {
		if (error instanceof UnauthorizedError) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		console.error("Failed to fetch user data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user data" },
			{ status: 500 },
		);
	}
};
