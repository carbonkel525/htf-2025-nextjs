"use client";

import { useRef } from "react";
import Map, { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Fish } from "@/types/fish";
import FishMarker from "./FishMarker";

interface MapComponentProps {
  fishes: Fish[];
  hoveredFishId: string | null;
}

const calculateMapCenter = (fishes: Fish[]) => {
  if (fishes.length === 0) {
    return { latitude: 10.095, longitude: 99.805 };
  }

  // Filter out fish without latestSighting
  const fishesWithSighting = fishes.filter(f => f.latestSighting);
  
  if (fishesWithSighting.length === 0) {
    return { latitude: 10.095, longitude: 99.805 };
  }

  const totalLat = fishesWithSighting.reduce(
    (sum, fish) => sum + (fish.latestSighting?.latitude ?? 0),
    0
  );
  const totalLon = fishesWithSighting.reduce(
    (sum, fish) => sum + (fish.latestSighting?.longitude ?? 0),
    0
  );

  return {
    latitude: totalLat / fishesWithSighting.length,
    longitude: totalLon / fishesWithSighting.length,
  };
};

export default function MapComponent({
  fishes,
  hoveredFishId,
}: MapComponentProps) {
  const mapRef = useRef<MapRef>(null);
  const { latitude, longitude } = calculateMapCenter(fishes);

  const isAnyHovered = hoveredFishId !== null;

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        mapStyle={"https://tiles.openfreemap.org/styles/liberty"}
        initialViewState={{
          longitude,
          latitude,
          zoom: 13,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {fishes
          .filter((fish) => fish.latestSighting)
          .map((fish) => (
            <FishMarker
              key={fish.id}
              fish={fish}
              isHovered={fish.id === hoveredFishId}
              isAnyHovered={isAnyHovered}
            />
          ))}
      </Map>

      {/* Coordinate display overlay */}
      <div className="absolute top-4 left-4 bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-4 py-2 rounded text-xs font-mono">
        <div className="text-sonar-green font-bold mb-1">SONAR TRACKING</div>
        <div className="text-text-secondary">
          Active Targets: {fishes.length}
        </div>
      </div>
    </div>
  );
}
