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

interface FishCardProps {
  fish: Fish;
  onHover?: (fishId: string | null) => void;
  onAddToDex?: (fishId: string) => void;
  onDelete?: (fishId: string) => void;
}

export default function FishCard({
  fish,
  onHover,
  onAddToDex,
  onDelete,
}: FishCardProps) {
  const handleAddToDex = () => {
    onAddToDex?.(fish.id);
  };

  const handleDelete = () => {
    if (
      confirm(`Are you sure you want to delete ${fish.name} from your dex?`)
    ) {
      onDelete?.(fish.id);
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
        <ContextMenuSeparator className="bg-panel-border" />
        <ContextMenuItem
          onClick={handleDelete}
          variant="destructive"
          className="focus:bg-danger-red/20 focus:text-danger-red cursor-pointer"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete fish
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
