import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const POST = async (req: NextRequest, { params }: any) => {
  const user = await requireUser(req);
  const { goalId } = params;

  await db.query(
    `DELETE FROM "weekly_goal"
     WHERE "id" = $1 AND "userId" = $2`,
    [goalId, user.id]
  );

  return NextResponse.json({ success: true });
};
