"use client";

import { formatDistanceToNow } from "date-fns";
import { Fish } from "@/types/fish";
import { getRarityBadgeClass } from "@/utils/rarity";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { PlusIcon, TrashIcon } from "lucide-react";
import { addFishToDex, removeFishFromDex } from "@/api/fish";

interface FishCardProps {
  fish: Fish;
  onHover?: (fishId: string | null) => void;
}

export default function FishCard({ fish, onHover }: FishCardProps) {
  const handleAddToDex = async () => {
    try {
      await addFishToDex(fish);
      // Show success message or update UI
    } catch (error) {
      console.error("Error adding fish:", error);
      // Show error message
    }
  };

  const handleDelete = async (fishId: string) => {
    try {
      await removeFishFromDex(fishId);
      // Show success message or update UI
    } catch (error) {
      console.error("Error deleting fish:", error);
      // Show error message
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="border border-panel-border shadow-[--shadow-cockpit-border] rounded-lg p-3 hover:border-sonar-green transition-all duration-300 cursor-pointer group"
          onMouseEnter={() => onHover?.(fish.id)}
          onMouseLeave={() => onHover?.(null)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="text-sm font-bold text-text-primary group-hover:text-sonar-green transition-colors mb-1">
                {fish.name}
              </div>
              <div
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getRarityBadgeClass(
                  fish.rarity
                )}`}
              >
                {fish.rarity}
              </div>
            </div>
          </div>
          <div className="text-xs font-mono space-y-1">
            {fish.latestSighting ? (
              <>
                <div className="flex justify-between text-text-secondary">
                  <span>LAT:</span>
                  <span className="text-sonar-green">
                    {fish.latestSighting.latitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>LON:</span>
                  <span className="text-sonar-green">
                    {fish.latestSighting.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary pt-1 border-t border-panel-border">
                  <span>LAST SEEN:</span>
                  <span className="text-warning-amber">
                    {formatDistanceToNow(new Date(fish.latestSighting.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-text-secondary pt-1">
                <span>STATUS:</span>
                <span className="text-text-secondary">No sightings yet</span>
              </div>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-dark-navy border-panel-border">
        <ContextMenuItem
          onClick={handleAddToDex}
          className="focus:bg-sonar-green/20 focus:text-sonar-green cursor-pointer text-text-primary"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add fish to dex
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
