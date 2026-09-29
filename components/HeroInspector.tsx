"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { PHILOSOPHER_COUNT } from "@/lib/constants";

const N = PHILOSOPHER_COUNT;

interface HeroInspectorProps {
  selected: number | null;
  onClose: () => void;
  /** Contenido cuando no hay nadie seleccionado. */
  fallback?: React.ReactNode;
  className?: string;
}

/** Ficha técnica del comensal seleccionado en el hero. */
export function HeroInspector({ selected, onClose, fallback = null, className = "" }: HeroInspectorProps) {
  return (
    <div className={className} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {selected === null ? (
          <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {fallback}
          </motion.div>
        ) : (
          <motion.div
            key={`p${selected}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="perf-glass hairline w-full max-w-[22rem] bg-bg/85 p-4 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-6">
              <p className="label text-blue-2">Proceso P{selected}</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ficha del proceso"
                className="-m-1 grid h-6 w-6 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink"
              >
                <X size={13} aria-hidden />
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-[5.5rem_1fr] gap-y-1.5 font-mono text-[12px]">
              <dt className="text-ink-3">ESTADO</dt>
              <dd className="text-ink">thinking</dd>
              <dt className="text-ink-3">NECESITA</dt>
              <dd className="text-blue-2">
                F{selected} <span className="text-ink-3">izq</span> + F{(selected + 1) % N} <span className="text-ink-3">der</span>
              </dd>
              <dt className="text-ink-3">COMPITE</dt>
              <dd className="text-ink-2">
                P{(selected + N - 1) % N} · P{(selected + 1) % N}
              </dd>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
