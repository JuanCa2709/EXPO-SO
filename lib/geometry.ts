/**
 * Geometría del sistema visual. Dos composiciones del mismo grafo:
 * - ring: la mesa circular (escritorio / tablet)
 * - chain: el anillo desplegado en vertical (móvil)
 */
import { PHILOSOPHER_COUNT } from "./constants";

const N = PHILOSOPHER_COUNT;

export type Layout = "ring" | "chain";

export interface Point {
  x: number;
  y: number;
}

export interface LayoutSpec {
  width: number;
  height: number;
  nodeRadius: number;
  philosopher: (id: number) => Point;
  fork: (id: number) => Point;
  /** Rotación del glifo del tenedor (grados). */
  forkRotation: (id: number) => number;
  /** Posición del rótulo de estado de un filósofo. */
  stateLabel: (id: number) => Point & { anchor: "start" | "middle" | "end" };
  forkLabel: (id: number) => Point;
  /** Trazado para una arista filósofo ↔ tenedor, a partir de sus centros (null = línea recta). */
  wrapPath: (philosopherCenter: Point, forkCenter: Point, philosopher: number, fork: number) => string | null;
  /** Arcos del ciclo Pi → Pi+1. */
  cycleArc: (from: number, to: number) => string;
  center: Point;
}

/** Redondeo estable: evita diferencias de coma flotante entre servidor y navegador. */
export const r2 = (n: number) => Math.round(n * 100) / 100;

const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (c: Point, r: number, deg: number): Point => ({
  x: c.x + r * Math.cos(rad(deg)),
  y: c.y + r * Math.sin(rad(deg)),
});
const round = (p: Point): Point => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });

/* --------------------------------------------------------------- ring -- */

const RING_C = { x: 360, y: 360 };
const R_PHIL = 250;
const R_FORK = 150;
const R_CYCLE = 312;
const philAngle = (id: number) => -90 + (360 / N) * id;
const forkAngle = (id: number) => philAngle(id) - 180 / N;

const ring: LayoutSpec = {
  width: 720,
  height: 720,
  nodeRadius: 30,
  center: RING_C,
  philosopher: (id) => round(polar(RING_C, R_PHIL, philAngle(id))),
  fork: (id) => round(polar(RING_C, R_FORK, forkAngle(id))),
  forkRotation: (id) => forkAngle(id) + 90,
  stateLabel: (id) => {
    const p = polar(RING_C, R_PHIL, philAngle(id));
    return { x: Math.round(p.x), y: Math.round(p.y + 54), anchor: "middle" };
  },
  forkLabel: (id) => round(polar(RING_C, R_FORK - 40, forkAngle(id))),
  wrapPath: () => null,
  cycleArc: (from, to) => {
    const gap = 9;
    const a = polar(RING_C, R_CYCLE, philAngle(from) + gap);
    const b = polar(RING_C, R_CYCLE, philAngle(to) - gap);
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${R_CYCLE} ${R_CYCLE} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  },
};

/* -------------------------------------------------------------- chain -- */

const CHAIN_X = 96;
const ROW = 58;
const TOP = 52;
/** Orden vertical: F0, P0, F1, P1, … F4, P4. */
const chainY = (row: number) => TOP + row * ROW;
const RAIL_RIGHT = 332;

const chain: LayoutSpec = {
  width: 360,
  height: TOP * 2 + ROW * (N * 2 - 1) + 8,
  nodeRadius: 22,
  center: { x: CHAIN_X, y: chainY(N) },
  philosopher: (id) => ({ x: CHAIN_X, y: chainY(id * 2 + 1) }),
  fork: (id) => ({ x: CHAIN_X, y: chainY(id * 2) }),
  forkRotation: () => 0,
  stateLabel: (id) => ({ x: CHAIN_X + 44, y: chainY(id * 2 + 1) + 4, anchor: "start" }),
  forkLabel: (id) => ({ x: CHAIN_X + 34, y: chainY(id * 2) + 4 }),
  wrapPath: (p, f, philosopher, fork) => {
    // P(N-1) ↔ F0 cierra el anillo: sale por debajo de P4, sube por el carril derecho y entra a F0 por arriba.
    if (!(philosopher === N - 1 && fork === 0)) return null;
    const r = 10;
    const low = p.y + 40;
    const high = f.y - 32;
    return [
      `M ${p.x} ${p.y + 26}`,
      `V ${low - r}`,
      `Q ${p.x} ${low} ${p.x + r} ${low}`,
      `H ${RAIL_RIGHT - r}`,
      `Q ${RAIL_RIGHT} ${low} ${RAIL_RIGHT} ${low - r}`,
      `V ${high + r}`,
      `Q ${RAIL_RIGHT} ${high} ${RAIL_RIGHT - r} ${high}`,
      `H ${f.x + r}`,
      `Q ${f.x} ${high} ${f.x} ${high + r}`,
      `V ${f.y - 18}`,
    ].join(" ");
  },
  cycleArc: (from, to) => {
    const a = chain.philosopher(from);
    const b = chain.philosopher(to);
    if (to === 0 && from === N - 1) {
      const x = 22;
      return `M ${a.x - 26} ${a.y} C ${x} ${a.y}, ${x} ${a.y}, ${x} ${a.y - 30} V ${b.y + 30} C ${x} ${b.y}, ${x} ${b.y}, ${b.x - 26} ${b.y}`;
    }
    const x = 52;
    return `M ${a.x - 24} ${a.y + 8} C ${x} ${a.y + 30}, ${x} ${b.y - 30}, ${b.x - 24} ${b.y - 8}`;
  },
};

export const LAYOUTS: Record<Layout, LayoutSpec> = { ring, chain };

/** Posición de un tenedor: se desplaza hacia quien lo retiene. */
export function forkPosition(spec: LayoutSpec, forkId: number, heldBy: number | null): Point {
  const base = spec.fork(forkId);
  if (heldBy === null) return base;
  const owner = spec.philosopher(heldBy);
  const dx = owner.x - base.x;
  const dy = owner.y - base.y;
  const dist = Math.hypot(dx, dy);
  // Arista de retorno en la composición vertical: el tenedor apenas se mueve.
  const pull = dist > spec.height / 2 ? 0 : Math.min(dist * 0.26, 36);
  return round({ x: base.x + (dx / dist) * pull, y: base.y + (dy / dist) * pull });
}

/** Recorta un segmento para que no invada los nodos. */
export function trimSegment(a: Point, b: Point, trimA: number, trimB: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  return {
    x1: a.x + (dx / d) * trimA,
    y1: a.y + (dy / d) * trimA,
    x2: b.x - (dx / d) * trimB,
    y2: b.y - (dy / d) * trimB,
  };
}
