"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import { COLORS, PHILOSOPHER_COUNT } from "@/lib/constants";
import { trimSegment } from "@/lib/geometry";
import type { SimulationState } from "@/lib/types";

/** [proceso, recurso] */
export type GraphEdge = [number, number];
type Orientation = "horizontal" | "vertical";

interface ResourceGraphProps {
  /** Asignaciones: el recurso pertenece al proceso (R → P). */
  holds: GraphEdge[];
  /** Solicitudes: el proceso espera el recurso (P → R). */
  requests: GraphEdge[];
  /** Resalta todo el grafo como ciclo. */
  cycle?: boolean;
  title?: string;
  className?: string;
  showLegend?: boolean;
  /** vertical: procesos y recursos en columnas, para paneles estrechos. */
  orientation?: Orientation;
}

const N = PHILOSOPHER_COUNT;
const P_Y = 70;
const F_Y = 214;
const NODE = 21;
const px = (i: number) => 80 + i * 120;
/** F1…F4 entre sus dos vecinos; F0 cierra el anillo en el extremo. */
const fx = (j: number) => (j === 0 ? 620 : 80 + (j - 0.5) * 120);

type Pt = [number, number];
type Cmd = [string, ...Pt[]];

/** P0 ↔ F0 es la arista que cierra el anillo: recorre el borde del grafo. */
const RX = fx(0) + 44;
const WRAP_HOLD: Cmd[] = [
  ["M", [fx(0) + NODE + 2, F_Y]],
  ["C", [RX, F_Y], [RX, F_Y], [RX, F_Y + 28]],
  ["L", [RX, 258]],
  ["C", [RX, 286], [RX, 286], [RX - 28, 286]],
  ["L", [58, 286]],
  ["C", [30, 286], [30, 286], [30, 258]],
  ["L", [30, 98]],
  ["C", [30, P_Y], [30, P_Y], [px(0) - NODE - 4, P_Y]],
];
const WRAP_REQUEST: Cmd[] = [
  ["M", [px(0) - NODE - 2, P_Y]],
  ["C", [30, P_Y], [30, P_Y], [30, 98]],
  ["L", [30, 258]],
  ["C", [30, 286], [30, 286], [58, 286]],
  ["L", [RX - 28, 286]],
  ["C", [RX, 286], [RX, 286], [RX, 258]],
  ["L", [RX, F_Y + 28]],
  ["C", [RX, F_Y], [RX, F_Y], [fx(0) + NODE + 4, F_Y]],
];

function makeGeometry(o: Orientation) {
  const pt = ([x, y]: Pt): Pt => (o === "vertical" ? [y, x] : [x, y]);
  const P = (i: number) => pt([px(i), P_Y]);
  const F = (j: number) => pt([fx(j), F_Y]);
  const serialize = (cmds: Cmd[]) => cmds.map(([c, ...pts]) => `${c} ${pts.map((p) => pt(p).join(" ")).join(", ")}`).join(" ");

  const edgePath = (p: number, f: number, kind: "hold" | "request") => {
    if (p === 0 && f === 0) return serialize(kind === "hold" ? WRAP_HOLD : WRAP_REQUEST);
    const [ax, ay] = P(p);
    const [bx, by] = F(f);
    const s = trimSegment({ x: ax, y: ay }, { x: bx, y: by }, NODE + 4, NODE + 6);
    const seg = (x1: number, y1: number, x2: number, y2: number) => `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    return kind === "hold" ? seg(s.x2, s.y2, s.x1, s.y1) : seg(s.x1, s.y1, s.x2, s.y2);
  };

  return {
    P,
    F,
    edgePath,
    viewBox: o === "vertical" ? "0 0 300 690" : "0 0 690 300",
    forkLabel: o === "vertical" ? { x: NODE + 10, y: 4, anchor: "start" as const } : { x: 0, y: NODE + 18, anchor: "middle" as const },
    titles:
      o === "vertical"
        ? [
            { text: "Procesos", x: P_Y, y: 12, anchor: "middle" as const },
            { text: "Recursos", x: F_Y, y: 12, anchor: "middle" as const },
          ]
        : [
            { text: "Procesos", x: px(0) - NODE - 8, y: 24, anchor: "start" as const },
            { text: "Recursos", x: 40, y: F_Y - NODE - 14, anchor: "start" as const },
          ],
  };
}

export function graphFromState(state: Pick<SimulationState, "philosophers" | "forks">) {
  const holds: GraphEdge[] = state.forks.filter((f) => f.heldBy !== null).map((f) => [f.heldBy as number, f.id]);
  const requests: GraphEdge[] = state.philosophers
    .filter((p) => (p.state === "waiting" || p.state === "blocked") && p.waitingFor !== null)
    .map((p) => [p.id, p.waitingFor as number]);
  return { holds, requests };
}

export function ResourceGraph({
  holds,
  requests,
  cycle = false,
  title = "Grafo de asignación de recursos",
  className,
  showLegend = true,
  orientation = "horizontal",
}: ResourceGraphProps) {
  const uid = useId().replace(/:/g, "");
  const g = makeGeometry(orientation);
  const holdColor = cycle ? COLORS.red : COLORS.blue;
  const requestColor = cycle ? COLORS.red : COLORS.blue2;
  const active = new Set([...holds, ...requests].map(([p]) => p));

  return (
    <figure className={className}>
      <svg viewBox={g.viewBox} role="img" aria-labelledby={`${uid}-t`} className="w-full">
        <title id={`${uid}-t`}>{title}</title>
        <defs>
          {[
            ["hold", holdColor],
            ["req", requestColor],
          ].map(([id, color]) => (
            <marker key={id} id={`${uid}-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M1 1.5 8.5 5 1 8.5" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          ))}
        </defs>

        <g fill="none" strokeLinecap="round">
          <AnimatePresence initial={false}>
            {holds.map(([p, f]) => (
              <motion.path
                key={`h-${p}-${f}`}
                d={g.edgePath(p, f, "hold")}
                strokeWidth={1.4}
                markerEnd={`url(#${uid}-hold)`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1, stroke: holdColor }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            ))}
            {requests.map(([p, f]) => (
              <motion.path
                key={`r-${p}-${f}`}
                d={g.edgePath(p, f, "request")}
                strokeWidth={1.3}
                strokeDasharray="4 5"
                markerEnd={`url(#${uid}-req)`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, stroke: requestColor }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>
        </g>

        {Array.from({ length: N }, (_, i) => {
          const [x, y] = g.P(i);
          const stroke = cycle ? COLORS.red : active.has(i) ? COLORS.blue2 : "#3A4555";
          return (
            <g key={`p${i}`} transform={`translate(${x} ${y})`}>
              <motion.circle r={NODE} fill={COLORS.bg2} strokeWidth={1.2} initial={false} animate={{ stroke }} transition={{ duration: 0.45 }} />
              <text y={4} textAnchor="middle" className="font-mono" fontSize={12} fill={cycle ? COLORS.red : COLORS.ink}>
                P{i}
              </text>
            </g>
          );
        })}

        {Array.from({ length: N }, (_, j) => {
          const [x, y] = g.F(j);
          const held = holds.some(([, f]) => f === j);
          const stroke = cycle ? COLORS.red : held ? COLORS.blue : "#3A4555";
          return (
            <g key={`f${j}`} transform={`translate(${x} ${y})`}>
              <motion.rect x={-NODE} y={-NODE} width={NODE * 2} height={NODE * 2} rx={3} fill={COLORS.bg1} strokeWidth={1.2} initial={false} animate={{ stroke }} transition={{ duration: 0.45 }} />
              <circle r={3} fill={held ? (cycle ? COLORS.red : COLORS.blue2) : COLORS.ink3} />
              <text x={g.forkLabel.x} y={g.forkLabel.y} textAnchor={g.forkLabel.anchor} className="font-mono" fontSize={11} fill={COLORS.ink3}>
                F{j}
              </text>
            </g>
          );
        })}

        {g.titles.map((t) => (
          <text key={t.text} x={t.x} y={t.y} textAnchor={t.anchor} className="font-mono uppercase" fontSize={10} letterSpacing="0.18em" fill={COLORS.ink3}>
            {t.text}
          </text>
        ))}
      </svg>

      {showLegend && (
        <figcaption className="label mt-4 flex flex-wrap gap-x-6 gap-y-2 text-ink-3">
          <span className="inline-flex items-center gap-2">
            <svg width="26" height="6" aria-hidden>
              <line x1="1" y1="3" x2="25" y2="3" stroke={holdColor} strokeWidth="1.4" />
            </svg>
            Asignación R → P
          </span>
          <span className="inline-flex items-center gap-2">
            <svg width="26" height="6" aria-hidden>
              <line x1="1" y1="3" x2="25" y2="3" stroke={requestColor} strokeWidth="1.3" strokeDasharray="4 4" />
            </svg>
            Solicitud P → R
          </span>
        </figcaption>
      )}
    </figure>
  );
}
