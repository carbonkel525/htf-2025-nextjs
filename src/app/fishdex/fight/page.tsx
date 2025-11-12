import { UserInfo } from "@/components/AuthProvider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fishDex, fish, friends, user } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import FishFightClient from "@/components/FishFightClient";
import { Fish } from "@/types/fish";
import FriendFightClient from "@/components/FriendFightClient";

export default async function FishFightPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Get user's fish dex with full fish data from database (join with fish table)
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
  const collectedFishes: Fish[] = userFishDex.map((entry) => ({
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

  // Get friends where user is the initiator (userId)
  const friendsAsUser = await db
    .select({
      id: friends.id,
      friend: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      createdAt: friends.createdAt,
    })
    .from(friends)
    .innerJoin(user, eq(friends.friendId, user.id))
    .where(eq(friends.userId, session.user.id));

  // Get friends where user is the friend (friendId)
  const friendsAsFriend = await db
    .select({
      id: friends.id,
      friend: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      createdAt: friends.createdAt,
    })
    .from(friends)
    .innerJoin(user, eq(friends.userId, user.id))
    .where(eq(friends.friendId, session.user.id));

  // Combine both lists
  const allFriends = [...friendsAsUser, ...friendsAsFriend];

  // Transform to simplify
  const friendsList = allFriends.map((f) => ({
    id: f.id,
    userId: f.friend.id,
    name: f.friend.name,
    email: f.friend.email,
    image: f.friend.image,
    createdAt: f.createdAt,
  }));

  return (
    <div className="w-full flex flex-col relative">
      {/* Scanline effect */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-[color-mix(in_srgb,var(--color-sonar-green)_10%,transparent)] to-transparent animate-scanline pointer-events-none z-9999"></div>

      {/* Header */}
      <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-3 border-b-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-shadow-[--shadow-glow-text] text-sonar-green">
            FISH ARENA
          </div>
          <div className="text-xs text-text-secondary font-mono">
            BATTLE YOUR FISH
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <Link href="/">
              <span className="text-text-secondary hover:text-sonar-green transition-colors">
                TRACKER
              </span>
            </Link>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <Link href="/fishdex">
              <span className="text-text-secondary hover:text-sonar-green transition-colors">
                MY FISH DEX
              </span>
            </Link>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <Link href="/fishdex/fight">
              <span className="text-sonar-green font-bold">FIGHT</span>
            </Link>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <UserInfo />
          </div>
        </div>
      </div>

      {/* Fight Arena */}
      <FriendFightClient userFishes={collectedFishes} friends={friendsList} />
    </div>
  );
}
