import path from "node:path";
import sharp from "sharp";
import { laptopFrames } from "@/lib/laptopFrames";
import { WINDOW_IN_FRAME } from "@/lib/laptopWindow";

export const dynamic = "force-static";

const COLS = 40;
const ROWS = 24;
/** Por celda se promedia el 40 % de píxeles más oscuro: el fondo, sin las letras (más claras). */
const KEEP = 0.4;

/**
 * Fondo de la ventana de la terminal tal como aparece en el último frame, sin el texto:
 * un mosaico diminuto (40×24) que el navegador amplía con suavizado. Conserva el degradado
 * y la onda del fondo de pantalla que se ven a través de la ventana.
 */
export async function GET() {
  const { dir, files } = laptopFrames();
  if (!files.length) return new Response("Not found", { status: 404 });

  const image = sharp(path.join(dir, files[files.length - 1]));
  const { width = 1280, height = 720 } = await image.metadata();
  const region = {
    left: Math.round(WINDOW_IN_FRAME.x * width),
    top: Math.round(WINDOW_IN_FRAME.y * height),
    width: Math.round(WINDOW_IN_FRAME.w * width),
    height: Math.round(WINDOW_IN_FRAME.h * height),
  };
  const { data, info } = await image.extract(region).removeAlpha().raw().toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(COLS * ROWS * 3);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x0 = Math.floor((c * info.width) / COLS);
      const x1 = Math.floor(((c + 1) * info.width) / COLS);
      const y0 = Math.floor((r * info.height) / ROWS);
      const y1 = Math.floor(((r + 1) * info.height) / ROWS);
      const pixels: [number, number, number, number][] = [];
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * info.width + x) * 3;
          const [R, G, B] = [data[i], data[i + 1], data[i + 2]];
          pixels.push([0.2126 * R + 0.7152 * G + 0.0722 * B, R, G, B]);
        }
      }
      pixels.sort((a, b) => a[0] - b[0]);
      const keep = pixels.slice(0, Math.max(1, Math.floor(pixels.length * KEEP)));
      const o = (r * COLS + c) * 3;
      for (let k = 0; k < 3; k++) out[o + k] = Math.round(keep.reduce((sum, p) => sum + p[k + 1], 0) / keep.length);
    }
  }

  // Celdas cubiertas por completo por algo sólido (los bloques de color de neofetch) destacan
  // sobre sus vecinas: se sustituyen por la mediana de las vecinas.
  const lum = (i: number) => 0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2];
  const cleaned = Buffer.from(out);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const neighbours: number[] = [];
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if ((dr || dc) && rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) neighbours.push((rr * COLS + cc) * 3);
        }
      neighbours.sort((a, b) => lum(a) - lum(b));
      const median = neighbours[neighbours.length >> 1];
      const o = (r * COLS + c) * 3;
      if (lum(o) > lum(median) + 12) for (let k = 0; k < 3; k++) cleaned[o + k] = out[median + k];
    }
  }

  const png = await sharp(cleaned, { raw: { width: COLS, height: ROWS, channels: 3 } }).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
