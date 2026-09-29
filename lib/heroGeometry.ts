/**
 * Geometría y coreografía del hero: dónde está cada comensal en la fotografía
 * y en qué tramo del scroll se sienta.
 */
import { r2 } from "./geometry";
import { HERO_DINERS, HERO_SIZE, HERO_TABLE, type HeroDinerShape } from "./heroDiners";

export interface Pt {
  x: number;
  y: number;
}

const CENTER: Pt = { x: HERO_TABLE.cx, y: HERO_TABLE.cy };

/** Punto de referencia de cada comensal (su cabeza), en el espacio 2400 × 1500. */
export const HERO_ANCHORS: Pt[] = [
  { x: 1222, y: 222 },
  { x: 1668, y: 458 },
  { x: 1497, y: 950 },
  { x: 962, y: 925 },
  { x: 782, y: 566 },
];

export const pctX = (x: number) => `${r2((x / HERO_SIZE.width) * 100)}%`;
export const pctY = (y: number) => `${r2((y / HERO_SIZE.height) * 100)}%`;

export function outward(p: Pt, distance: number): Pt {
  const dx = p.x - CENTER.x;
  const dy = p.y - CENTER.y;
  const d = Math.hypot(dx, dy);
  return { x: r2(p.x + (dx / d) * distance), y: r2(p.y + (dy / d) * distance) };
}

/** Dirección desde el centro de la mesa hacia el centro del recorte. */
export function dinerDirection(d: HeroDinerShape): Pt {
  const dx = d.x + d.w / 2 - CENTER.x;
  const dy = d.y + d.h / 2 - CENTER.y;
  const len = Math.hypot(dx, dy);
  return { x: r2(dx / len), y: r2(dy / len) };
}

/** Silueta del comensal como clip-path relativo a su caja. */
export function clipPolygon(d: HeroDinerShape): string {
  return `polygon(${d.poly.map(([x, y]) => `${r2(((x - d.x) / d.w) * 100)}% ${r2(((y - d.y) / d.h) * 100)}%`).join(", ")})`;
}

/** Dependencia Pi → Pi+1 alrededor de la mesa. */
export function dependencyPath(i: number): string {
  const a = HERO_ANCHORS[i];
  const b = HERO_ANCHORS[(i + 1) % HERO_ANCHORS.length];
  const c = outward({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, 105);
  return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
}

/** Ángulo en el espacio normalizado de la elipse de la mesa. */
const tableAngle = (p: Pt) => Math.atan2((p.y - CENTER.y) / HERO_TABLE.ry, (p.x - CENTER.x) / HERO_TABLE.rx);

/** Fi queda sobre la mesa entre P(i-1) y Pi. */
export const HERO_FORKS: Pt[] = HERO_ANCHORS.map((_, i) => {
  const a = tableAngle(HERO_ANCHORS[(i + HERO_ANCHORS.length - 1) % HERO_ANCHORS.length]);
  let b = tableAngle(HERO_ANCHORS[i]);
  if (b < a) b += Math.PI * 2;
  const mid = (a + b) / 2;
  return { x: r2(CENTER.x + HERO_TABLE.rx * 0.8 * Math.cos(mid)), y: r2(CENTER.y + HERO_TABLE.ry * 0.8 * Math.sin(mid)) };
});

/* ------------------------------------------------------- coreografía -- */

const SEAT_START = 0.02;
const SEAT_STEP = 0.14;
const SEAT_SPAN = 0.22;

/** Tramo del progreso en el que se sienta el comensal i. */
export const seatRange = (i: number): [number, number] => [SEAT_START + i * SEAT_STEP, SEAT_START + i * SEAT_STEP + SEAT_SPAN];
export const ARCS_RANGE: [number, number] = [0.8, 0.92];
export const FORKS_RANGE: [number, number] = [0.84, 0.96];

/** Comensales ya sentados para un progreso dado (se sientan en orden). */
export const seatedCount = (progress: number) =>
  HERO_DINERS.filter((d) => progress >= seatRange(d.id)[1] - 0.03).length;
