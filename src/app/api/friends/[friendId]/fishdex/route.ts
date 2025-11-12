import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fishDex, fish, friends } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";

// GET /api/friends/[friendId]/fishdex - Get friend's fish dex
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendId } = await params;

  // Verify that the friendId is actually a friend
  const friendship = await db
    .select()
    .from(friends)
    .where(
      or(
        and(eq(friends.userId, session.user.id), eq(friends.friendId, friendId)),
        and(eq(friends.userId, friendId), eq(friends.friendId, session.user.id))
      )
    )
    .limit(1);

  if (friendship.length === 0) {
    return NextResponse.json(
      { error: "User is not your friend" },
      { status: 403 }
    );
  }

  // Get friend's fish dex with full fish data from database (join with fish table)
  const friendFishDex = await db
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
    .where(eq(fishDex.userId, friendId));

  // Transform to Fish type format with CP score
  const fishes = friendFishDex.map((entry) => ({
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
        : undefined,
    dexEntry: {
      id: entry.id,
      cpScore: entry.cpScore,
      catchAttempts: entry.catchAttempts,
      caughtAt: entry.createdAt,
    },
  }));

  return NextResponse.json({ fishes });
}

