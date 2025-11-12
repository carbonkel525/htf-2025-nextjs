import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fishDex } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fishId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fishId } = await params;

    console.log("Deleting fish from dex:", { fishId, userId: session.user.id });

    // First check if the entry exists
    const existing = await db
      .select()
      .from(fishDex)
      .where(
        and(
          eq(fishDex.userId, session.user.id),
          eq(fishDex.fishId, fishId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Fish not found in dex" },
        { status: 404 }
      );
    }

    // Delete from dex
    await db
      .delete(fishDex)
      .where(
        and(
          eq(fishDex.userId, session.user.id),
          eq(fishDex.fishId, fishId)
        )
      );

    console.log("Fish deleted successfully");

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Error deleting fish from dex:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}