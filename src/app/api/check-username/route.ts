import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET /api/check-username?username=johndoe
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username || username.length < 3) {
      return NextResponse.json(
        { available: false, error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      // sanity check before doing anything
      return NextResponse.json(
        {
          available: false,
          error:
            "Username can only contain lowercase letters, numbers, and underscores",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `SELECT "username" FROM "user" WHERE "username" = $1`,
      [username]
    );

    const available = result.rows.length === 0;

    return NextResponse.json({ available, username });
  } catch (error) {
    console.error("Failed to check username", error);
    return NextResponse.json(
      { error: "Failed to check username" },
      { status: 500 }
    );
  }
};
