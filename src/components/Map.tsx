"use client";

import { useRef, useEffect } from "react";
import Map, { MapRef, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Fish } from "@/types/fish";
import { DivingCenter } from "@/types/diving-center";
import FishMarker from "./FishMarker";

interface MapComponentProps {
  fishes: Fish[];
  hoveredFishId: string | null;
  selectedDivingCenter?: DivingCenter | null;
}

const calculateMapCenter = (fishes: Fish[]) => {
  if (fishes.length === 0) {
    return { latitude: 10.095, longitude: 99.805 };
  }

  const totalLat = fishes.reduce(
    (sum, fish) => sum + fish.latestSighting.latitude,
    0
  );
  const totalLon = fishes.reduce(
    (sum, fish) => sum + fish.latestSighting.longitude,
    0
  );

  return {
    latitude: totalLat / fishes.length,
    longitude: totalLon / fishes.length,
  };
};

export default function MapComponent({
  fishes,
  hoveredFishId,
  selectedDivingCenter,
}: MapComponentProps) {
  const mapRef = useRef<MapRef>(null);
  const { latitude, longitude } = calculateMapCenter(fishes);

  const isAnyHovered = hoveredFishId !== null;

  // Zoom to diving center when selected
  useEffect(() => {
    if (selectedDivingCenter && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedDivingCenter.longitude, selectedDivingCenter.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedDivingCenter]);

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
        {fishes.map((fish) => (
          <FishMarker
            key={fish.id}
            fish={fish}
            isHovered={fish.id === hoveredFishId}
            isAnyHovered={isAnyHovered}
          />
        ))}
        {/* Diving Center Marker */}
        {selectedDivingCenter && (
          <Marker
            longitude={selectedDivingCenter.longitude}
            latitude={selectedDivingCenter.latitude}
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-sonar-green rounded-full bg-sonar-green/20 animate-ping"></div>
              </div>
              <div className="relative w-6 h-6 border-2 border-sonar-green rounded-full bg-dark-navy flex items-center justify-center shadow-[--shadow-glow-common]">
                <div className="w-3 h-3 bg-sonar-green rounded-full"></div>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-dark-navy border border-sonar-green rounded text-xs whitespace-nowrap">
                <div className="text-sonar-green font-bold font-mono">
                  {selectedDivingCenter.name}
                </div>
              </div>
            </div>
          </Marker>
        )}
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
