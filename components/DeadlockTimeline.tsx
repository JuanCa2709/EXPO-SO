"use client";

import { motion } from "framer-motion";

export const CONFLICT_PHASES = [
  { code: "REQUEST", text: "Solicitan" },
  { code: "HOLD", text: "Retienen" },
  { code: "WAIT", text: "Esperan" },
  { code: "CYCLE", text: "Se cierra" },
  { code: "DEADLOCK", text: "Bloqueo" },
] as const;

/** Rail de fases: REQUEST → HOLD → WAIT → CYCLE → DEADLOCK. */
export function DeadlockTimeline({ phase }: { phase: number }) {
  return (
    <ol className="grid grid-cols-5 gap-2 sm:gap-4" aria-label="Fases del conflicto">
      {CONFLICT_PHASES.map((p, i) => {
        const alarm = i >= 3;
        const done = i < phase;
        const active = i === phase;
        const color = active ? (alarm ? "var(--color-red)" : "var(--color-blue-2)") : done ? "var(--color-ink-2)" : "var(--color-ink-3)";
        return (
          <li key={p.code} aria-current={active ? "step" : undefined} className="relative pt-4">
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink-3/20" />
            <motion.span
              aria-hidden
              className="absolute left-0 top-0 h-px"
              initial={false}
              animate={{ width: done || active ? "100%" : "0%", backgroundColor: active && alarm ? "#FF5A5F" : done ? "#A5AFBC" : "#60A5FA" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
            <span className="block font-mono text-[10px] tracking-[0.14em] text-ink-3 sm:text-[11px]">0{i + 1}</span>
            <span className="mt-1.5 block font-mono text-[9px] tracking-[0.02em] transition-colors duration-300 sm:text-[12px] sm:tracking-[0.16em]" style={{ color }}>
              {p.code}
            </span>
            <span className="mt-1 hidden text-[13px] text-ink-3 sm:block">{p.text}</span>
          </li>
        );
      })}
    </ol>
  );
}
