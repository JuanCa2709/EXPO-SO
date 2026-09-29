"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import type { FrameSequence, SequenceProgress } from "./frameCache";

const SERVER: SequenceProgress = { downloaded: 0, total: 0 };

/**
 * Indicador discreto de descarga. Se suscribe por su cuenta a la secuencia:
 * cada frame descargado actualiza solo este texto, no la escena ni la terminal.
 */
export function SequenceLoading({ sequence }: { sequence: FrameSequence }) {
  const { downloaded, total } = useSyncExternalStore(sequence.subscribe, sequence.getProgress, () => SERVER);
  const done = total > 0 && downloaded >= total;
  const percent = total ? Math.round((downloaded / total) * 100) : 0;

  return (
    <AnimatePresence>
      {!done && (
        <motion.p
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4, duration: 0.5 } }}
          className="label pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-ink-3"
          aria-live="polite"
        >
          Loading sequence… <span className="tabular-nums text-ink-2">{percent}%</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
