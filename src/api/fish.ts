import { Fish } from "@/types/fish";
import { DivingCenter } from "@/types/diving-center";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_FISH_API_URL ?? "http://localhost:5555/api";

const buildApiUrl = (path: string) => {
  if (path.startsWith("http")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

export const fetchFishes = async () => {
  const response = await fetch(buildApiUrl("/fish"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch fishes");
  }

  return response.json();
};

export const fetchFishById = async (fishId: string) => {
  const response = await fetch(buildApiUrl(`/fish/${fishId}`), {
    cache: "no-store",
  });

  if (response.ok) {
    return response.json();
  }

  // Fallback: fetch all fishes and find the requested one
  const allFishes = await fetchFishes();
  const fallbackFish = allFishes.find(
    (fish: { id: string }) => fish.id === fishId
  );

  if (!fallbackFish) {
    throw new Error("Fish not found");
  }

  return fallbackFish;
};

export const addFishToDex = async (
  fish: Fish,
  cpScore: number,
  catchAttempts: number
) => {
  const response = await fetch("/api/fishdex", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fishId: fish.id,
      cpScore,
      catchAttempts,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Failed to add fish to dex");
  }

  return response.json();
};

export const removeFishFromDex = async (dexEntryId: string) => {
  const response = await fetch(`/api/fishdex/${dexEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Failed to remove fish from dex");
  }

  return response.json();
};

export const fetchDivingCenters = async (): Promise<DivingCenter[]> => {
  const response = await fetch(buildApiUrl("/diving-centers"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch diving centers");
  }

  return response.json();
};

// Calculate distance between two points in degrees (Haversine approximation for small distances)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Check if a fish is within a diving center's area
// Uses the center's radiusKm if provided, otherwise defaults to 2.8km
export function isFishInDivingCenter(
  fish: Fish,
  center: DivingCenter
): boolean {
  const radiusKm = center.radiusKm ?? 2.8; // Default to 2.8km if not specified
  const distance = calculateDistance(
    fish.latestSighting.latitude,
    fish.latestSighting.longitude,
    center.latitude,
    center.longitude
  );
  return distance <= radiusKm;
}
