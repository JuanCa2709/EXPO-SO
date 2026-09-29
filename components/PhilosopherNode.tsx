"use client";

import { motion } from "framer-motion";
import { COLORS, STATE_META } from "@/lib/constants";
import type { PhilosopherState } from "@/lib/types";

export const PHILOSOPHER_TOKENS: Record<
  PhilosopherState,
  { fill: string; stroke: string; text: string; label: string }
> = {
  thinking: { fill: COLORS.bg2, stroke: "#3A4555", text: COLORS.ink2, label: COLORS.ink3 },
  hungry: { fill: COLORS.bg2, stroke: COLORS.blue2, text: COLORS.ink, label: COLORS.blue2 },
  holding: { fill: "rgba(59,130,246,0.16)", stroke: COLORS.blue, text: COLORS.ink, label: COLORS.blue2 },
  waiting: { fill: "rgba(96,165,250,0.07)", stroke: COLORS.blue2, text: COLORS.ink, label: COLORS.blue2 },
  eating: { fill: COLORS.blue, stroke: "#93C5FD", text: COLORS.ink, label: COLORS.ink },
  blocked: { fill: "rgba(255,90,95,0.13)", stroke: COLORS.red, text: COLORS.red, label: COLORS.red },
};

interface PhilosopherNodeProps {
  id: number;
  x: number;
  y: number;
  state: PhilosopherState;
  r?: number;
  /** Tenedores retenidos: 0, 1 o 2. */
  held?: number;
  selected?: boolean;
  dimmed?: boolean;
  label?: { x: number; y: number; anchor: "start" | "middle" | "end"; text?: string } | null;
  onSelect?: (id: number) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function PhilosopherNode({
  id,
  x,
  y,
  state,
  r = 30,
  held = 0,
  selected = false,
  dimmed = false,
  label,
  onSelect,
}: PhilosopherNodeProps) {
  const t = PHILOSOPHER_TOKENS[state];
  const interactive = Boolean(onSelect);
  const pipY = r * 0.42;

  return (
    <g
      className={interactive ? "diagram-node cursor-pointer" : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Filósofo P${id}, estado ${STATE_META[state].label}` : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={interactive ? () => onSelect?.(id) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(id);
              }
            }
          : undefined
      }
    >
      <motion.g
        initial={false}
        animate={{ opacity: dimmed ? 0.35 : 1 }}
        transition={{ duration: 0.4, ease }}
      >
        <g transform={`translate(${x} ${y})`}>
          {interactive && <circle className="focus-ring" r={r + 10} fill="none" stroke={COLORS.blue2} strokeWidth={1.5} />}
          {selected && <circle r={r + 7} fill="none" stroke={COLORS.blue2} strokeOpacity={0.55} />}

          {(state === "waiting" || state === "blocked") && (
            <motion.circle
              r={r + 6}
              fill="none"
              strokeWidth={1}
              strokeDasharray={state === "waiting" ? "3 5" : undefined}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.7, scale: 1, stroke: t.stroke }}
              transition={{ duration: 0.5, ease }}
            />
          )}

          <motion.circle
            r={r}
            initial={false}
            animate={{ fill: t.fill, stroke: t.stroke }}
            transition={{ duration: 0.45, ease }}
            strokeWidth={1.25}
          />

          {state === "hungry" && <circle cx={r * 0.72} cy={-r * 0.72} r={3.5} fill={COLORS.blue2} />}

          {state === "blocked" && (
            <g transform={`translate(0 ${-r * 0.44})`} stroke={COLORS.red} fill="none" strokeWidth={1.3} strokeLinecap="round">
              <rect x={-4.5} y={-2} width={9} height={7} rx={1.5} />
              <path d="M-2.6 -2v-2a2.6 2.6 0 0 1 5.2 0v2" />
            </g>
          )}

          <motion.text
            y={state === "blocked" ? 6 : 3}
            textAnchor="middle"
            className="font-mono"
            fontSize={r * 0.45}
            fontWeight={500}
            letterSpacing="0.04em"
            initial={false}
            animate={{ fill: t.text }}
            transition={{ duration: 0.45 }}
          >
            P{id}
          </motion.text>

          {/* Pips: cuántos tenedores retiene (visibiliza "retención y espera"). */}
          {[-1, 1].map((side, i) => (
            <circle
              key={side}
              cx={side * 4.5}
              cy={pipY}
              r={1.9}
              fill={i < held ? (state === "blocked" ? COLORS.red : state === "eating" ? COLORS.ink : COLORS.blue2) : "none"}
              stroke={state === "eating" ? COLORS.ink : t.stroke}
              strokeOpacity={i < held ? 1 : 0.45}
              strokeWidth={0.9}
            />
          ))}
        </g>

        {label && (
          <motion.text
            x={label.x}
            y={label.y}
            textAnchor={label.anchor}
            className="font-mono uppercase"
            fontSize={11}
            letterSpacing="0.12em"
            initial={false}
            animate={{ fill: t.label }}
            transition={{ duration: 0.45 }}
          >
            {label.text ?? STATE_META[state].label}
          </motion.text>
        )}
      </motion.g>
    </g>
  );
}
