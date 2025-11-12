import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fishDex } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fishId } = body;

    if (!fishId) {
      return NextResponse.json(
        { error: "Fish ID is required" },
        { status: 400 }
      );
    }

    // Check if already in dex
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

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Fish already in dex" },
        { status: 409 }
      );
    }

    // Add to dex
    const now = new Date();
    await db.insert(fishDex).values({
      id: nanoid(),
      userId: session.user.id,
      fishId,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding fish to dex:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
  
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      // Get user's fish dex - just return the fish IDs
      // The frontend can fetch full fish details from the external API
      const userFishDex = await db
        .select({
          id: fishDex.id,
          fishId: fishDex.fishId,
          createdAt: fishDex.createdAt,
        })
        .from(fishDex)
        .where(eq(fishDex.userId, session.user.id));
  
      return NextResponse.json({ fishDex: userFishDex });
    } catch (error) {
      console.error("Error fetching fish dex:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
