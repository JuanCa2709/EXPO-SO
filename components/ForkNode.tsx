"use client";

import { motion } from "framer-motion";
import { COLORS } from "@/lib/constants";
import type { ForkVisualState } from "@/lib/types";
import { ForkGlyph } from "./ForkGlyph";

export const FORK_TOKENS: Record<ForkVisualState, { color: string; ring: string; ringOpacity: number }> = {
  available: { color: COLORS.ink2, ring: COLORS.line, ringOpacity: 0.9 },
  held: { color: COLORS.blue2, ring: COLORS.blue, ringOpacity: 0.55 },
  requested: { color: COLORS.blue2, ring: COLORS.blue2, ringOpacity: 0.9 },
  blocked: { color: COLORS.red, ring: COLORS.red, ringOpacity: 0.8 },
};

interface ForkNodeProps {
  id: number;
  x: number;
  y: number;
  state: ForkVisualState;
  rotation?: number;
  size?: number;
  emphasis?: boolean;
  dimmed?: boolean;
  label?: { x: number; y: number } | null;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function ForkNode({
  id,
  x,
  y,
  state,
  rotation = 0,
  size = 34,
  emphasis = false,
  dimmed = false,
  label,
}: ForkNodeProps) {
  const t = FORK_TOKENS[state];
  const radius = size * 0.52;

  return (
    <g>
      <motion.g
        initial={false}
        animate={{ x, y, opacity: dimmed ? 0.3 : 1 }}
        transition={{ duration: 0.55, ease }}
      >
        <motion.circle
          r={radius}
          fill={COLORS.bg1}
          strokeWidth={1}
          strokeDasharray={state === "requested" ? "2.5 3.5" : undefined}
          initial={false}
          animate={{ stroke: emphasis ? COLORS.blue2 : t.ring, strokeOpacity: emphasis ? 1 : t.ringOpacity }}
          transition={{ duration: 0.45 }}
        />
        <motion.g initial={false} animate={{ color: emphasis ? COLORS.blue2 : t.color }} transition={{ duration: 0.45 }}>
          <ForkGlyph size={size * 0.78} rotation={rotation} strokeWidth={1.4} />
        </motion.g>
      </motion.g>
      {label && (
        <text
          x={label.x}
          y={label.y + 4}
          textAnchor="middle"
          className="font-mono"
          fontSize={11}
          letterSpacing="0.08em"
          fill={state === "blocked" ? COLORS.red : emphasis ? COLORS.blue2 : COLORS.ink3}
          opacity={dimmed ? 0.4 : 1}
        >
          F{id}
        </text>
      )}
    </g>
  );
}
