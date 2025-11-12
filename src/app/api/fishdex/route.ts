import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fishDex, fish } from "@/db/schema";
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

    // Check if fish exists in fish table
    const fishExists = await db
      .select()
      .from(fish)
      .where(eq(fish.id, fishId))
      .limit(1);

    if (fishExists.length === 0) {
      return NextResponse.json(
        { error: "Fish not found in database" },
        { status: 404 }
      );
    }

    // Check if already in dex
    const existing = await db
      .select()
      .from(fishDex)
      .where(
        and(eq(fishDex.userId, session.user.id), eq(fishDex.fishId, fishId))
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Fish already in dex" },
        { status: 409 }
      );
    }

    // Add to dex (just reference to fish table)
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

    // Get user's fish dex with full fish data (join with fish table)
    const userFishDex = await db
      .select({
        id: fishDex.id,
        fishId: fishDex.fishId,
        createdAt: fishDex.createdAt,
        fish: {
          id: fish.id,
          name: fish.name,
          image: fish.image,
          rarity: fish.rarity,
          latestSightingLatitude: fish.latestSightingLatitude,
          latestSightingLongitude: fish.latestSightingLongitude,
          latestSightingTimestamp: fish.latestSightingTimestamp,
        },
      })
      .from(fishDex)
      .innerJoin(fish, eq(fishDex.fishId, fish.id))
      .where(eq(fishDex.userId, session.user.id));

    // Transform to Fish type format
    const fishes = userFishDex.map((entry) => ({
      id: entry.fish.id,
      name: entry.fish.name,
      image: entry.fish.image || "",
      rarity: entry.fish.rarity,
      latestSighting:
        entry.fish.latestSightingLatitude !== null &&
        entry.fish.latestSightingLongitude !== null &&
        entry.fish.latestSightingTimestamp !== null
          ? {
              latitude: entry.fish.latestSightingLatitude,
              longitude: entry.fish.latestSightingLongitude,
              timestamp: entry.fish.latestSightingTimestamp,
            }
          : null,
    }));

    return NextResponse.json({ fishDex: fishes });
  } catch (error) {
    console.error("Error fetching fish dex:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
