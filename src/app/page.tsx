import { fetchFishes } from "@/api/fish";
import { getRarityOrder } from "@/utils/rarity";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FishTrackerLayout from "@/components/FishTrackerLayout";
import { db } from "@/db";
import { fish } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Fish } from "@/types/fish";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Fetch fishes from external API
  const externalFishes: Fish[] = await fetchFishes();

  // Sync fishes to database (upsert - insert or update)
  const now = new Date();
  for (const fishData of externalFishes) {
    // Check if fish exists
    const existing = await db
      .select()
      .from(fish)
      .where(eq(fish.id, fishData.id))
      .limit(1);

    if (existing.length > 0) {
      // Update existing fish
      await db
        .update(fish)
        .set({
          name: fishData.name,
          image: fishData.image || null,
          rarity: fishData.rarity,
          latestSightingLatitude: fishData.latestSighting.latitude,
          latestSightingLongitude: fishData.latestSighting.longitude,
          latestSightingTimestamp: fishData.latestSighting.timestamp,
          updatedAt: now,
        })
        .where(eq(fish.id, fishData.id));
    } else {
      // Insert new fish
      await db.insert(fish).values({
        id: fishData.id,
        name: fishData.name,
        image: fishData.image || null,
        rarity: fishData.rarity,
        latestSightingLatitude: fishData.latestSighting.latitude,
        latestSightingLongitude: fishData.latestSighting.longitude,
        latestSightingTimestamp: fishData.latestSighting.timestamp,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Sort fish by rarity (rarest first)
  const sortedFishes = [...externalFishes].sort(
    (a, b) => getRarityOrder(a.rarity) - getRarityOrder(b.rarity)
  );

  return (
    <FishTrackerLayout fishes={externalFishes} sortedFishes={sortedFishes} />
  );
}
