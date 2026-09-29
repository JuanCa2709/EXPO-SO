"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { COLORS } from "@/lib/constants";
import type { LayoutSpec } from "@/lib/geometry";

interface DeadlockCycleProps {
  spec: LayoutSpec;
  cycle: number[];
  color?: string;
  /** Flujo lento a lo largo del ciclo una vez dibujado. */
  flow?: boolean;
}

/** Dibuja P0 → P1 → P2 → P3 → P4 → P0 sobre la geometría activa. */
export function DeadlockCycle({ spec, cycle, color = COLORS.red, flow = true }: DeadlockCycleProps) {
  const markerId = `arrow-${useId().replace(/:/g, "")}`;
  const arcs = cycle.map((from, i) => ({ from, to: cycle[(i + 1) % cycle.length] }));

  return (
    <g aria-hidden>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1.5 8 5 1 8.5" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {arcs.map(({ from, to }, i) => {
        const d = spec.cycleArc(from, to);
        return (
          <g key={`${from}-${to}`}>
            <motion.path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.22, ease: "easeOut" }}
            />
            {flow && (
              <motion.path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="1 14"
                className="cycle-flow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                transition={{ duration: 0.8, delay: 0.3 + arcs.length * 0.22 }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
