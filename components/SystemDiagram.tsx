"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { COLORS } from "@/lib/constants";
import { LAYOUTS, forkPosition, r2, type Layout, type LayoutSpec } from "@/lib/geometry";
import { forkVisualState, heldForks } from "@/lib/simulation";
import type { Fork, Philosopher } from "@/lib/types";
import { DeadlockCycle } from "./DeadlockCycle";
import { DiagramEdges } from "./DiagramEdges";
import { ForkNode } from "./ForkNode";
import { PhilosopherNode } from "./PhilosopherNode";

export interface CenterReadout {
  eyebrow?: string;
  title: string;
  tone?: "neutral" | "blue" | "red";
}

interface SystemDiagramProps {
  philosophers: Philosopher[];
  forks: Fork[];
  cycle?: number[] | null;
  layout?: Layout;
  selected?: number | null;
  onSelect?: (id: number) => void;
  showStateLabels?: boolean;
  center?: CenterReadout | null;
  title: string;
  description?: string;
  className?: string;
}

const TONE = { neutral: COLORS.ink2, blue: COLORS.blue2, red: COLORS.red } as const;

function TableBackdrop({ spec }: { spec: LayoutSpec }) {
  const { x, y } = spec.center;
  return (
    <g aria-hidden>
      <circle cx={x} cy={y} r={250} fill="none" stroke={COLORS.ink2} strokeOpacity={0.07} />
      <circle cx={x} cy={y} r={196} fill={COLORS.bg2} fillOpacity={0.55} stroke={COLORS.line} strokeOpacity={0.9} />
      <circle cx={x} cy={y} r={104} fill="none" stroke={COLORS.ink2} strokeOpacity={0.08} strokeDasharray="2 6" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const long = i % 12 === 0;
        const r1 = 196;
        const rOuter = long ? 205 : 200;
        return (
          <line
            key={i}
            x1={r2(x + r1 * Math.cos(a))}
            y1={r2(y + r1 * Math.sin(a))}
            x2={r2(x + rOuter * Math.cos(a))}
            y2={r2(y + rOuter * Math.sin(a))}
            stroke={COLORS.ink2}
            strokeOpacity={long ? 0.3 : 0.12}
          />
        );
      })}
      <path d={`M ${x - 8} ${y} H ${x + 8} M ${x} ${y - 8} V ${y + 8}`} stroke={COLORS.ink3} strokeOpacity={0.35} />
    </g>
  );
}

function ChainBackdrop({ spec }: { spec: LayoutSpec }) {
  const first = spec.fork(0);
  const last = spec.philosopher(4);
  return (
    <line
      aria-hidden
      x1={first.x}
      y1={first.y}
      x2={last.x}
      y2={last.y}
      stroke={COLORS.ink2}
      strokeOpacity={0.08}
    />
  );
}

/**
 * La mesa como sistema: procesos, recursos y sus relaciones.
 * Composición "ring" (circular) o "chain" (anillo desplegado en vertical).
 */
export function SystemDiagram({
  philosophers,
  forks,
  cycle = null,
  layout = "ring",
  selected = null,
  onSelect,
  showStateLabels = true,
  center = null,
  title,
  description,
  className,
}: SystemDiagramProps) {
  const spec = LAYOUTS[layout];
  const uid = useId().replace(/:/g, "");
  const view = { philosophers, cycle };
  const needs = selected !== null ? [philosophers[selected].leftFork, philosophers[selected].rightFork] : [];
  const neighbours = selected !== null ? [selected, (selected + 4) % 5, (selected + 1) % 5] : [];

  return (
    <svg
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      className={className}
      role={onSelect ? "group" : "img"}
      aria-labelledby={`${uid}-title`}
      aria-describedby={description ? `${uid}-desc` : undefined}
    >
      <title id={`${uid}-title`}>{title}</title>
      {description && <desc id={`${uid}-desc`}>{description}</desc>}

      {layout === "ring" ? <TableBackdrop spec={spec} /> : <ChainBackdrop spec={spec} />}

      <DiagramEdges spec={spec} philosophers={philosophers} forks={forks} selected={selected} />

      {forks.map((f) => {
        const pos = forkPosition(spec, f.id, f.heldBy);
        return (
          <ForkNode
            key={f.id}
            id={f.id}
            x={pos.x}
            y={pos.y}
            size={layout === "ring" ? 34 : 28}
            rotation={spec.forkRotation(f.id)}
            state={forkVisualState(f, view)}
            emphasis={needs.includes(f.id)}
            dimmed={selected !== null && !needs.includes(f.id)}
            label={spec.forkLabel(f.id)}
          />
        );
      })}

      {philosophers.map((p) => {
        const pos = spec.philosopher(p.id);
        const label = spec.stateLabel(p.id);
        const detail = layout === "chain" && p.waitingFor !== null ? ` · F${p.waitingFor}` : "";
        return (
          <PhilosopherNode
            key={p.id}
            id={p.id}
            x={pos.x}
            y={pos.y}
            r={spec.nodeRadius}
            state={p.state}
            held={heldForks({ forks }, p.id).length}
            selected={selected === p.id}
            dimmed={selected !== null && !neighbours.includes(p.id)}
            label={showStateLabels ? { ...label, text: `${p.state}${detail}` } : null}
            onSelect={onSelect}
          />
        );
      })}

      {cycle && <DeadlockCycle spec={spec} cycle={cycle} />}

      {center && layout === "ring" && (
        <g aria-hidden textAnchor="middle" className="font-mono">
          {center.eyebrow && (
            <text x={spec.center.x} y={spec.center.y - 26} fontSize={10.5} letterSpacing="0.2em" fill={COLORS.ink3}>
              {center.eyebrow}
            </text>
          )}
          <motion.text
            key={center.title}
            x={spec.center.x}
            y={spec.center.y + 30}
            fontSize={13}
            letterSpacing="0.22em"
            fill={TONE[center.tone ?? "neutral"]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {center.title}
          </motion.text>
        </g>
      )}
    </svg>
  );
}
