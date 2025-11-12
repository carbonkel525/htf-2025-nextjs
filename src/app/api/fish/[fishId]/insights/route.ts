import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fish } from "@/db/schema";
import { eq } from "drizzle-orm";

interface FishInsights {
  food: string[];
  maxSize: string;
  enemies: string[];
  habitat: string;
  behavior: string;
  funFact: string;
}

// Generate AI-like insights based on fish data
function generateFishInsights(
  fishName: string,
  rarity: string,
  latitude: number,
  longitude: number
): FishInsights {
  // Create a deterministic seed from fish name
  const seed = fishName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Food types based on fish characteristics
  const foodTypes = [
    ["plankton", "small crustaceans", "algae"],
    ["small fish", "shrimp", "squid"],
    ["krill", "zooplankton", "detritus"],
    ["insects", "worms", "small invertebrates"],
    ["fish eggs", "larvae", "microorganisms"],
    ["seaweed", "mollusks", "crustaceans"],
  ];

  // Enemy types
  const enemyTypes = [
    ["larger predatory fish", "sharks", "sea birds"],
    ["dolphins", "seals", "fishermen"],
    ["barracudas", "tuna", "marlins"],
    ["octopuses", "squid", "cuttlefish"],
    ["sea snakes", "eels", "groupers"],
  ];

  // Size ranges based on rarity
  const sizeRanges: Record<string, string[]> = {
    COMMON: ["5-15 cm", "10-25 cm", "15-30 cm", "20-40 cm"],
    RARE: ["30-60 cm", "50-100 cm", "80-150 cm", "100-200 cm"],
    EPIC: ["150-300 cm", "200-400 cm", "300-500 cm", "400-600 cm"],
  };

  // Habitat descriptions
  const habitats = [
    "shallow coastal waters",
    "deep ocean trenches",
    "coral reefs",
    "open ocean",
    "estuaries and mangroves",
    "temperate waters",
    "tropical waters",
    "polar regions",
  ];

  // Behavior patterns
  const behaviors = [
    "solitary hunter, active during dawn and dusk",
    "schooling fish, travels in groups of 20-50",
    "nocturnal predator, hunts at night",
    "diurnal feeder, most active during daylight",
    "ambush predator, lies in wait for prey",
    "active swimmer, constantly on the move",
    "bottom dweller, rarely surfaces",
    "surface feeder, often seen near the water's edge",
  ];

  // Fun facts
  const funFacts = [
    "This species can change color to blend with its surroundings",
    "Known for its incredible speed, reaching up to 60 km/h",
    "Has a unique bioluminescent pattern used for communication",
    "Can survive in both saltwater and freshwater environments",
    "Uses electroreception to detect prey in murky waters",
    "Has a lifespan of up to 20 years in the wild",
    "Capable of producing sounds for social communication",
    "Exhibits complex social behaviors and hierarchy",
  ];

  // Select based on seed
  const foodIndex = seed % foodTypes.length;
  const enemyIndex = (seed * 2) % enemyTypes.length;
  const sizeIndex = (seed * 3) % (sizeRanges[rarity]?.length || 4);
  const habitatIndex = (seed * 5) % habitats.length;
  const behaviorIndex = (seed * 7) % behaviors.length;
  const funFactIndex = (seed * 11) % funFacts.length;

  // Determine habitat based on coordinates
  let habitat = habitats[habitatIndex];
  if (latitude > 60 || latitude < -60) {
    habitat = "polar regions";
  } else if (Math.abs(latitude) < 30) {
    habitat = "tropical waters";
  } else {
    habitat = "temperate waters";
  }

  return {
    food: foodTypes[foodIndex],
    maxSize: sizeRanges[rarity]?.[sizeIndex] || "unknown",
    enemies: enemyTypes[enemyIndex],
    habitat,
    behavior: behaviors[behaviorIndex],
    funFact: funFacts[funFactIndex],
  };
}

export async function GET(
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

    // Fetch fish from database
    const fishData = await db
      .select()
      .from(fish)
      .where(eq(fish.id, fishId))
      .limit(1);

    if (fishData.length === 0) {
      return NextResponse.json({ error: "Fish not found" }, { status: 404 });
    }

    const fishRecord = fishData[0];

    // Generate insights
    const insights = generateFishInsights(
      fishRecord.name,
      fishRecord.rarity,
      fishRecord.latestSightingLatitude,
      fishRecord.latestSightingLongitude
    );

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error generating fish insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
