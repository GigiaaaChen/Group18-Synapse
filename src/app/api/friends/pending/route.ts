import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

// GET /api/friends/pending - Get pending friend requests sent by user
export const GET = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);

    const result = await db.query(
      `
        SELECT
          f."id" as "friendshipId",
          f."status",
          f."createdAt",
          u."id",
          u."name",
          u."username",
          u."email",
          u."xp",
          u."petHappiness"
        FROM "friendship" f
        INNER JOIN "user" u ON u."id" = f."friendId"
        WHERE f."userId" = $1
          AND f."status" = 'pending'
        ORDER BY f."createdAt" DESC
      `,
      [user.id],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to get pending friends", error);
    return NextResponse.json(
      { error: "Failed to get pending friends" },
      { status: 500 },
    );
  }
};
