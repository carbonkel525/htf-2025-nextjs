"use client";

import { useState, useMemo } from "react";
import { Fish } from "@/types/fish";
import { DivingCenter } from "@/types/diving-center";
import { isFishInDivingCenter } from "@/api/fish";
import Map from "./Map";
import FishList from "./FishList";
import DivingCenterSelector from "./DivingCenterSelector";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { AnchorIcon } from "lucide-react";

interface FishTrackerClientProps {
  fishes: Fish[];
  sortedFishes: Fish[];
}

export default function FishTrackerClient({
  fishes,
  sortedFishes,
}: FishTrackerClientProps) {
  const [hoveredFishId, setHoveredFishId] = useState<string | null>(null);
  const [selectedDivingCenter, setSelectedDivingCenter] =
    useState<DivingCenter | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Filter fishes based on selected diving center
  const filteredFishes = useMemo(() => {
    if (!selectedDivingCenter) {
      return sortedFishes;
    }
    return sortedFishes.filter((fish) =>
      isFishInDivingCenter(fish, selectedDivingCenter)
    );
  }, [sortedFishes, selectedDivingCenter]);

  return (
    <>
      <DivingCenterSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={setSelectedDivingCenter}
        selectedCenter={selectedDivingCenter}
      />
      <PanelGroup
        direction="vertical"
        className="flex-1"
        autoSaveId="fish-tracker-client"
      >
        {/* Map Panel */}
        <Panel defaultSize={65} minSize={30}>
          <div className="w-full h-full relative shadow-[--shadow-map-panel]">
            <Map
              fishes={fishes}
              hoveredFishId={hoveredFishId}
              selectedDivingCenter={selectedDivingCenter}
            />
            {/* Diving Center Selector Button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={() => setSelectorOpen(true)}
                className="bg-sonar-green hover:bg-sonar-green/80 text-deep-ocean font-mono text-xs"
              >
                <AnchorIcon className="mr-2 h-4 w-4" />
                {selectedDivingCenter
                  ? selectedDivingCenter.name
                  : "Select Diving Center"}
              </Button>
            </div>
            {selectedDivingCenter && (
              <div className="absolute bottom-4 left-4 bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-sonar-green shadow-[--shadow-cockpit] backdrop-blur-[10px] px-4 py-2 rounded text-xs font-mono z-10">
                <div className="text-sonar-green font-bold mb-1">
                  ACTIVE CENTER
                </div>
                <div className="text-text-primary">{selectedDivingCenter.name}</div>
                <div className="text-text-secondary text-[10px] mt-1">
                  {filteredFishes.length} fish available
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="h-1 bg-panel-border hover:bg-sonar-green transition-colors duration-200 cursor-row-resize relative group">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-sonar-green opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-panel-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-sonar-green rounded-full" />
            </div>
          </div>
        </PanelResizeHandle>

        {/* Fish List Panel */}
        <Panel defaultSize={35} minSize={20}>
          <FishList
            fishes={filteredFishes}
            onFishHover={setHoveredFishId}
            selectedDivingCenter={selectedDivingCenter}
          />
        </Panel>
      </PanelGroup>
    </>
  );
}
