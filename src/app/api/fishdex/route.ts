import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fishDex, fish } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { updateChallengeProgress } from "@/services/challengeService";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fishId, cpScore, catchAttempts } = body;

    if (!fishId) {
      return NextResponse.json(
        { error: "Fish ID is required" },
        { status: 400 }
      );
    }

    if (cpScore === undefined || catchAttempts === undefined) {
      return NextResponse.json(
        { error: "CP score and catch attempts are required" },
        { status: 400 }
      );
    }

    // Validate CP score range (0-1000)
    if (cpScore < 0 || cpScore > 1000) {
      return NextResponse.json(
        { error: "CP score must be between 0 and 1000" },
        { status: 400 }
      );
    }

    // Validate catch attempts (minimum 1)
    if (catchAttempts < 1) {
      return NextResponse.json(
        { error: "Catch attempts must be at least 1" },
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

    // Note: We removed the unique constraint, so users can have multiple catches of the same fish
    // Each catch will have its own CP score based on performance

    // Add to dex with CP score and catch attempts
    const now = new Date();
    await db.insert(fishDex).values({
      id: nanoid(),
      userId: session.user.id,
      fishId,
      cpScore,
      catchAttempts,
      createdAt: now,
      updatedAt: now,
    });

    // Update challenge progress for the caught fish
    try {
      await updateChallengeProgress(session.user.id, fishId);
    } catch (error) {
      // Log error but don't fail the request if challenge update fails
      console.error("Error updating challenge progress:", error);
    }

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
        cpScore: fishDex.cpScore,
        catchAttempts: fishDex.catchAttempts,
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

    // Transform to Fish type format with CP score
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
      dexEntry: {
        id: entry.id,
        cpScore: entry.cpScore,
        catchAttempts: entry.catchAttempts,
        caughtAt: entry.createdAt,
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
