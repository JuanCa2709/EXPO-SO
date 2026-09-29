/**
 * Localiza la secuencia "laptop opening" dentro del proyecto y lista sus frames.
 * Solo servidor: se ejecuta en build (y en dev) leyendo el disco del proyecto.
 * Los originales no se tocan: el sitio sirve versiones WebP generadas a partir de ellos.
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".next", ".git", "scripts", "app", "components", "lib"]);
const IMAGE = /\.(png|jpe?g|webp)$/i;
/** "laptop opening", "Laptop_opening_with_…_frames 2", "laptop-opening"… */
const NAME = /laptop[\s_-]*opening/i;

/** Anchos servidos: el cliente elige según pantalla, memoria y red. Nunca se amplía el original. */
export const FRAME_WIDTHS = [640, 960, 1280] as const;
export const FRAME_ROUTE = "/sequences/laptop-opening";

function search(dir: string, depth: number): string[] {
  if (depth < 0) return [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const name of entries) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (NAME.test(name)) found.push(full);
    else found.push(...search(full, depth - 1));
  }
  return found;
}

let cached: { dir: string; files: string[] } | null = null;

export function laptopFrames(): { dir: string; files: string[] } {
  if (cached) return cached;
  // Preferencia: el nombre exacto "laptop opening"; si no existe, la carpeta equivalente con más imágenes.
  const candidates = search(ROOT, 4)
    .map((dir) => ({ dir, files: readdirSync(dir).filter((f) => IMAGE.test(f)) }))
    .filter((c) => c.files.length > 0)
    .sort(
      (a, b) =>
        Number(path.basename(b.dir).toLowerCase() === "laptop opening") - Number(path.basename(a.dir).toLowerCase() === "laptop opening") ||
        b.files.length - a.files.length,
    );

  const best = candidates[0];
  cached = best
    ? { dir: best.dir, files: best.files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })) }
    : { dir: "", files: [] };
  return cached;
}

/** frame_001.png → frame_001.webp (el nombre base se conserva). */
export const servedName = (file: string) => `${file.replace(IMAGE, "")}.webp`;

/** Plantilla de URLs: el cliente sustituye {w} por el ancho elegido. */
export function frameUrlTemplates(): string[] {
  return laptopFrames().files.map((f) => `${FRAME_ROUTE}/{w}/${encodeURIComponent(servedName(f))}`);
}
