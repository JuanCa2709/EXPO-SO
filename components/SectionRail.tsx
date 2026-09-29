"use client";

import { motion } from "framer-motion";
import { SECTIONS } from "@/lib/constants";
import { useActiveSection } from "@/lib/useActiveSection";

/** Índice numérico fijo: 04 / 12. Solo en pantallas anchas. */
export function SectionRail() {
  const active = useActiveSection();
  const index = Math.max(0, SECTIONS.findIndex((s) => s.id === active));
  const current = SECTIONS[index];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 font-mono text-[11px] tracking-[0.12em] xl:flex"
    >
      <motion.span key={current.index} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-ink tabular-nums">
        {current.index}
      </motion.span>
      <span className="relative h-14 w-px bg-ink-3/25">
        <motion.span
          className="absolute inset-x-0 top-0 origin-top bg-blue-2"
          style={{ height: "100%" }}
          animate={{ scaleY: (index + 1) / SECTIONS.length }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <span className="text-ink-3 tabular-nums">{String(SECTIONS.length).padStart(2, "0")}</span>
    </div>
  );
}
