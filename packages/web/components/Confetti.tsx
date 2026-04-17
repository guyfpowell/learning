'use client';

import { useEffect, useState } from 'react';

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  size: number;
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308'];

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.8,
    size: 6 + Math.random() * 8,
  }));
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;
    setPieces(generatePieces(60));

    const timer = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, 2800);

    return () => clearTimeout(timer);
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${1.8 + p.delay}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
