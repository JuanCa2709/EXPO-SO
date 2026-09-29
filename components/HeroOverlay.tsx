"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { COLORS } from "@/lib/constants";
import { ARCS_RANGE, FORKS_RANGE, HERO_ANCHORS, HERO_FORKS, dependencyPath } from "@/lib/heroGeometry";

interface HeroOverlayProps {
  progress: MotionValue<number>;
  seated: number;
  active: number | null;
  selected: number | null;
}

const N = HERO_ANCHORS.length;
const ease = [0.22, 1, 0.36, 1] as const;

/** Capa técnica sobre la fotografía: asientos, dependencias y recursos. */
export function HeroOverlay({ progress, seated, active, selected }: HeroOverlayProps) {
  const arcs = useTransform(progress, ARCS_RANGE, [0, 1]);
  const forks = useTransform(progress, FORKS_RANGE, [0, 1]);
  const needs = selected === null ? [] : [selected, (selected + 1) % N];

  return (
    <svg viewBox="0 0 2400 1500" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden fill="none">
      {HERO_ANCHORS.map((_, i) => {
        const touches = selected !== null && (i === selected || (i + 1) % N === selected);
        return (
          <motion.path
            key={`dep-${i}`}
            d={dependencyPath(i)}
            stroke={COLORS.blue2}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            style={{ pathLength: arcs }}
            initial={false}
            animate={{ opacity: selected === null ? 0.3 : touches ? 0.95 : 0.1 }}
            transition={{ duration: 0.4, ease }}
          />
        );
      })}

      <motion.g style={{ opacity: forks }}>
        {HERO_FORKS.map((f, j) => {
          const on = needs.includes(j);
          return (
            <g key={`fork-${j}`} transform={`translate(${f.x} ${f.y})`}>
              <motion.circle
                r={9}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                initial={false}
                animate={{ stroke: on ? COLORS.blue2 : COLORS.ink2, fill: on ? COLORS.blue2 : "rgba(5,7,11,0.6)", opacity: on ? 1 : 0.55 }}
                transition={{ duration: 0.35 }}
              />
              <text
                y={-22}
                textAnchor="middle"
                className="hidden font-mono sm:inline"
                fontSize={26}
                letterSpacing="0.1em"
                fill={on ? COLORS.blue2 : COLORS.ink3}
              >
                F{j}
              </text>
            </g>
          );
        })}
      </motion.g>

      {HERO_ANCHORS.map((p, i) => {
        const isSeated = i < seated;
        const highlight = i === active || i === selected;
        return (
          <g key={`seat-${i}`} transform={`translate(${p.x} ${p.y})`}>
            <motion.circle
              r={isSeated ? 21 : 26}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={isSeated ? undefined : "3 5"}
              initial={false}
              animate={{ stroke: highlight ? COLORS.blue2 : isSeated ? COLORS.blue2 : COLORS.ink3, opacity: highlight ? 1 : isSeated ? 0.4 : 0.7 }}
              transition={{ duration: 0.35 }}
            />
            {highlight && <circle r={33} stroke={COLORS.blue2} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />}
            <circle
              r={7}
              fill={isSeated ? COLORS.bg : "none"}
              stroke={isSeated ? COLORS.ink : COLORS.ink3}
              strokeOpacity={0.85}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
}
