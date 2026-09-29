"use client";

import { STATE_META } from "@/lib/constants";
import type { ForkVisualState, PhilosopherState } from "@/lib/types";
import { ForkNode } from "./ForkNode";
import { PhilosopherNode } from "./PhilosopherNode";

const PHILOSOPHER_STATES: PhilosopherState[] = ["thinking", "hungry", "holding", "waiting", "eating", "blocked"];
const FORK_STATES: { state: ForkVisualState; text: string }[] = [
  { state: "available", text: "Libre" },
  { state: "held", text: "Asignado" },
  { state: "requested", text: "Asignado y solicitado" },
  { state: "blocked", text: "Atrapado en el ciclo" },
];

const HELD: Record<PhilosopherState, number> = { thinking: 0, hungry: 0, holding: 1, waiting: 1, eating: 2, blocked: 1 };

/** Vocabulario visual del sistema: los mismos componentes que usa la simulación. */
export function StateLegend() {
  return (
    <div className="grid gap-10 sm:grid-cols-[1.35fr_1fr]">
      <div>
        <p className="label text-ink-3">Estados del proceso</p>
        <ul className="mt-4">
          {PHILOSOPHER_STATES.map((state) => (
            <li key={state} className="hairline-t flex items-center gap-4 py-2.5">
              <svg viewBox="-24 -24 48 48" className="h-9 w-9 shrink-0" aria-hidden>
                <PhilosopherNode id={0} x={0} y={0} r={17} state={state} held={HELD[state]} />
              </svg>
              <span className="label w-[5.5rem] shrink-0 text-ink">{STATE_META[state].label}</span>
              <span className="text-[13px] leading-snug text-ink-3">{STATE_META[state].description}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="label text-ink-3">Estados del recurso</p>
        <ul className="mt-4">
          {FORK_STATES.map(({ state, text }) => (
            <li key={state} className="hairline-t flex items-center gap-4 py-2.5">
              <svg viewBox="-24 -24 48 48" className="h-9 w-9 shrink-0" aria-hidden>
                <ForkNode id={0} x={0} y={0} size={30} state={state} />
              </svg>
              <span className="flex flex-col">
                <span className="label text-ink">{state}</span>
                <span className="text-[13px] text-ink-3">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
