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
      const existingFish = existing[0];
      // Determine which latestSighting to use - prefer the newer one
      const externalSighting = fishData.latestSighting;
      const localSighting = existingFish.latestSightingTimestamp
        ? {
            latitude: existingFish.latestSightingLatitude!,
            longitude: existingFish.latestSightingLongitude!,
            timestamp: existingFish.latestSightingTimestamp,
          }
        : null;

      let finalSighting = externalSighting;
      if (localSighting && externalSighting) {
        // Use the one with the newer timestamp
        const localTime = new Date(localSighting.timestamp).getTime();
        const externalTime = new Date(externalSighting.timestamp).getTime();
        finalSighting = localTime > externalTime ? localSighting : externalSighting;
      } else if (localSighting && !externalSighting) {
        // Keep local if external doesn't have one
        finalSighting = localSighting;
      }

      // Update existing fish
      await db
        .update(fish)
        .set({
          name: fishData.name,
          image: fishData.image || null,
          rarity: fishData.rarity,
          latestSightingLatitude: finalSighting?.latitude ?? null,
          latestSightingLongitude: finalSighting?.longitude ?? null,
          latestSightingTimestamp: finalSighting?.timestamp ?? null,
          updatedAt: now,
        })
        .where(eq(fish.id, fishData.id));

      // Update the fishData object with the final sighting for display
      if (finalSighting) {
        fishData.latestSighting = finalSighting;
      }
    } else {
      // Insert new fish
      await db.insert(fish).values({
        id: fishData.id,
        name: fishData.name,
        image: fishData.image || null,
        rarity: fishData.rarity,
        latestSightingLatitude: fishData.latestSighting?.latitude ?? null,
        latestSightingLongitude: fishData.latestSighting?.longitude ?? null,
        latestSightingTimestamp: fishData.latestSighting?.timestamp ?? null,
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
