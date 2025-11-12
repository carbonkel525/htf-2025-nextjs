"use client";

import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  left: number;
  animationDuration: number;
  delay: number;
  color: string;
}

const colors = [
  "#00ff88", // sonar-green
  "#ffd700", // gold
  "#ff6b6b", // red
  "#4ecdc4", // cyan
  "#95e1d3", // mint
  "#f38181", // coral
];

export default function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 2 + Math.random() * 2, // 2-4 seconds
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setPieces(newPieces);

    // Clean up after animation
    const timer = setTimeout(() => {
      setPieces([]);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-2 h-2 rounded-sm"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.animationDuration}s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
