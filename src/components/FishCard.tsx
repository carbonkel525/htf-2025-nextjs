"use client";

import { useState } from "react";
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
import { PlusIcon, TrashIcon, AnchorIcon } from "lucide-react";
import { addFishToDex, removeFishFromDex } from "@/api/fish";
import FishingGameDialog from "@/components/FishingGameDialog";

interface FishCardProps {
  fish: Fish;
  onHover?: (fishId: string | null) => void;
}

export default function FishCard({ fish, onHover }: FishCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCatch = async (caughtFish: Fish) => {
    try {
      await addFishToDex(caughtFish);
      // Success - dialog will close automatically
    } catch (error) {
      console.error("Error adding fish:", error);
      throw error; // Re-throw so dialog can handle it
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only open dialog on left click, not right click
    if (e.button === 0 || e.type === "click") {
      e.preventDefault();
      setDialogOpen(true);
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
            className="border border-panel-border shadow-[--shadow-cockpit-border] rounded-lg p-3 hover:border-sonar-green transition-all duration-300 cursor-pointer group"
            onMouseEnter={() => onHover?.(fish.id)}
            onMouseLeave={() => onHover?.(null)}
            onClick={handleClick}
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
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-dark-navy border-panel-border">
          <ContextMenuItem
            onClick={() => setDialogOpen(true)}
            className="focus:bg-sonar-green/20 focus:text-sonar-green cursor-pointer text-text-primary"
          >
            <AnchorIcon className="mr-2 h-4 w-4" />
            Catch fish
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
