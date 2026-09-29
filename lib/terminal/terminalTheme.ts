/**
 * Color de la terminal: se elige en la paleta de neofetch (o con `theme`) y lo comparten
 * todas las terminales de la página. Se recuerda en este navegador.
 */

export interface PaletteColor {
  index: number;
  hex: string;
  name: string;
  /** Nombres aceptados por `theme` (español e inglés). */
  aliases: string[];
}

const BASE = [
  ["negro", "black"],
  ["rojo", "red"],
  ["verde", "green"],
  ["amarillo", "yellow"],
  ["azul", "blue"],
  ["magenta", "magenta"],
  ["cian", "cyan"],
  ["blanco", "white"],
];

/** Paleta ANSI de la terminal del portátil (medida en el último frame): normales y brillantes. */
const HEX = [
  ["#132233", "#a8322c", "#3d783e", "#bc942c", "#005cd2", "#9e4fb3", "#32a9d1", "#c0cbd8"],
  ["#2b3a4c", "#d34137", "#4a9346", "#dab033", "#006ee7", "#ab57b9", "#37b6dc", "#d0dbe6"],
];

export const PALETTE: PaletteColor[] = HEX.flatMap((row, bright) =>
  row.map((hex, i) => {
    const [es, en] = BASE[i];
    const name = bright ? (i === 0 ? "gris" : i === 7 ? "blanco brillante" : `${es} claro`) : es;
    const aliases = bright
      ? [name, name.replace(" ", "-"), i === 0 ? "gray" : `bright-${en}`, `light-${en}`]
      : [es, en];
    return { index: bright * 8 + i, hex, name, aliases };
  }),
);

export const PALETTE_ROWS = [PALETTE.slice(0, 8), PALETTE.slice(8)];

/** El verde del prompt que aparece en la pantalla del portátil. */
export const DEFAULT_ACCENT = "#9cc48a";
/** Fondo aproximado de la ventana: referencia para garantizar contraste. */
const WINDOW_BG = "#04163a";
const STORAGE_KEY = "deadlock06:terminal-color";

/* ------------------------------------------------------------ contraste -- */

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Aclara el color hacia el blanco hasta que se lea bien sobre el fondo de la ventana (≥ 4.5:1). */
export function readable(hex: string): string {
  let color = hex;
  const base = channels(hex);
  for (let t = 0.1; contrast(color, WINDOW_BG) < 4.5 && t <= 1; t += 0.1) color = toHex(base.map((v) => v + (255 - v) * t));
  return color;
}

/* -------------------------------------------------------------- estado -- */

export interface TerminalTheme {
  /** Color elegido (tal cual aparece en la paleta). */
  source: string;
  /** Versión legible para texto. */
  accent: string;
  custom: boolean;
}

const theme = (source: string | null): TerminalTheme =>
  source ? { source, accent: readable(source), custom: true } : { source: DEFAULT_ACCENT, accent: DEFAULT_ACCENT, custom: false };

export const DEFAULT_THEME = theme(null);

let current: TerminalTheme = DEFAULT_THEME;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && /^#[0-9a-f]{6}$/i.test(saved)) current = theme(saved);
  } catch {
    /* sin almacenamiento: color por defecto */
  }
}

export function getTheme(): TerminalTheme {
  load();
  return current;
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setTerminalColor(hex: string | null) {
  load();
  current = theme(hex);
  try {
    if (hex) window.localStorage.setItem(STORAGE_KEY, hex);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sin persistencia */
  }
  listeners.forEach((l) => l());
}

/** "3", "verde", "rojo claro", "bright-red", "#ff8800"… → color de la paleta o hex. */
export function resolveColor(spec: string): { hex: string; name: string } | null {
  const s = spec.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(s)) return { hex: s, name: s };
  if (/^\d+$/.test(s)) {
    const c = PALETTE[Number(s)];
    return c ? { hex: c.hex, name: c.name } : null;
  }
  const c = PALETTE.find((p) => p.aliases.includes(s));
  return c ? { hex: c.hex, name: c.name } : null;
}

export const colorName = (hex: string) => PALETTE.find((p) => p.hex === hex.toLowerCase())?.name ?? (hex === DEFAULT_ACCENT ? "verde (predeterminado)" : hex);
