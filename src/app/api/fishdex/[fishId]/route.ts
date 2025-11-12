import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fishDex } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fishId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fishId } = params;

    // Delete from dex
    const result = await db
      .delete(fishDex)
      .where(
        and(
          eq(fishDex.userId, session.user.id),
          eq(fishDex.fishId, fishId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fish from dex:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}