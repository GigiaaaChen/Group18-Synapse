import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

// PATCH /api/friends/[friendshipId] accpet/decline a FR. should maybe change this 
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> },
) => {
  try {
    const { friendshipId } = await params;
    const user = await requireUser(request);
    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Verify the friend request is for this user
    const friendship = await db.query(
      `SELECT * FROM "friendship" WHERE "id" = $1 AND "friendId" = $2 AND "status" = 'pending'`,
      [friendshipId, user.id],
    );

    if (!friendship.rows[0]) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 },
      );
    }

    if (action === 'accept') {
      const result = await db.query(
        `UPDATE "friendship" SET "status" = 'accepted' WHERE "id" = $1 RETURNING *`,
        [friendshipId],
      );
      return NextResponse.json(result.rows[0]);
    } else {
      await db.query(`DELETE FROM "friendship" WHERE "id" = $1`, [friendshipId]);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to update friend request", error);
    return NextResponse.json(
      { error: "Failed to update friend request" },
      { status: 500 },
    );
  }
};

// DELETE /api/friends/[friendshipId] remove a friend
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> },
) => {
  try {
    const { friendshipId } = await params;
    const user = await requireUser(request);

    const result = await db.query(
      `
        DELETE FROM "friendship"
        WHERE "id" = $1
          AND ("userId" = $2 OR "friendId" = $2)
        RETURNING "id"
      `,
      [friendshipId, user.id],
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: "Friendship not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to remove friend", error);
    return NextResponse.json(
      { error: "Failed to remove friend" },
      { status: 500 },
    );
  }
};
