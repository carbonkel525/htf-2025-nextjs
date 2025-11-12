"use client";

import { useState } from "react";
import { Fish } from "@/types/fish";
import { getRarityBadgeClass, getRarityOrder } from "@/utils/rarity";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TrashIcon } from "lucide-react";
import { removeFishFromDex } from "@/api/fish";
import { useRouter } from "next/navigation";

interface FishCardWithErrorHandlingProps {
  fish: Fish;
  onDelete: (fishId: string) => void;
}

interface FishDexClientProps {
  fishes: Fish[];
}

export default function FishDexClient({ fishes }: FishDexClientProps) {
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (fishId: string) => {
    if (confirm(`Are you sure you want to remove this fish from your dex?`)) {
      try {
        await removeFishFromDex(fishId);
        router.refresh();
      } catch (error) {
        console.error("Error deleting fish:", error);
        alert("Failed to remove fish from dex");
      }
    }
  };

  const filteredFishes =
    selectedRarity === null
      ? fishes
      : fishes.filter((f) => f.rarity.toUpperCase() === selectedRarity);

  const rarities = ["ALL", "EPIC", "RARE", "COMMON"];

  if (fishes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] m-6 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4">🐟</div>
          <div className="text-xl font-bold text-text-primary mb-2 font-mono">
            DEX EMPTY
          </div>
          <div className="text-sm text-text-secondary font-mono mb-4">
            No fish collected yet
          </div>
          <div className="text-xs text-text-secondary font-mono">
            Right-click on fish cards to add them to your dex
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] m-6 rounded-lg">
      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-panel-border flex items-center justify-between">
        <div className="text-sm font-bold text-sonar-green [text-shadow:--shadow-glow-text] font-mono">
          COLLECTED SPECIMENS ({filteredFishes.length})
        </div>
        <div className="flex gap-2">
          {rarities.map((rarity) => (
            <button
              key={rarity}
              onClick={() =>
                setSelectedRarity(rarity === "ALL" ? null : rarity)
              }
              className={`px-3 py-1 rounded text-xs font-mono border transition-all ${
                selectedRarity === null && rarity === "ALL"
                  ? "border-sonar-green bg-sonar-green/20 text-sonar-green"
                  : selectedRarity === rarity
                  ? "border-sonar-green bg-sonar-green/20 text-sonar-green"
                  : "border-panel-border text-text-secondary hover:border-sonar-green/50"
              }`}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Fish Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFishes.map((fish) => (
            <FishCardWithErrorHandling
              key={fish.id}
              fish={fish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FishCardWithErrorHandling({
  fish,
  onDelete,
}: FishCardWithErrorHandlingProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="border border-panel-border shadow-[--shadow-cockpit-border] rounded-lg overflow-hidden hover:border-sonar-green transition-all duration-300 cursor-pointer group bg-[color-mix(in_srgb,var(--color-dark-navy)_90%,transparent)]">
          {/* Fish Image */}
          <div className="relative w-full aspect-square bg-deep-ocean overflow-hidden">
            {fish.image && !imageError ? (
              <Image
                src={fish.image}
                alt={fish.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary">
                <div className="text-4xl">🐟</div>
              </div>
            )}
            {/* Rarity Badge Overlay */}
            <div className="absolute top-2 right-2 z-10">
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRarityBadgeClass(
                  fish.rarity
                )}`}
              >
                {fish.rarity}
              </div>
            </div>
          </div>

          {/* Fish Info */}
          <div className="p-3">
            <div className="text-sm font-bold text-text-primary group-hover:text-sonar-green transition-colors mb-2 font-mono">
              {fish.name}
            </div>
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between text-text-secondary">
                <span>LAT:</span>
                <span className="text-sonar-green">
                  {fish.latestSighting.latitude.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>LON:</span>
                <span className="text-sonar-green">
                  {fish.latestSighting.longitude.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary pt-1 border-t border-panel-border">
                <span>SEEN:</span>
                <span className="text-warning-amber text-[10px]">
                  {formatDistanceToNow(
                    new Date(fish.latestSighting.timestamp),
                    {
                      addSuffix: true,
                    }
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-dark-navy border-panel-border">
        <ContextMenuItem
          onClick={() => onDelete(fish.id)}
          variant="destructive"
          className="focus:bg-danger-red/20 focus:text-danger-red cursor-pointer"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Remove from dex
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
