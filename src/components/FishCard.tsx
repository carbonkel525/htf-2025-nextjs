"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Fish } from "@/types/fish";
import { DivingCenter } from "@/types/diving-center";
import { getRarityBadgeClass } from "@/utils/rarity";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { PlusIcon, TrashIcon, AnchorIcon, AlertCircleIcon } from "lucide-react";
import {
  addFishToDex,
  removeFishFromDex,
  isFishInDivingCenter,
} from "@/api/fish";
import FishingGameDialog from "@/components/FishingGameDialog";

interface FishCardProps {
  fish: Fish;
  onHover?: (fishId: string | null) => void;
  selectedDivingCenter?: DivingCenter | null;
  onTrack?: (fishId: string) => void;
  isTracked?: boolean;
}

export default function FishCard({
  fish,
  onHover,
  selectedDivingCenter,
  onTrack,
  isTracked,
}: FishCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const isFishInCenter =
    !selectedDivingCenter || isFishInDivingCenter(fish, selectedDivingCenter);

  const handleCatch = async (
    caughtFish: Fish,
    cpScore: number,
    catchAttempts: number
  ) => {
    try {
      await addFishToDex(caughtFish, cpScore, catchAttempts);
      // Success - dialog will close automatically
    } catch (error) {
      console.error("Error adding fish:", error);
      throw error; // Re-throw so dialog can handle it
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Single click to track fish swimming history
    if (e.button === 0 || e.type === "click") {
      e.preventDefault();
      e.stopPropagation();
      if (onTrack) {
        onTrack(fish.id);
      }
    }
  };

  const handleCatchClick = (e: React.MouseEvent) => {
    // Use context menu or explicit catch button for catching
    e.preventDefault();
    e.stopPropagation();
    if (!selectedDivingCenter) {
      // Show message that diving center needs to be selected
      alert("Please select a diving center first to catch fish!");
      return;
    }
    if (!isFishInCenter) {
      const radius = selectedDivingCenter.radiusKm ?? 2.8;
      alert(
        `This fish is not within the selected diving center's area (${radius}km radius)!`
      );
      return;
    }
    setDialogOpen(true);
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
    <>
      <FishingGameDialog
        fish={fish}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCatch={handleCatch}
      />
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`border shadow-[--shadow-cockpit-border] rounded-lg p-3 hover:border-sonar-green transition-all duration-300 cursor-pointer group ${
              isTracked
                ? "border-sonar-green border-2 bg-sonar-green/10"
                : "border-panel-border"
            }`}
            onMouseEnter={() => onHover?.(fish.id)}
            onMouseLeave={() => onHover?.(null)}
            onClick={handleClick}
            title="Click to track swimming history"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm font-bold text-text-primary group-hover:text-sonar-green transition-colors mb-1">
                  {fish.name}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getRarityBadgeClass(
                      fish.rarity
                    )}`}
                  >
                    {fish.rarity}
                  </div>
                  {selectedDivingCenter && !isFishInCenter && (
                    <div className="flex items-center gap-1 text-[10px] text-danger-red font-mono">
                      <AlertCircleIcon className="h-3 w-3" />
                      OUT OF RANGE
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getRarityBadgeClass(
                  fish.rarity
                )}`}
              >
                {fish.rarity}
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
                      {formatDistanceToNow(
                        new Date(fish.latestSighting.timestamp),
                        {
                          addSuffix: true,
                        }
                      )}
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
            onClick={handleCatchClick}
            disabled={!selectedDivingCenter || !isFishInCenter}
            className="focus:bg-sonar-green/20 focus:text-sonar-green cursor-pointer text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AnchorIcon className="mr-2 h-4 w-4" />
            Catch fish
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
