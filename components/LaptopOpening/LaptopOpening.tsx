import { FRAME_WIDTHS, frameUrlTemplates } from "@/lib/laptopFrames";
import { LaptopScene } from "./LaptopScene";

/**
 * Secuencia del portátil controlada por scroll. Los frames se leen de la carpeta
 * "laptop opening" del proyecto en build: su número no está fijado en el código.
 */
export function LaptopOpening() {
  const templates = frameUrlTemplates();
  if (!templates.length) return null;
  return <LaptopScene templates={templates} widths={FRAME_WIDTHS} />;
}
