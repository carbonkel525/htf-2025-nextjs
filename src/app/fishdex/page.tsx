import { UserInfo } from "@/components/AuthProvider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fishDex, fish } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchFishes } from "@/api/fish"; // Only used for total count
import { getRarityOrder } from "@/utils/rarity";
import FishDexClient from "@/components/FishDexClient";
import { Fish } from "@/types/fish";

export default async function FishDex() {
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
        : null,
  }));

  // Sort by rarity (rarest first)
  const sortedFishes = [...collectedFishes].sort(
    (a, b) => getRarityOrder(a.rarity) - getRarityOrder(b.rarity)
  );

  // Calculate stats - fetch total from external API for completion percentage
  const allFishes = await fetchFishes();
  const totalFishes = allFishes.length;
  const collectedCount = collectedFishes.length;
  const completionPercentage =
    totalFishes > 0 ? Math.round((collectedCount / totalFishes) * 100) : 0;

  // Count by rarity
  const commonCount = collectedFishes.filter(
    (f) => f.rarity.toUpperCase() === "COMMON"
  ).length;
  const rareCount = collectedFishes.filter(
    (f) => f.rarity.toUpperCase() === "RARE"
  ).length;
  const epicCount = collectedFishes.filter(
    (f) => f.rarity.toUpperCase() === "EPIC"
  ).length;

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden">
      {/* Scanline effect */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-[color-mix(in_srgb,var(--color-sonar-green)_10%,transparent)] to-transparent animate-scanline pointer-events-none z-9999"></div>

      {/* Header */}
      <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-3 border-b-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-shadow-[--shadow-glow-text] text-sonar-green">
            FISH DEX
          </div>
          <div className="text-xs text-text-secondary font-mono">
            PERSONAL COLLECTION ARCHIVE
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
              <span className="text-sonar-green font-bold">MY FISH DEX</span>
            </Link>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-3 py-1 rounded">
            <UserInfo />
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-4 border-b-2">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-4 py-3 rounded">
            <div className="text-xs font-mono text-text-secondary mb-1">
              COLLECTED
            </div>
            <div className="text-2xl font-bold text-sonar-green text-shadow-[--shadow-glow-text]">
              {collectedCount}
            </div>
            <div className="text-xs font-mono text-text-secondary mt-1">
              / {totalFishes}
            </div>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-4 py-3 rounded">
            <div className="text-xs font-mono text-text-secondary mb-1">
              COMPLETION
            </div>
            <div className="text-2xl font-bold text-sonar-green text-shadow-[--shadow-glow-text]">
              {completionPercentage}%
            </div>
            <div className="w-full bg-deep-ocean h-1.5 mt-2 rounded overflow-hidden">
              <div
                className="h-full bg-sonar-green transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-4 py-3 rounded">
            <div className="text-xs font-mono text-text-secondary mb-1">
              COMMON
            </div>
            <div className="text-2xl font-bold text-sonar-green text-shadow-[--shadow-glow-text]">
              {commonCount}
            </div>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-4 py-3 rounded">
            <div className="text-xs font-mono text-text-secondary mb-1">
              RARE
            </div>
            <div className="text-2xl font-bold text-warning-amber text-shadow-[--shadow-glow-text]">
              {rareCount}
            </div>
          </div>
          <div className="border border-panel-border shadow-[--shadow-cockpit-border] px-4 py-3 rounded">
            <div className="text-xs font-mono text-text-secondary mb-1">
              EPIC
            </div>
            <div className="text-2xl font-bold text-danger-red text-shadow-[--shadow-glow-text]">
              {epicCount}
            </div>
          </div>
        </div>
      </div>

      {/* Fish Grid */}
      <FishDexClient fishes={sortedFishes} />
    </div>
  );
}
