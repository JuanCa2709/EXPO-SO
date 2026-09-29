"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { COLORS } from "@/lib/constants";
import { RESOURCE_PHASES } from "@/lib/content";
import { ForkNode } from "./ForkNode";
import { useMotionPreference } from "./MotionProvider";
import { PhilosopherNode } from "./PhilosopherNode";

const P0 = { x: 170, y: 76 };
const P1 = { x: 430, y: 316 };
const FORK = { x: 170, y: 340 };
const FORK_HELD = { x: 170, y: 316 };
const ease = [0.22, 1, 0.36, 1] as const;

function Tag({ x, y, children, color = COLORS.ink3, anchor = "start" }: { x: number; y: number; children: React.ReactNode; color?: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className="font-mono uppercase" fontSize={11.5} letterSpacing="0.14em" fill={color}>
      {children}
    </text>
  );
}

/** FILÓSOFO ↓ SOLICITA ↓ TENEDOR — request → hold → wait. */
export function ResourceDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.45 });
  const { reduced } = useMotionPreference();
  const [phase, setPhase] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!inView || !auto || reduced) return;
    const id = window.setTimeout(() => setPhase((p) => (p + 1) % RESOURCE_PHASES.length), 2800);
    return () => window.clearTimeout(id);
  }, [inView, auto, reduced, phase]);

  const current = RESOURCE_PHASES[phase];
  const held = phase > 0;
  const fork = held ? FORK_HELD : FORK;

  return (
    <div ref={ref}>
      <svg viewBox="24 8 480 404" className="w-full" role="img" aria-label={`Diagrama: ${current.text}`}>
        <defs>
          {[
            ["rd-arrow-blue", COLORS.blue],
            ["rd-arrow-blue2", COLORS.blue2],
          ].map(([id, color]) => (
            <marker key={id} id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M1 1.5 8.5 5 1 8.5" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          ))}
        </defs>

        {/* Eje vertical: P0 → F1 */}
        <line x1={P0.x} y1={P0.y + 44} x2={P0.x} y2={FORK.y - 26} stroke={COLORS.ink2} strokeOpacity={0.1} />
        <AnimatePresence mode="wait">
          <motion.path
            key={held ? "hold" : "request"}
            d={held ? `M ${P0.x} ${fork.y - 30} V ${P0.y + 42}` : `M ${P0.x} ${P0.y + 42} V ${FORK.y - 30}`}
            stroke={held ? COLORS.blue : COLORS.blue2}
            strokeWidth={1.5}
            fill="none"
            markerEnd={held ? "url(#rd-arrow-blue)" : "url(#rd-arrow-blue2)"}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease }}
          />
        </AnimatePresence>
        <Tag x={P0.x + 18} y={(P0.y + FORK.y) / 2 + 4} color={held ? COLORS.blue2 : COLORS.ink2}>
          {held ? "↑ Retiene" : "↓ Solicita"}
        </Tag>

        {/* P1 aparece para la fase WAIT */}
        <AnimatePresence>
          {phase === 2 && (
            <motion.g key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease }}>
              <motion.path
                d={`M ${P1.x - 42} ${P1.y} H ${fork.x + 32}`}
                stroke={COLORS.blue2}
                strokeWidth={1.4}
                strokeDasharray="4 5"
                fill="none"
                markerEnd="url(#rd-arrow-blue2)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              />
              <Tag x={(P1.x + fork.x) / 2 + 4} y={P1.y - 14} anchor="middle" color={COLORS.blue2}>
                Espera
              </Tag>
              <PhilosopherNode id={1} x={P1.x} y={P1.y} r={32} state="waiting" />
              <Tag x={P1.x} y={P1.y + 62} anchor="middle">
                Filósofo · P1
              </Tag>
              <Tag x={fork.x} y={FORK.y + 62} anchor="middle" color={COLORS.red}>
                Ocupado
              </Tag>
            </motion.g>
          )}
        </AnimatePresence>

        <PhilosopherNode id={0} x={P0.x} y={P0.y} r={32} state={held ? "holding" : "hungry"} held={held ? 1 : 0} />
        <Tag x={P0.x + 50} y={P0.y - 4}>
          Filósofo · P0
        </Tag>
        <Tag x={P0.x + 50} y={P0.y + 14} color={COLORS.ink2}>
          {held ? "retiene 1 recurso" : "necesita un recurso"}
        </Tag>

        <ForkNode id={1} x={fork.x} y={fork.y} size={46} state={phase === 2 ? "requested" : held ? "held" : "available"} emphasis={!held} />
        <Tag x={fork.x - 44} y={fork.y + 4} anchor="end">
          Tenedor · F1
        </Tag>
      </svg>

      <div className="mt-6 grid grid-cols-3 gap-px" role="group" aria-label="Fases de uso de un recurso">
        {RESOURCE_PHASES.map((p, i) => {
          const active = i === phase;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setAuto(false);
                setPhase(i);
              }}
              className="group relative pt-4 text-left"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink-3/25" />
              <motion.span
                aria-hidden
                className="absolute left-0 top-0 h-px bg-blue-2"
                initial={false}
                animate={{ width: active ? "100%" : "0%" }}
                transition={{ duration: active && auto && !reduced ? 2.8 : 0.3, ease: "linear" }}
              />
              <span className={`label block transition-colors ${active ? "text-blue-2" : "text-ink-3 group-hover:text-ink-2"}`}>
                0{i + 1} {p.code}
              </span>
              <span className={`mt-2 block text-[15px] transition-colors ${active ? "text-ink" : "text-ink-3 group-hover:text-ink-2"}`}>{p.title}</span>
            </button>
          );
        })}
      </div>
      <p className="body mt-5 min-h-[3.3em] text-[15px]" aria-live="polite">
        {current.text}
      </p>
    </div>
  );
}
