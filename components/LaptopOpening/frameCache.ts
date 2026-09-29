/**
 * Caché de la secuencia con memoria acotada.
 *
 * Un frame decodificado de 1280×720 ocupa ~3,7 MB: los 100 juntos (~370 MB) bastan para que un
 * móvil cierre la pestaña. Aquí solo se guardan todos los archivos comprimidos (~1,7 MB en total)
 * y se decodifica una ventana de frames alrededor de la posición actual, priorizando la dirección
 * del scroll y respetando un presupuesto de memoria según el dispositivo.
 */
import { preloadFrames } from "./preloadFrames";
import { type Frame, frameSize } from "./sequenceRenderer";

export interface SequenceProgress {
  downloaded: number;
  total: number;
}

interface FrameSequenceOptions {
  urls: string[];
  /** Memoria máxima para frames decodificados. */
  budgetBytes: number;
  concurrency: number;
  decodeConcurrency: number;
  /** Un frame nuevo está listo para pintarse. */
  onFrameReady: () => void;
}

async function decodeBlob(blob: Blob): Promise<Frame> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob);
    } catch {
      /* se intenta con <img> */
    }
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const release = (frame: Frame) => {
  if ("close" in frame) frame.close();
};

export class FrameSequence {
  private readonly blobs: (Blob | null)[];
  private readonly decoded = new Map<number, Frame>();
  private readonly decoding = new Set<number>();
  private readonly abort = new AbortController();
  private readonly listeners = new Set<() => void>();
  private progress: SequenceProgress;
  private maxDecoded = 12;
  private focusAt = 0;
  private direction = 1;
  private started = false;
  private disposed = false;

  constructor(private readonly opts: FrameSequenceOptions) {
    this.blobs = opts.urls.map(() => null);
    this.progress = { downloaded: 0, total: opts.urls.length };
  }

  get count() {
    return this.opts.urls.length;
  }

  start() {
    if (this.started || this.disposed) return;
    this.started = true;
    void preloadFrames(this.opts.urls, {
      concurrency: this.opts.concurrency,
      signal: this.abort.signal,
      onFrame: (index, blob) => {
        if (this.disposed) return;
        this.blobs[index] = blob;
        this.progress = { downloaded: this.progress.downloaded + 1, total: this.progress.total };
        this.listeners.forEach((l) => l());
        this.pump();
      },
    });
  }

  /** Posición actual (fraccionaria) y sentido del scroll: decide qué decodificar a continuación. */
  focus(position: number, direction: number) {
    const moved = Math.abs(position - this.focusAt) >= 0.5;
    this.focusAt = position;
    if (direction) this.direction = Math.sign(direction);
    if (moved) this.pump();
  }

  /** El frame pedido o el decodificado más cercano: nunca un hueco. */
  frameAt = (index: number): Frame | null => {
    const exact = this.decoded.get(index);
    if (exact) return exact;
    for (let d = 1; d < this.count; d++) {
      const frame = this.decoded.get(index - d) ?? this.decoded.get(index + d);
      if (frame) return frame;
    }
    return null;
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getProgress = () => this.progress;

  dispose() {
    this.disposed = true;
    this.abort.abort();
    this.decoded.forEach(release);
    this.decoded.clear();
    this.listeners.clear();
  }

  /** Coste de un frame: los que van en la dirección del scroll cuestan menos (se anticipan). */
  private score(i: number) {
    const d = i - this.focusAt;
    const ahead = Math.sign(d) === this.direction;
    return Math.abs(d) * (ahead ? 0.6 : 1);
  }

  private pump() {
    if (this.disposed) return;
    const available: number[] = [];
    this.blobs.forEach((b, i) => b && available.push(i));
    available.sort((a, b) => this.score(a) - this.score(b));
    const target = new Set(available.slice(0, this.maxDecoded));

    // Libera lo que quedó lejos cuando se supera el presupuesto.
    if (this.decoded.size + this.decoding.size > this.maxDecoded) {
      for (const [i, frame] of this.decoded) {
        if (!target.has(i) && this.decoded.size > 1) {
          release(frame);
          this.decoded.delete(i);
        }
      }
    }

    for (const i of available) {
      if (this.decoding.size >= this.opts.decodeConcurrency) break;
      if (!target.has(i)) break;
      if (!this.decoded.has(i) && !this.decoding.has(i)) void this.decode(i);
    }
  }

  private async decode(i: number) {
    const blob = this.blobs[i];
    if (!blob) return;
    this.decoding.add(i);
    try {
      const frame = await decodeBlob(blob);
      if (this.disposed) return release(frame);
      if (this.decoded.size === 0) {
        // Con el primer frame se conoce su tamaño real: se fija cuántos caben en el presupuesto.
        const { w, h } = frameSize(frame);
        this.maxDecoded = Math.max(8, Math.min(this.count, Math.floor(this.opts.budgetBytes / (w * h * 4))));
      }
      this.decoded.set(i, frame);
      this.opts.onFrameReady();
    } catch {
      /* frame ilegible: se usará el vecino más cercano */
    } finally {
      this.decoding.delete(i);
      this.pump();
    }
  }
}
