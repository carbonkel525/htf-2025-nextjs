import { Fish } from "@/types/fish";

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

export const addFishToDex = async (fish: Fish) => {
  const response = await fetch("/api/fishdex", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fishId: fish.id,
      name: fish.name,
      image: fish.image,
      rarity: fish.rarity,
      latestSighting: fish.latestSighting,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Failed to add fish to dex");
  }

  return response.json();
};

export const removeFishFromDex = async (fishId: string) => {
  const response = await fetch(`/api/fishdex/${fishId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Failed to remove fish from dex");
  }

  return response.json();
};
