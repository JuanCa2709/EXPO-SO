import path from "node:path";
import sharp from "sharp";
import { FRAME_WIDTHS, laptopFrames, servedName } from "@/lib/laptopFrames";

/** Solo los frames y anchos existentes: cualquier otra combinación responde 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  const files = laptopFrames().files;
  return FRAME_WIDTHS.flatMap((width) => files.map((file) => ({ width: String(width), frame: servedName(file) })));
}

/**
 * Convierte el frame original a WebP al ancho pedido. En build se genera una vez por combinación
 * (salida estática); el PNG original queda intacto en su carpeta.
 * 48,5 MB de PNG → ~1,7 MB en WebP a 1280 px, sin diferencia visible.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ width: string; frame: string }> }) {
  const { width, frame } = await params;
  const w = Number(width);
  const { dir, files } = laptopFrames();
  const source = files.find((f) => servedName(f) === frame);
  if (!source || !FRAME_WIDTHS.includes(w as (typeof FRAME_WIDTHS)[number])) return new Response("Not found", { status: 404 });

  const data = await sharp(path.join(dir, source))
    .resize({ width: w, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5, smartSubsample: true })
    .toBuffer();

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
