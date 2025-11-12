"use client";

import { useRef, useEffect, useMemo } from "react";
import Map, { MapRef, Marker, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Fish } from "@/types/fish";
import { DivingCenter } from "@/types/diving-center";
import FishMarker from "./FishMarker";

interface MapComponentProps {
  fishes: Fish[];
  hoveredFishId: string | null;
  selectedDivingCenter?: DivingCenter | null;
  trackedFish?: Fish | null;
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
  selectedDivingCenter,
  trackedFish,
}: MapComponentProps) {
  const mapRef = useRef<MapRef>(null);
  const { latitude, longitude } = calculateMapCenter(fishes);

  const isAnyHovered = hoveredFishId !== null;

  // Create GeoJSON line for tracked fish swimming history
  const trackLineGeoJSON = useMemo(() => {
    if (!trackedFish || !trackedFish.sightings || trackedFish.sightings.length < 2) {
      return null;
    }

    // Sort sightings by timestamp to ensure correct order
    const sortedSightings = [...trackedFish.sightings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Create line coordinates
    const coordinates = sortedSightings.map((sighting) => [
      sighting.longitude,
      sighting.latitude,
    ]);

    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates,
      },
      properties: {},
    };
  }, [trackedFish]);

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
        {/* Tracked fish swimming history line */}
        {trackLineGeoJSON && (
          <Source id="fish-track-line" type="geojson" data={trackLineGeoJSON}>
            <Layer
              id="fish-track-line-layer"
              type="line"
              paint={{
                "line-color": "#14ffec",
                "line-width": 3,
                "line-opacity": 0.8,
              }}
            />
          </Source>
        )}
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
        {trackedFish && (
          <div className="text-text-secondary mt-1 pt-1 border-t border-panel-border">
            Tracking: {trackedFish.name}
            {trackedFish.sightings && (
              <span className="text-sonar-green ml-1">
                ({trackedFish.sightings.length} points)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
