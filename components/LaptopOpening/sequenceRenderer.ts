/**
 * Pinta la secuencia en un <canvas>: encaje sin deformar, fundido entre frames vecinos
 * y bordes fundidos con el fondo del sitio.
 */

export type Frame = ImageBitmap | HTMLImageElement;

export const frameSize = (f: Frame) =>
  f instanceof HTMLImageElement ? { w: f.naturalWidth, h: f.naturalHeight } : { w: f.width, h: f.height };

/** Fondo del sitio (#05070B). */
const BG_RGB = "5, 7, 11";
const BG = `rgb(${BG_RGB})`;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** contain en pantallas anchas; en verticales se recorta un poco por los lados (misma escala en X e Y). */
function fit(cw: number, ch: number, iw: number, ih: number): Rect {
  const scale = ch > cw ? Math.min(ch / ih, (cw * 1.5) / iw, (ch * 0.62) / ih) : Math.min(cw / iw, ch / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

export class SequenceRenderer {
  private readonly ctx: CanvasRenderingContext2D | null;
  private source: { w: number; h: number } | null = null;
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private edges: { g: CanvasGradient; r: Rect }[] = [];
  private lastKey = "";
  private readonly ids = new WeakMap<Frame, number>();
  private nextId = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    // Canvas opaco: el navegador no tiene que mezclarlo con lo que hay debajo.
    this.ctx = canvas.getContext("2d", { alpha: false });
  }

  /** @returns true si cambió el tamaño de los frames (hay que recolocar lo que depende de él). */
  setSource(size: { w: number; h: number }): boolean {
    if (this.source?.w === size.w && this.source.h === size.h) return false;
    this.source = size;
    this.layout();
    return true;
  }

  /**
   * Resolución interna: nunca más píxeles de los que aporta el frame ni más que el DPR.
   * En un 1440×900 retina pasa de 2880×1800 a 1440×900 (4× menos trabajo por frame).
   */
  layout() {
    const { canvas, ctx } = this;
    if (!ctx) return;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const drawnCss = this.source ? fit(cssW, cssH, this.source.w, this.source.h) : null;
    const ratio = drawnCss && this.source ? Math.max(1, Math.min(dpr, this.source.w / drawnCss.w)) : Math.min(dpr, 1.5);
    const w = Math.round(cssW * ratio);
    const h = Math.round(cssH * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    this.rect = this.source ? fit(w, h, this.source.w, this.source.h) : { x: 0, y: 0, w, h };
    this.edges = this.buildEdges(w, h);
    this.lastKey = "";
  }

  /** Degradados de los cuatro bordes, creados una vez por tamaño (no en cada frame). */
  private buildEdges(cw: number, ch: number) {
    const ctx = this.ctx;
    if (!ctx) return [];
    const { x, y, w, h } = this.rect;
    const fade = Math.min(Math.min(w, cw), h) * 0.12;
    const vx = Math.max(0, x);
    const vw = Math.min(cw, w);
    const make = (x0: number, y0: number, x1: number, y1: number, r: Rect) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, `rgba(${BG_RGB}, 1)`);
      g.addColorStop(1, `rgba(${BG_RGB}, 0)`);
      return { g, r };
    };
    return [
      make(0, y, 0, y + fade, { x: vx, y, w: vw, h: fade }),
      make(0, y + h, 0, y + h - fade, { x: vx, y: y + h - fade, w: vw, h: fade }),
      make(vx, 0, vx + fade, 0, { x: vx, y, w: fade, h }),
      make(vx + vw, 0, vx + vw - fade, 0, { x: vx + vw - fade, y, w: fade, h }),
    ];
  }

  /**
   * Convierte un rectángulo expresado en fracciones del frame (0…1) a píxeles CSS del canvas.
   * Sirve para colocar elementos del DOM exactamente sobre algo que aparece en la imagen.
   */
  cssRectOf(fraction: Rect): Rect | null {
    if (!this.source || !this.rect.w || !this.canvas.clientWidth) return null;
    const k = this.canvas.clientWidth / this.canvas.width;
    const { x, y, w, h } = this.rect;
    return { x: (x + fraction.x * w) * k, y: (y + fraction.y * h) * k, w: fraction.w * w * k, h: fraction.h * h * k };
  }

  invalidate() {
    this.lastKey = "";
  }

  /**
   * @param position índice fraccionario del frame (0 … último)
   * @param softness 0 … 1: anchura del fundido entre frames vecinos. Con 0 se muestra el frame
   *   más cercano, nítido; con 1 se funden durante todo el tramo (desplazamiento rápido).
   */
  render(position: number, softness: number, frameAt: (i: number) => Frame | null, last: number) {
    const ctx = this.ctx;
    if (!ctx || !this.source) return;
    const index = Math.min(last, Math.max(0, Math.floor(position)));
    const frac = position - index;
    const half = 0.5 * Math.min(1, Math.max(0, softness));
    const mix = index >= last ? 0 : half < 0.01 ? (frac >= 0.5 ? 1 : 0) : smoothstep(0.5 - half, 0.5 + half, frac);
    const key = `${index}|${mix.toFixed(3)}`;

    const a = frameAt(index);
    if (!a) return;
    const b = mix > 0 ? frameAt(index + 1) : null;
    // Si el vecino aún no está decodificado, frameAt devuelve un sustituto: no se funde con él.
    const blend = b && b !== a ? mix : 0;
    const drawnKey = `${key}|${blend > 0 ? 1 : 0}|${this.identity(a)}|${blend > 0 && b ? this.identity(b) : ""}`;
    if (drawnKey === this.lastKey) return;
    const { x, y, w, h } = this.rect;
    const { width: cw, height: ch } = this.canvas;

    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(a, x, y, w, h);

    if (blend > 0 && b) {
      ctx.globalAlpha = blend;
      ctx.drawImage(b, x, y, w, h);
    }

    ctx.globalAlpha = 1;
    for (const { g, r } of this.edges) {
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    this.lastKey = drawnKey;
  }

  /** Identificador estable de cada frame decodificado (para no repintar lo mismo). */
  private identity(frame: Frame) {
    let id = this.ids.get(frame);
    if (!id) {
      id = this.nextId++;
      this.ids.set(frame, id);
    }
    return id;
  }
}
