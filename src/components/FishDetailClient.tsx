"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Fish } from "@/types/fish";
import { addFishToDex, removeFishFromDex } from "@/api/fish";
import { getRarityBadgeClass } from "@/utils/rarity";
import MapComponent from "@/components/Map";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftIcon,
  Loader2Icon,
  MapPinIcon,
  WavesIcon,
} from "lucide-react";

interface FishDetailClientProps {
  fish: Fish;
  isCollected: boolean;
  collectedAt?: string | null;
}

export default function FishDetailClient({
  fish,
  isCollected: initialIsCollected,
  collectedAt,
}: FishDetailClientProps) {
  const router = useRouter();
  const [isCollected, setIsCollected] = useState(initialIsCollected);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const collectedAtLabel = useMemo(() => {
    if (!collectedAt) return null;
    const collectedDate = new Date(collectedAt);
    return `${formatDistanceToNow(collectedDate, {
      addSuffix: true,
    })} (${format(collectedDate, "PPpp")})`;
  }, [collectedAt]);

  const handleToggleDex = async () => {
    try {
      setIsProcessing(true);

      if (isCollected) {
        await removeFishFromDex(fish.id);
        setIsCollected(false);
      } else {
        await addFishToDex(fish);
        setIsCollected(true);
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to update fish dex entry", error);
      alert(
        "Something went wrong while updating your fish dex. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 border-b border-panel-border flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary hover:text-sonar-green"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded text-xs font-mono ${getRarityBadgeClass(
              fish.rarity
            )}`}
          >
            {fish.rarity}
          </div>
          <div className="text-xs font-mono text-text-secondary">
            ID: <span className="text-text-primary">{fish.id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6">
        <div className="space-y-6">
          <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] rounded-lg overflow-hidden">
            <div className="relative aspect-video bg-deep-ocean">
              {fish.image && !imageError ? (
                <Image
                  src={fish.image}
                  alt={fish.name}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-5xl text-text-secondary">
                  🐟
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="text-3xl font-bold text-sonar-green font-mono">
                  {fish.name}
                </div>
                <div className="text-xs font-mono text-text-secondary mt-2">
                  Last sighting{" "}
                  {formatDistanceToNow(
                    new Date(fish.latestSighting.timestamp),
                    {
                      addSuffix: true,
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-text-secondary uppercase tracking-wide">
                  Collection status
                </div>
                <div className="text-xl font-bold text-text-primary mt-1">
                  {isCollected
                    ? "Registered in your Fish Dex"
                    : "Not collected yet"}
                </div>
                {collectedAtLabel && (
                  <div className="text-xs text-text-secondary font-mono mt-2">
                    Collected {collectedAtLabel}
                  </div>
                )}
              </div>
              <Button
                onClick={handleToggleDex}
                disabled={isProcessing}
                className={
                  isCollected
                    ? "bg-danger-red hover:bg-danger-red/80 text-deep-ocean"
                    : "bg-sonar-green hover:bg-sonar-green/80 text-deep-ocean"
                }
              >
                {isProcessing && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCollected ? "Remove from Fish Dex" : "Add to Fish Dex"}
              </Button>
            </div>
          </div>

          <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailStat
                label="Latitude"
                value={fish.latestSighting.latitude.toFixed(6)}
                icon={<MapPinIcon className="h-4 w-4" />}
              />
              <DetailStat
                label="Longitude"
                value={fish.latestSighting.longitude.toFixed(6)}
                icon={<MapPinIcon className="h-4 w-4 rotate-90" />}
              />
              <DetailStat
                label="Last Seen"
                value={format(new Date(fish.latestSighting.timestamp), "PPpp")}
                icon={<WavesIcon className="h-4 w-4" />}
                spanCols
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] rounded-lg overflow-hidden h-[420px]">
            <div className="px-6 py-4 border-b border-panel-border text-sm font-mono text-sonar-green">
              Real-time sonar map
            </div>
            <MapComponent fishes={[fish]} hoveredFishId={fish.id} />
          </div>

          <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] rounded-lg p-6">
            <div className="text-sm font-bold text-sonar-green font-mono">
              Observation Notes
            </div>
            <div className="text-xs text-text-secondary font-mono mt-3 leading-relaxed">
              This record aggregates the most recent telemetry and sighting data
              from the global sonar array. Detailed biological data can be
              fetched from the external marine knowledge base. Maintain visual
              confirmation and update your Fish Dex with photographic evidence
              when available.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetailStatProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  spanCols?: boolean;
}

function DetailStat({ label, value, icon, spanCols = false }: DetailStatProps) {
  return (
    <div
      className={`border border-panel-border shadow-[--shadow-cockpit-border] rounded-lg px-4 py-3 flex items-center gap-3 ${
        spanCols ? "sm:col-span-2" : ""
      }`}
    >
      <div className="text-sonar-green">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-text-secondary font-mono">
          {label}
        </div>
        <div className="text-sm font-bold text-text-primary font-mono">
          {value}
        </div>
      </div>
    </div>
  );
}
