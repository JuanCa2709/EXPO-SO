/**
 * Descarga de la secuencia, de lo grueso a lo fino: primero un frame de cada 16, luego de cada 8,
 * 4, 2 y 1. Con una red lenta, la animación completa se puede recorrer desde el principio
 * (con menos frames) y va ganando fluidez a medida que llegan los demás.
 * Solo descarga los archivos comprimidos: la decodificación la gestiona el caché de frames.
 */

/** Orden de descarga: extremos primero y después subdivisiones sucesivas. */
export function downloadOrder(count: number): number[] {
  if (count <= 0) return [];
  const order: number[] = [0];
  const seen = new Set(order);
  const push = (i: number) => {
    if (i >= 0 && i < count && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(count - 1);
  for (let stride = 16; stride >= 1; stride /= 2) for (let i = 0; i < count; i += stride) push(i);
  return order;
}

interface DownloadOptions {
  concurrency: number;
  signal: AbortSignal;
  onFrame: (index: number, blob: Blob) => void;
}

export async function preloadFrames(urls: string[], { concurrency, signal, onFrame }: DownloadOptions): Promise<void> {
  const queue = downloadOrder(urls.length);
  const worker = async () => {
    while (queue.length && !signal.aborted) {
      const index = queue.shift() as number;
      for (let attempt = 0; attempt < 3 && !signal.aborted; attempt++) {
        try {
          const response = await fetch(urls[index], { signal, priority: index === 0 ? "high" : "low" } as RequestInit);
          if (!response.ok) throw new Error(String(response.status));
          onFrame(index, await response.blob());
          break;
        } catch {
          if (signal.aborted) return;
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}
