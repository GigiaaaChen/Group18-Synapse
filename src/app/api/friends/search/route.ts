import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

// GET /api/friends/search?q=username
export const GET = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const result = await db.query(
      `
        SELECT
          u."id",
          u."name",
          u."username",
          u."xp",
          p."equippedItems",
          calculate_pet_happiness(u."id") as "petHappiness"
        FROM "user" u
        LEFT JOIN "pet" p ON p."userId" = u."id"
        WHERE u."username" ILIKE $1
          AND u."id" != $2
          AND NOT EXISTS (
            SELECT 1 FROM "friendship" f
            WHERE (f."userId" = $2 AND f."friendId" = u."id")
               OR (f."friendId" = $2 AND f."userId" = u."id")
          )
        LIMIT 10
      `,
      [`%${query}%`, user.id],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to search users", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 },
    );
  }
};
