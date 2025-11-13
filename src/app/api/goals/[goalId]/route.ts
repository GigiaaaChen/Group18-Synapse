import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { goalId: string } }
) => {
  try {
    const user = await requireUser(req);
    const { goalId } = params;
    const body = await req.json();

    await db.query(
      `UPDATE "goal"
       SET "title" = $1, "category" = $2
       WHERE "id" = $3 AND "userId" = $4`,
      [body.title, body.category, goalId, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 400 });
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { goalId: string } }
) => {
  try {
    const user = await requireUser(req);
    const { goalId } = params;

    await db.query(
      `DELETE FROM "goal"
       WHERE "id" = $1 AND "userId" = $2`,
      [goalId, user.id]
    );

    // "goal_occurrence" rows will be deleted via ON DELETE CASCADE
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 400 });
  }
};
