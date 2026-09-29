"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { COLORS } from "@/lib/constants";
import { r2 } from "@/lib/geometry";
import { useMotionPreference } from "./MotionProvider";

const C = 200;
const R = 132;
const angle = (i: number) => -90 + i * 72;
const at = (deg: number, r = R) => ({ x: r2(C + r * Math.cos((deg * Math.PI) / 180)), y: r2(C + r * Math.sin((deg * Math.PI) / 180)) });

function arc(i: number) {
  const a = at(angle(i) + 11);
  const b = at(angle(i + 1) - 11);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${R} ${R} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** El ciclo se cierra en rojo… y una sola arista rota basta para que vuelva a fluir. */
export function CycleBreak() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: true });
  const { reduced } = useMotionPreference();
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setBroken(true);
      return;
    }
    const id = window.setTimeout(() => setBroken(true), 2600);
    return () => window.clearTimeout(id);
  }, [inView, reduced]);

  const tone = broken ? COLORS.blue2 : COLORS.red;

  return (
    <div ref={ref} className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
      <div className="order-2 md:order-1">
        <p className="label" style={{ color: tone }} aria-live="polite">
          {broken ? "Ciclo roto" : "Ciclo cerrado"}
        </p>
        <p className="mt-4 max-w-[26rem] text-[22px] leading-snug tracking-[-0.02em] text-ink md:text-[26px]">
          {broken ? "Basta con que un proceso cambie el orden. La cadena ya no vuelve a su origen." : "P0 → P1 → P2 → P3 → P4 → P0"}
        </p>
        <button
          type="button"
          onClick={() => setBroken((b) => !b)}
          className="link-arrow mt-6"
          aria-pressed={broken}
        >
          {broken ? "Volver a cerrar el ciclo" : "Romper el ciclo"}
        </button>
      </div>

      <svg viewBox="0 0 400 400" className="order-1 mx-auto w-full max-w-[340px] md:order-2" aria-label={broken ? "Ciclo de espera roto entre P4 y P0" : "Ciclo de espera cerrado entre cinco procesos"} role="img">
        {[0, 1, 2, 3, 4].map((i) => {
          const cut = i === 4 && broken;
          return (
            <motion.path
              key={i}
              d={arc(i)}
              fill="none"
              strokeWidth={1.6}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: cut ? 0.12 : 1, opacity: cut ? 0.25 : 1, stroke: tone } : {}}
              transition={{ duration: 0.8, delay: broken ? 0 : 0.2 + i * 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const p = at(angle(i));
          return (
            <g key={i} transform={`translate(${p.x} ${p.y})`}>
              <motion.circle r={20} fill={COLORS.bg1} strokeWidth={1.2} initial={false} animate={{ stroke: tone }} transition={{ duration: 0.6 }} />
              <text y={4} textAnchor="middle" className="font-mono" fontSize={12} fill={COLORS.ink}>
                P{i}
              </text>
            </g>
          );
        })}
        <motion.g initial={false} animate={{ opacity: broken ? 1 : 0 }} transition={{ duration: 0.5, delay: broken ? 0.4 : 0 }}>
          <text x={at(-126, R + 42).x} y={at(-126, R + 42).y} textAnchor="middle" className="font-mono" fontSize={11} letterSpacing="0.14em" fill={COLORS.blue2}>
            ORDEN
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
