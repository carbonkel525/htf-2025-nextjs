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
    const { fishId, name, image, rarity, latestSighting } = body;

    if (!fishId || !name || !rarity || !latestSighting) {
      return NextResponse.json(
        { error: "Fish data is incomplete" },
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

    // Add to dex with full fish data
    const now = new Date();
    await db.insert(fishDex).values({
      id: nanoid(),
      userId: session.user.id,
      fishId,
      name,
      image: image || null,
      rarity,
      latestSightingLatitude: latestSighting.latitude,
      latestSightingLongitude: latestSighting.longitude,
      latestSightingTimestamp: latestSighting.timestamp,
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
  
      // Get user's fish dex with full fish data
      const userFishDex = await db
        .select({
          id: fishDex.id,
          fishId: fishDex.fishId,
          name: fishDex.name,
          image: fishDex.image,
          rarity: fishDex.rarity,
          latestSightingLatitude: fishDex.latestSightingLatitude,
          latestSightingLongitude: fishDex.latestSightingLongitude,
          latestSightingTimestamp: fishDex.latestSightingTimestamp,
          createdAt: fishDex.createdAt,
        })
        .from(fishDex)
        .where(eq(fishDex.userId, session.user.id));

      // Transform to Fish type format
      const fishes = userFishDex.map((entry) => ({
        id: entry.fishId,
        name: entry.name,
        image: entry.image || "",
        rarity: entry.rarity,
        latestSighting: {
          latitude: entry.latestSightingLatitude,
          longitude: entry.latestSightingLongitude,
          timestamp: entry.latestSightingTimestamp,
        },
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
