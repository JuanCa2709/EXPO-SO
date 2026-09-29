"use client";

import { motion } from "framer-motion";
import { COLORS } from "@/lib/constants";
import { CONDITIONS } from "@/lib/content";
import { r2 } from "@/lib/geometry";

const C = 300;
const R = 204;
const NODE_R = 30;
const ANGLES = [-90, 0, 90, 180];
const ease = [0.22, 1, 0.36, 1] as const;

const at = (deg: number, r = R) => ({
  x: r2(C + r * Math.cos((deg * Math.PI) / 180)),
  y: r2(C + r * Math.sin((deg * Math.PI) / 180)),
});

function arc(from: number, to: number) {
  const gap = 12;
  const a = at(ANGLES[from] + gap);
  const b = at(ANGLES[to] + (to === 0 ? 360 : 0) - gap);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${R} ${R} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** Posición HTML (en %) de cada rótulo: arriba, derecha, abajo, izquierda — siempre fuera del anillo. */
const LABELS = [
  { left: "50%", top: `${((C - R - NODE_R - 16) / 600) * 100}%`, translate: "-50% -100%", align: "center" },
  { left: `${((C + R + NODE_R + 18) / 600) * 100}%`, top: "50%", translate: "0 -50%", align: "left" },
  { left: "50%", top: `${((C + R + NODE_R + 16) / 600) * 100}%`, translate: "-50% 0", align: "center" },
  { left: `${((C - R - NODE_R - 18) / 600) * 100}%`, top: "50%", translate: "-100% -50%", align: "right" },
] as const;

interface ConditionsDiagramProps {
  /** Condiciones visibles (0–4). */
  count: number;
  /** El ciclo se cierra tras la cuarta. */
  closed: boolean;
}

export function ConditionsDiagram({ count, closed }: ConditionsDiagramProps) {
  const tone = closed ? COLORS.red : COLORS.blue2;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx={C} cy={C} r={R} fill="none" stroke={COLORS.ink2} strokeOpacity={0.08} strokeDasharray="2 7" />
        <circle cx={C} cy={C} r={92} fill="none" stroke={COLORS.ink2} strokeOpacity={0.06} />

        {[0, 1, 2, 3].map((i) => {
          const visible = i < 3 ? count > i + 1 : closed;
          return (
            <motion.path
              key={i}
              d={arc(i, (i + 1) % 4)}
              fill="none"
              strokeWidth={1.5}
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: visible ? 1 : 0, opacity: visible ? 1 : 0, stroke: tone }}
              transition={{ duration: 0.8, ease }}
            />
          );
        })}

        {ANGLES.map((deg, i) => {
          const p = at(deg);
          const active = i < count;
          return (
            <g key={deg} transform={`translate(${p.x} ${p.y})`}>
              <motion.circle
                r={NODE_R}
                strokeWidth={1.25}
                initial={false}
                animate={{
                  fill: active ? (closed ? "rgba(255,90,95,0.12)" : "rgba(59,130,246,0.12)") : COLORS.bg1,
                  stroke: active ? tone : "#2B3441",
                  scale: active ? 1 : 0.86,
                }}
                transition={{ duration: 0.6, ease }}
              />
              <motion.text
                y={4.5}
                textAnchor="middle"
                className="font-mono"
                fontSize={13}
                letterSpacing="0.08em"
                initial={false}
                animate={{ fill: active ? (closed ? COLORS.red : COLORS.ink) : COLORS.ink3 }}
                transition={{ duration: 0.6 }}
              >
                {CONDITIONS[i].index}
              </motion.text>
            </g>
          );
        })}

        <g textAnchor="middle" className="font-mono">
          <motion.text
            x={C}
            y={C + 5}
            fontSize={16}
            letterSpacing="0.28em"
            initial={false}
            animate={{ fill: closed ? COLORS.red : count > 0 ? COLORS.ink : COLORS.ink3 }}
            transition={{ duration: 0.6 }}
          >
            DEADLOCK
          </motion.text>
          <motion.text
            x={C}
            y={C + 32}
            fontSize={10.5}
            letterSpacing="0.22em"
            fill={COLORS.red}
            initial={false}
            animate={{ opacity: closed ? 1 : 0 }}
            transition={{ duration: 0.6, delay: closed ? 0.5 : 0 }}
          >
            CYCLE DETECTED
          </motion.text>
          <motion.text x={C} y={C - 26} fontSize={10.5} letterSpacing="0.22em" fill={COLORS.ink3} initial={false} animate={{ opacity: closed ? 0 : 1 }}>
            {count}/4
          </motion.text>
        </g>
      </svg>

      {CONDITIONS.map((c, i) => (
        <motion.p
          key={c.index}
          aria-hidden
          className={`absolute hidden text-[14px] font-medium tracking-[-0.01em] sm:block ${
            i % 2 === 1 ? "whitespace-nowrap lg:max-xl:w-[6.5rem] lg:max-xl:whitespace-normal" : "whitespace-nowrap"
          }`}
          style={{ left: LABELS[i].left, top: LABELS[i].top, translate: LABELS[i].translate, textAlign: LABELS[i].align }}
          initial={false}
          animate={{ opacity: i < count ? 1 : 0.28, color: i < count ? (closed ? COLORS.red : COLORS.ink) : COLORS.ink3 }}
          transition={{ duration: 0.6, ease }}
        >
          {c.title}
        </motion.p>
      ))}
    </div>
  );
}
