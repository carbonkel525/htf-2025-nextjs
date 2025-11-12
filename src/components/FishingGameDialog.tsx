"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Fish } from "@/types/fish";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnchorIcon, TrophyIcon, Loader2Icon } from "lucide-react";
import { calculateCPScore } from "@/utils/cp-score";
import Confetti from "./Confetti";

interface FishingGameDialogProps {
  fish: Fish;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCatch: (fish: Fish, cpScore: number, catchAttempts: number) => Promise<void>;
}

// Calculate fish weight based on rarity (in kg)
function calculateFishWeight(rarity: string): number {
  const seed = rarity.charCodeAt(0) + rarity.length;
  const baseWeights: Record<string, { min: number; max: number }> = {
    COMMON: { min: 0.5, max: 5 },
    RARE: { min: 5, max: 50 },
    EPIC: { min: 50, max: 500 },
  };

  const range = baseWeights[rarity] || baseWeights.COMMON;
  // Use seed for deterministic weight per rarity
  const weight = range.min + ((seed % 100) / 100) * (range.max - range.min);
  return Math.round(weight * 10) / 10;
}

// Calculate game difficulty based on weight
function calculateDifficulty(weight: number) {
  // Heavier fish = smaller catch zone, faster movement
  const catchZoneSize = Math.max(10, 50 - weight * 0.5); // 10-50% of bar
  const speed = Math.min(8, 2 + weight * 0.1); // 2-8 speed units
  return { catchZoneSize, speed };
}

export default function FishingGameDialog({
  fish,
  open,
  onOpenChange,
  onCatch,
}: FishingGameDialogProps) {
  const [gameState, setGameState] = useState<
    "idle" | "playing" | "caught" | "missed" | "adding"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [catchAttempts, setCatchAttempts] = useState(0);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const weight = calculateFishWeight(fish.rarity);
  const { catchZoneSize, speed } = calculateDifficulty(weight);
  const catchZoneStart = 50 - catchZoneSize / 2;
  const catchZoneEnd = 50 + catchZoneSize / 2;

  const startGame = useCallback(() => {
    setGameState("playing");
    setProgress(0);
    setDirection(1);
    setShowConfetti(false);
    setCatchAttempts((prev) => prev + 1); // Increment attempts each time game starts
    lastTimeRef.current = performance.now();
  }, []);

  const handleCatch = useCallback(() => {
    if (gameState !== "playing") return;

    if (progress >= catchZoneStart && progress <= catchZoneEnd) {
      // Successfully caught!
      setGameState("caught");
      setShowConfetti(true);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      // Missed!
      setGameState("missed");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [gameState, progress, catchZoneStart, catchZoneEnd]);

  const handleAddToDex = async () => {
    setGameState("adding");
    try {
      const cpScore = calculateCPScore(catchAttempts);
      await onCatch(fish, cpScore, catchAttempts);
      // Close dialog after successful add
      setTimeout(() => {
        onOpenChange(false);
        setGameState("idle");
        setShowConfetti(false);
        setCatchAttempts(0); // Reset attempts for next catch
      }, 1000);
    } catch (error) {
      console.error("Error adding fish to dex:", error);
      setGameState("caught"); // Reset to caught state on error
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      setProgress((prev) => {
        let newProgress = prev + (direction * speed * deltaTime) / 16;

        // Bounce at edges
        if (newProgress >= 100) {
          newProgress = 100;
          setDirection(-1);
        } else if (newProgress <= 0) {
          newProgress = 0;
          setDirection(1);
        }

        return newProgress;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, direction, speed]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setGameState("idle");
      setProgress(0);
      setShowConfetti(false);
      setCatchAttempts(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [open]);

  return (
    <>
      {showConfetti && <Confetti />}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[color-mix(in_srgb,var(--color-dark-navy)_95%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sonar-green font-mono flex items-center gap-2">
              <AnchorIcon className="h-5 w-5" />
              Catch {fish.name}
            </DialogTitle>
            <DialogDescription className="text-text-secondary font-mono text-xs">
              Weight: {weight} kg | Rarity: {fish.rarity}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {gameState === "idle" && (
              <div className="text-center space-y-4">
                <div className="text-sm text-text-secondary font-mono">
                  Click the button when the progress bar is in the{" "}
                  <span className="text-sonar-green">green zone</span> to catch
                  the fish!
                </div>
                <Button
                  onClick={startGame}
                  className="bg-sonar-green hover:bg-sonar-green/80 text-deep-ocean font-mono"
                >
                  Start Fishing
                </Button>
              </div>
            )}

            {gameState === "playing" && (
              <div className="space-y-4">
                <div className="text-xs text-text-secondary font-mono text-center">
                  Click NOW when the bar is in the green zone!
                </div>
                <div className="relative h-12 bg-deep-ocean border-2 border-panel-border rounded-lg overflow-hidden">
                  {/* Catch zone indicator */}
                  <div
                    className="absolute top-0 h-full bg-sonar-green/30 border-x-2 border-sonar-green"
                    style={{
                      left: `${catchZoneStart}%`,
                      width: `${catchZoneSize}%`,
                    }}
                  />
                  {/* Progress bar */}
                  <div
                    className="absolute top-0 h-full bg-sonar-green transition-none"
                    style={{
                      left: `${progress}%`,
                      width: "4px",
                    }}
                  />
                  {/* Center marker */}
                  <div className="absolute top-0 left-1/2 h-full w-0.5 bg-text-primary/50 -translate-x-1/2" />
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={handleCatch}
                    className="bg-sonar-green hover:bg-sonar-green/80 text-deep-ocean font-mono text-lg px-8 py-6"
                  >
                    CATCH!
                  </Button>
                </div>
              </div>
            )}

            {gameState === "missed" && (
              <div className="text-center space-y-4">
                <div className="text-lg font-bold text-danger-red font-mono">
                  Missed! The fish got away...
                </div>
                <div className="text-xs text-text-secondary font-mono">
                  Try again - timing is everything!
                </div>
                <Button
                  onClick={startGame}
                  className="bg-sonar-green hover:bg-sonar-green/80 text-deep-ocean font-mono"
                >
                  Try Again
                </Button>
              </div>
            )}

            {gameState === "caught" && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-sonar-green font-mono">
                  <TrophyIcon className="h-6 w-6" />
                  Fish Caught!
                </div>
                <div className="text-sm text-text-primary font-mono">
                  You successfully caught {fish.name} ({weight} kg)!
                </div>
                <div className="border border-panel-border rounded-lg p-3 bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)]">
                  <div className="text-xs text-text-secondary font-mono mb-2">
                    CATCH STATS
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <div className="text-xs text-text-secondary font-mono">
                        Attempts
                      </div>
                      <div className="text-lg font-bold text-sonar-green font-mono">
                        {catchAttempts}
                      </div>
                    </div>
                    <div className="w-px h-8 bg-panel-border"></div>
                    <div>
                      <div className="text-xs text-text-secondary font-mono">
                        CP Score
                      </div>
                      <div className="text-lg font-bold text-sonar-green font-mono">
                        {calculateCPScore(catchAttempts)}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleAddToDex}
                  disabled={gameState === "adding"}
                  className="bg-sonar-green hover:bg-sonar-green/80 text-deep-ocean font-mono w-full"
                >
                  {gameState === "adding" ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Adding to Fish Dex...
                    </>
                  ) : (
                    <>
                      <TrophyIcon className="mr-2 h-4 w-4" />
                      Add to Fish Dex
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

