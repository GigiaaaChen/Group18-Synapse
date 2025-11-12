import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

// GET /api/friends - Get user friends list
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
        INNER JOIN "user" u ON (
          CASE
            WHEN f."userId" = $1 THEN u."id" = f."friendId"
            WHEN f."friendId" = $1 THEN u."id" = f."userId"
          END
        )
        WHERE (f."userId" = $1 OR f."friendId" = $1)
          AND f."status" = 'accepted'
        ORDER BY u."name" ASC
      `,
      [user.id],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to get friends", error);
    return NextResponse.json(
      { error: "Failed to get friends" },
      { status: 500 },
    );
  }
};

// POST /api/friends - Send friend request
export const POST = async (request: NextRequest) => {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Find the user by username
    const targetUser = await db.query(
      `SELECT "id", "username" FROM "user" WHERE "username" = $1`,
      [username],
    );

    if (!targetUser.rows[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friendId = targetUser.rows[0].id;

    // Check if already friends or request exists
    const existing = await db.query(
      `
        SELECT * FROM "friendship"
        WHERE ("userId" = $1 AND "friendId" = $2)
           OR ("userId" = $2 AND "friendId" = $1)
      `,
      [user.id, friendId],
    );

    if (existing.rows[0]) {
      return NextResponse.json(
        { error: "Friend request already exists or you are already friends" },
        { status: 400 },
      );
    }

    // Create friend request
    const result = await db.query(
      `
        INSERT INTO "friendship" ("userId", "friendId", "status")
        VALUES ($1, $2, 'pending')
        RETURNING "id", "userId", "friendId", "status", "createdAt"
      `,
      [user.id, friendId],
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to send friend request", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 },
    );
  }
};
