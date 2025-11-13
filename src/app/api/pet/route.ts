// src/app/api/pet/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // get current XP from the user table
    const result = await db.query(
      `SELECT xp FROM "user" WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const xp = result.rows[0].xp ?? 0;

    // general pet state shape 
    return NextResponse.json({
      userId,
      xp,
      petState: {
        xp,
      },
    });
  } catch (err) {
    console.error("Error in /api/pet:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
