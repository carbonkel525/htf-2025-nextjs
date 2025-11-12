"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DivingCenter } from "@/types/diving-center";
import { fetchDivingCenters } from "@/api/fish";
import { Loader2Icon, MapPinIcon, AnchorIcon } from "lucide-react";

interface DivingCenterSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (center: DivingCenter) => void;
  selectedCenter: DivingCenter | null;
}

export default function DivingCenterSelector({
  open,
  onOpenChange,
  onSelect,
  selectedCenter,
}: DivingCenterSelectorProps) {
  const [centers, setCenters] = useState<DivingCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && centers.length === 0) {
      loadCenters();
    }
  }, [open]);

  const loadCenters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDivingCenters();
      setCenters(data);
    } catch (err) {
      setError("Failed to load diving centers");
      console.error("Error loading diving centers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (center: DivingCenter) => {
    onSelect(center);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[color-mix(in_srgb,var(--color-dark-navy)_95%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sonar-green font-mono flex items-center gap-2">
            <AnchorIcon className="h-5 w-5" />
            Select Diving Center
          </DialogTitle>
          <DialogDescription className="text-text-secondary font-mono text-xs">
            Choose a diving center to start fishing. Each center has its own
            fishing radius.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="h-6 w-6 animate-spin text-sonar-green" />
            </div>
          )}

          {error && (
            <div className="text-danger-red text-sm font-mono text-center py-4">
              {error}
            </div>
          )}

          {!loading && !error && centers.length === 0 && (
            <div className="text-text-secondary text-sm font-mono text-center py-4">
              No diving centers available
            </div>
          )}

          {!loading &&
            !error &&
            centers.map((center) => (
              <button
                key={center.id}
                onClick={() => handleSelect(center)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedCenter?.id === center.id
                    ? "border-sonar-green bg-sonar-green/10"
                    : "border-panel-border hover:border-sonar-green/50 bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPinIcon
                    className={`h-5 w-5 mt-0.5 ${
                      selectedCenter?.id === center.id
                        ? "text-sonar-green"
                        : "text-text-secondary"
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`font-bold font-mono mb-1 ${
                        selectedCenter?.id === center.id
                          ? "text-sonar-green"
                          : "text-text-primary"
                      }`}
                    >
                      {center.name}
                    </div>
                    <div className="text-xs text-text-secondary font-mono space-y-1">
                      <div>
                        LAT:{" "}
                        <span className="text-sonar-green">
                          {center.latitude.toFixed(6)}
                        </span>
                      </div>
                      <div>
                        LON:{" "}
                        <span className="text-sonar-green">
                          {center.longitude.toFixed(6)}
                        </span>
                      </div>
                      <div>
                        RADIUS:{" "}
                        <span className="text-sonar-green">
                          {center.radiusKm ?? 2.8}km
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedCenter?.id === center.id && (
                    <div className="text-sonar-green font-mono text-xs">
                      SELECTED
                    </div>
                  )}
                </div>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

