"use client";

import { useState, useEffect, useCallback } from "react";
import { Fish } from "@/types/fish";
import { getRarityBadgeClass } from "@/utils/rarity";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface BattleFish {
  fish: Fish;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

interface BattleLog {
  message: string;
  type: "attack" | "defense" | "victory" | "start";
}

interface FishFightClientProps {
  fishes: Fish[];
  opponentFishes?: Fish[];
  opponentName?: string;
}

export default function FishFightClient({
  fishes,
  opponentFishes,
  opponentName,
}: FishFightClientProps) {
  // Use opponentFishes for Fighter 2 if provided, otherwise use user's fishes
  const fighter2Fishes = opponentFishes || fishes;
  const [selectedFish1, setSelectedFish1] = useState<Fish | null>(null);
  const [selectedFish2, setSelectedFish2] = useState<Fish | null>(null);
  const [battleFish1, setBattleFish1] = useState<BattleFish | null>(null);
  const [battleFish2, setBattleFish2] = useState<BattleFish | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [isFighting, setIsFighting] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate fish stats based on CP score and rarity
  const calculateStats = (
    fish: Fish
  ): { hp: number; attack: number; defense: number } => {
    const cpScore = fish.dexEntry?.cpScore || 500;
    const rarityMultiplier =
      {
        COMMON: 1.0,
        RARE: 1.3,
        EPIC: 1.6,
      }[fish.rarity.toUpperCase()] || 1.0;

    // Base HP is CP score * 2, modified by rarity
    const hp = Math.floor(cpScore * 2 * rarityMultiplier);

    // Attack is CP score / 10, modified by rarity
    const attack = Math.floor((cpScore / 10) * rarityMultiplier);

    // Defense is CP score / 15, modified by rarity
    const defense = Math.floor((cpScore / 15) * rarityMultiplier);

    return { hp, attack, defense };
  };

  const startBattle = () => {
    if (!selectedFish1 || !selectedFish2) return;

    const stats1 = calculateStats(selectedFish1);
    const stats2 = calculateStats(selectedFish2);

    setBattleFish1({
      fish: selectedFish1,
      hp: stats1.hp,
      maxHp: stats1.hp,
      attack: stats1.attack,
      defense: stats1.defense,
    });

    setBattleFish2({
      fish: selectedFish2,
      hp: stats2.hp,
      maxHp: stats2.hp,
      attack: stats2.attack,
      defense: stats2.defense,
    });

    setBattleLog([
      {
        message: `Battle begins! ${selectedFish1.name} vs ${selectedFish2.name}!`,
        type: "start",
      },
    ]);
    setIsFighting(true);
    setCurrentTurn(1);
    setWinner(null);
  };

  const performAttack = useCallback(() => {
    setBattleFish1((fish1) => {
      setBattleFish2((fish2) => {
        if (!fish1 || !fish2 || !isFighting || winner) {
          setIsAnimating(false);
          return fish2;
        }

        const attacker = currentTurn === 1 ? fish1 : fish2;
        const defender = currentTurn === 1 ? fish2 : fish1;
        const attackerNum = currentTurn;

        // Calculate damage with randomness (80-120% of attack power)
        const damageVariation = 0.8 + Math.random() * 0.4;
        const baseDamage = attacker.attack;
        const damage = Math.max(
          1,
          Math.floor(baseDamage * damageVariation) - defender.defense
        );

        const newDefenderHp = Math.max(0, defender.hp - damage);
        const attackerName = attacker.fish.name;
        const defenderName = defender.fish.name;

        // Update battle log
        const newLog: BattleLog = {
          message: `${attackerName} attacks ${defenderName} for ${damage} damage!`,
          type: "attack",
        };

        setBattleLog((prev) => [...prev, newLog]);

        // Update HP
        if (attackerNum === 1) {
          setBattleFish2((prev) =>
            prev ? { ...prev, hp: newDefenderHp } : null
          );
        } else {
          setBattleFish1((prev) =>
            prev ? { ...prev, hp: newDefenderHp } : null
          );
        }

        // Check for winner or switch turns
        if (newDefenderHp <= 0) {
          setTimeout(() => {
            setWinner(attackerNum);
            setBattleLog((prev) => [
              ...prev,
              {
                message: `${attackerName} wins the battle! 🏆`,
                type: "victory",
              },
            ]);
            setIsFighting(false);
            setIsAnimating(false);
          }, 500);
        } else {
          // Switch turns
          setTimeout(() => {
            setCurrentTurn(attackerNum === 1 ? 2 : 1);
            setIsAnimating(false);
          }, 100);
        }

        return fish2;
      });
      return fish1;
    });
  }, [currentTurn, isFighting, winner]);

  const nextTurn = useCallback(() => {
    if (!battleFish1 || !battleFish2 || !isFighting || winner) {
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      performAttack();
    }, 300);
  }, [battleFish1, battleFish2, isFighting, winner, performAttack]);

  const resetBattle = () => {
    setBattleFish1(null);
    setBattleFish2(null);
    setBattleLog([]);
    setIsFighting(false);
    setCurrentTurn(1);
    setWinner(null);
    setIsAnimating(false);
  };

  // Auto-advance turns during battle
  useEffect(() => {
    if (isFighting && !winner && !isAnimating && battleFish1 && battleFish2) {
      const timer = setTimeout(() => {
        nextTurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    isFighting,
    currentTurn,
    winner,
    isAnimating,
    battleFish1,
    battleFish2,
    nextTurn,
  ]);

  // Check if we have enough fish for battle
  if (opponentFishes) {
    // When battling a friend, we need at least 1 of our fish and 1 of their fish
    if (fishes.length < 1 || opponentFishes.length < 1) {
      return (
        <div className="flex items-center justify-center bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] m-6 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">⚔️</div>
            <div className="text-xl font-bold text-text-primary mb-2 font-mono">
              NOT ENOUGH FISH
            </div>
            <div className="text-sm text-text-secondary font-mono">
              {fishes.length < 1
                ? "You need at least 1 fish to battle"
                : `${
                    opponentName || "Your opponent"
                  } needs at least 1 fish to battle`}
            </div>
          </div>
        </div>
      );
    }
  } else {
    // When battling your own fish, need at least 2
    if (fishes.length < 2) {
      return (
        <div className="flex items-center justify-center bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] m-6 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">⚔️</div>
            <div className="text-xl font-bold text-text-primary mb-2 font-mono">
              NOT ENOUGH FISH
            </div>
            <div className="text-sm text-text-secondary font-mono">
              You need at least 2 fish in your dex to battle
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col">
      {!isFighting ? (
        // Selection Phase
        <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-4 rounded-lg">
              <h2 className="text-xl font-bold text-sonar-green font-mono mb-2">
                SELECT YOUR FIGHTERS
              </h2>
              <p className="text-xs text-text-secondary font-mono">
                {opponentFishes
                  ? `Choose your fish to battle against ${
                      opponentName || "your opponent"
                    }`
                  : "Choose 2 fish from your collection to battle"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fish 1 Selection */}
              <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit-border] backdrop-blur-[10px] rounded-lg p-6">
                <h3 className="text-lg font-bold text-sonar-green font-mono mb-4">
                  FIGHTER 1
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {fishes.map((fish) => (
                    <button
                      key={fish.id}
                      onClick={() => setSelectedFish1(fish)}
                      className={`border-2 rounded-lg p-3 transition-all ${
                        selectedFish1?.id === fish.id
                          ? "border-sonar-green bg-sonar-green/20 shadow-[--shadow-cockpit-border]"
                          : "border-panel-border hover:border-sonar-green/50"
                      }`}
                    >
                      <div className="relative w-full aspect-square mb-2 bg-deep-ocean rounded overflow-hidden">
                        {fish.image ? (
                          <Image
                            src={fish.image}
                            alt={fish.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🐟
                          </div>
                        )}
                        <div className="absolute top-1 right-1">
                          <div
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${getRarityBadgeClass(
                              fish.rarity
                            )}`}
                          >
                            {fish.rarity}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-text-primary text-center">
                        {fish.name}
                      </div>
                      {fish.dexEntry && (
                        <div className="text-[10px] font-mono text-sonar-green text-center mt-1">
                          CP: {fish.dexEntry.cpScore}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fish 2 Selection */}
              <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit-border] backdrop-blur-[10px] rounded-lg p-6">
                <h3 className="text-lg font-bold text-sonar-green font-mono mb-4">
                  {opponentFishes
                    ? `OPPONENT${opponentName ? ` (${opponentName})` : ""}`
                    : "FIGHTER 2"}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {fighter2Fishes.map((fish) => (
                    <button
                      key={fish.id}
                      onClick={() => setSelectedFish2(fish)}
                      className={`border-2 rounded-lg p-3 transition-all ${
                        selectedFish2?.id === fish.id
                          ? "border-sonar-green bg-sonar-green/20 shadow-[--shadow-cockpit-border]"
                          : "border-panel-border hover:border-sonar-green/50"
                      }`}
                    >
                      <div className="relative w-full aspect-square mb-2 bg-deep-ocean rounded overflow-hidden">
                        {fish.image ? (
                          <Image
                            src={fish.image}
                            alt={fish.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🐟
                          </div>
                        )}
                        <div className="absolute top-1 right-1">
                          <div
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${getRarityBadgeClass(
                              fish.rarity
                            )}`}
                          >
                            {fish.rarity}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-text-primary text-center">
                        {fish.name}
                      </div>
                      {fish.dexEntry && (
                        <div className="text-[10px] font-mono text-sonar-green text-center mt-1">
                          CP: {fish.dexEntry.cpScore}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Battle Button */}
            <div className="flex justify-center">
              <Button
                onClick={startBattle}
                disabled={!selectedFish1 || !selectedFish2}
                className="bg-sonar-green/20 border-2 border-sonar-green text-sonar-green hover:bg-sonar-green/30 font-mono font-bold shadow-[--shadow-cockpit-border] disabled:opacity-50 px-8 py-3 text-lg"
              >
                START BATTLE ⚔️
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Battle Phase
        <div className="flex flex-col bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)]">
          <div className="flex gap-6 p-6">
            {/* Left Side - Fighters */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Fighter 1 */}
              {battleFish1 && (
                <div className="flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] rounded-lg p-6">
                  <div className="text-lg font-bold text-sonar-green font-mono mb-4">
                    {battleFish1.fish.name}
                  </div>
                  <div className="relative w-48 h-48 mb-4 bg-deep-ocean rounded-lg overflow-hidden border-2 border-panel-border">
                    {battleFish1.fish.image ? (
                      <Image
                        src={battleFish1.fish.image}
                        alt={battleFish1.fish.name}
                        fill
                        className={`object-cover ${
                          currentTurn === 1 && isAnimating
                            ? "animate-pulse"
                            : ""
                        }`}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🐟
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <div
                        className={`px-2 py-1 rounded text-xs font-bold ${getRarityBadgeClass(
                          battleFish1.fish.rarity
                        )}`}
                      >
                        {battleFish1.fish.rarity}
                      </div>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>HP:</span>
                      <span className="text-sonar-green">
                        {battleFish1.hp} / {battleFish1.maxHp}
                      </span>
                    </div>
                    <div className="w-full bg-deep-ocean h-3 rounded overflow-hidden border border-panel-border">
                      <div
                        className="h-full bg-sonar-green transition-all duration-500"
                        style={{
                          width: `${
                            (battleFish1.hp / battleFish1.maxHp) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>ATK: {battleFish1.attack}</span>
                      <span>DEF: {battleFish1.defense}</span>
                    </div>
                  </div>
                  {winner === 1 && (
                    <div className="mt-4 text-2xl animate-bounce">🏆</div>
                  )}
                </div>
              )}

              {/* VS Divider */}
              <div className="flex items-center justify-center">
                <div className="text-3xl font-bold text-sonar-green font-mono">
                  VS
                </div>
              </div>

              {/* Fighter 2 */}
              {battleFish2 && (
                <div className="flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] rounded-lg p-6">
                  <div className="text-lg font-bold text-sonar-green font-mono mb-4">
                    {battleFish2.fish.name}
                  </div>
                  <div className="relative w-48 h-48 mb-4 bg-deep-ocean rounded-lg overflow-hidden border-2 border-panel-border">
                    {battleFish2.fish.image ? (
                      <Image
                        src={battleFish2.fish.image}
                        alt={battleFish2.fish.name}
                        fill
                        className={`object-cover ${
                          currentTurn === 2 && isAnimating
                            ? "animate-pulse"
                            : ""
                        }`}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🐟
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <div
                        className={`px-2 py-1 rounded text-xs font-bold ${getRarityBadgeClass(
                          battleFish2.fish.rarity
                        )}`}
                      >
                        {battleFish2.fish.rarity}
                      </div>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>HP:</span>
                      <span className="text-sonar-green">
                        {battleFish2.hp} / {battleFish2.maxHp}
                      </span>
                    </div>
                    <div className="w-full bg-deep-ocean h-3 rounded overflow-hidden border border-panel-border">
                      <div
                        className="h-full bg-sonar-green transition-all duration-500"
                        style={{
                          width: `${
                            (battleFish2.hp / battleFish2.maxHp) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>ATK: {battleFish2.attack}</span>
                      <span>DEF: {battleFish2.defense}</span>
                    </div>
                  </div>
                  {winner === 2 && (
                    <div className="mt-4 text-2xl animate-bounce">🏆</div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Battle Log */}
            <div className="w-80 bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] rounded-lg p-4 flex flex-col">
              <div className="text-sm font-bold text-sonar-green font-mono mb-3 border-b border-panel-border pb-2">
                BATTLE LOG
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {battleLog.length === 0 ? (
                  <div className="text-xs font-mono text-text-secondary text-center py-4">
                    Waiting for battle to start...
                  </div>
                ) : (
                  battleLog.map((log, index) => (
                    <div
                      key={index}
                      className={`text-xs font-mono p-2 rounded border border-panel-border/50 ${
                        log.type === "victory"
                          ? "text-sonar-green font-bold bg-sonar-green/10 border-sonar-green/50"
                          : log.type === "attack"
                          ? "text-warning-amber bg-warning-amber/10 border-warning-amber/50"
                          : "text-text-secondary"
                      }`}
                    >
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {winner && (
            <div className="flex justify-center p-4 border-t-2 border-panel-border">
              <Button
                onClick={resetBattle}
                className="bg-sonar-green/20 border-2 border-sonar-green text-sonar-green hover:bg-sonar-green/30 font-mono font-bold shadow-[--shadow-cockpit-border] px-8 py-3"
              >
                FIGHT AGAIN
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
