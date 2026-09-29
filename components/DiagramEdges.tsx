"use client";

import { AnimatePresence, motion } from "framer-motion";
import { COLORS } from "@/lib/constants";
import { forkPosition, trimSegment, type LayoutSpec } from "@/lib/geometry";
import type { Fork, Philosopher } from "@/lib/types";

interface Edge {
  key: string;
  kind: "hold" | "wait" | "need";
  philosopher: number;
  fork: number;
  blocked: boolean;
}

interface DiagramEdgesProps {
  spec: LayoutSpec;
  philosophers: Philosopher[];
  forks: Fork[];
  selected?: number | null;
}

const FORK_TRIM = 19;

function edgeGeometry(spec: LayoutSpec, edge: Edge, forks: Fork[]) {
  const p = spec.philosopher(edge.philosopher);
  const f =
    edge.kind === "need" ? spec.fork(edge.fork) : forkPosition(spec, edge.fork, forks[edge.fork].heldBy);
  const wrap = spec.wrapPath(p, f, edge.philosopher, edge.fork);
  if (wrap) return { d: wrap };
  const s = trimSegment(p, f, spec.nodeRadius + 4, FORK_TRIM);
  return { d: `M ${s.x1.toFixed(1)} ${s.y1.toFixed(1)} L ${s.x2.toFixed(1)} ${s.y2.toFixed(1)}` };
}

function style(edge: Edge) {
  if (edge.kind === "hold") return { stroke: edge.blocked ? COLORS.red : COLORS.blue, dash: undefined, opacity: 0.85, width: 1.4 };
  if (edge.kind === "wait") return { stroke: edge.blocked ? COLORS.red : COLORS.blue2, dash: "4 5", opacity: 0.9, width: 1.2 };
  return { stroke: COLORS.blue2, dash: "1.5 5", opacity: 0.8, width: 1.2 };
}

/**
 * Aristas proceso ↔ recurso:
 * - hold: el tenedor está asignado al filósofo (línea continua)
 * - wait: el filósofo solicita un tenedor ocupado (discontinua)
 * - need: recursos que necesita el proceso seleccionado (punteada)
 */
export function DiagramEdges({ spec, philosophers, forks, selected = null }: DiagramEdgesProps) {
  const edges: Edge[] = [];

  for (const f of forks) {
    if (f.heldBy === null) continue;
    const blocked = philosophers[f.heldBy].state === "blocked";
    edges.push({ key: `hold-${f.id}-${f.heldBy}`, kind: "hold", philosopher: f.heldBy, fork: f.id, blocked });
  }
  for (const p of philosophers) {
    if ((p.state === "waiting" || p.state === "blocked") && p.waitingFor !== null) {
      edges.push({ key: `wait-${p.id}-${p.waitingFor}`, kind: "wait", philosopher: p.id, fork: p.waitingFor, blocked: p.state === "blocked" });
    }
  }
  if (selected !== null) {
    const p = philosophers[selected];
    for (const fork of [p.leftFork, p.rightFork]) {
      edges.push({ key: `need-${selected}-${fork}`, kind: "need", philosopher: selected, fork, blocked: false });
    }
  }

  return (
    <g aria-hidden fill="none" strokeLinecap="round">
      <AnimatePresence initial={false}>
        {edges.map((edge) => {
          const { d } = edgeGeometry(spec, edge, forks);
          const s = style(edge);
          return (
            <motion.path
              key={edge.key}
              d={d}
              strokeWidth={s.width}
              strokeDasharray={s.dash}
              initial={{ opacity: 0 }}
              animate={{ opacity: s.opacity, stroke: s.stroke }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          );
        })}
      </AnimatePresence>
    </g>
  );
}

