"use client";

import { useRef, useState } from "react";
import { STATE_META } from "@/lib/constants";
import { heldForks } from "@/lib/simulation";
import type { EventKind, Philosopher, SimulationState } from "@/lib/types";
import { PHILOSOPHER_TOKENS, PhilosopherNode } from "./PhilosopherNode";
import { ResourceGraph, graphFromState } from "./ResourceGraph";

const TABS = [
  { id: "estado", label: "Estado" },
  { id: "eventos", label: "Eventos" },
  { id: "grafo", label: "Grafo" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const EVENT_COLOR: Record<EventKind, string> = {
  info: "text-ink-2",
  acquire: "text-ink",
  wait: "text-blue-2",
  release: "text-ink-3",
  alert: "text-red",
  ok: "text-blue-2",
};

function detail(p: Philosopher, state: SimulationState): string {
  const held = heldForks(state, p.id).map((f) => `F${f}`);
  if (p.state === "waiting" || p.state === "blocked") {
    const target = p.waitingFor === null ? "turno" : `F${p.waitingFor}`;
    return `${held.length ? `${held.join(" ")} · ` : ""}espera ${target}`;
  }
  if (held.length) return held.join(" + ");
  return p.meals ? `${p.meals} ${p.meals === 1 ? "comida" : "comidas"}` : "—";
}

function StateList({ state }: { state: SimulationState }) {
  return (
    <ul>
      {state.philosophers.map((p) => (
        <li key={p.id} className="hairline-t flex items-center gap-3 py-2.5">
          <svg viewBox="-16 -16 32 32" className="h-7 w-7 shrink-0" aria-hidden>
            <PhilosopherNode id={p.id} x={0} y={0} r={12} state={p.state} held={heldForks(state, p.id).length} />
          </svg>
          <span className="font-mono text-[13px] text-ink">P{p.id}</span>
          <span className="label w-[4.8rem] shrink-0" style={{ color: PHILOSOPHER_TOKENS[p.state].label }}>
            {STATE_META[p.state].label}
          </span>
          <span className="ml-auto truncate font-mono text-[12px] text-ink-3">{detail(p, state)}</span>
        </li>
      ))}
      <li className="hairline-t grid grid-cols-5 gap-1 pt-4">
        {state.forks.map((f) => (
          <span key={f.id} className="flex flex-col items-center gap-1 font-mono text-[11px]">
            <span className="text-ink-3">F{f.id}</span>
            <span className={f.heldBy === null ? "text-ink-3/60" : state.status === "deadlock" ? "text-red" : "text-blue-2"}>
              {f.heldBy === null ? "libre" : `P${f.heldBy}`}
            </span>
          </span>
        ))}
      </li>
    </ul>
  );
}

function EventLog({ state }: { state: SimulationState }) {
  const events = [...state.events].reverse();
  if (!events.length) return <p className="pt-3 text-[13px] text-ink-3">Sin eventos. Inicia la simulación.</p>;
  return (
    <ol className="max-h-[21rem] overflow-y-auto pr-1 font-mono text-[12px] leading-relaxed" aria-label="Registro de eventos, más reciente primero">
      {events.map((e) => (
        <li key={e.id} className="hairline-t flex gap-3 py-1.5">
          <span className="shrink-0 text-ink-3 tabular-nums">t{String(e.tick).padStart(3, "0")}</span>
          <span className={EVENT_COLOR[e.kind]}>{e.text}</span>
        </li>
      ))}
    </ol>
  );
}

export function SimulationStatus({ state }: { state: SimulationState }) {
  const [tab, setTab] = useState<Tab>("estado");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next].id);
    refs.current[next]?.focus();
  };

  const graph = graphFromState(state);

  return (
    <div className="p-5 sm:p-6">
      <div role="tablist" aria-label="Panel de estado" className="flex gap-6">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`label relative pb-2 transition-colors ${tab === t.id ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
          >
            {t.label}
            <span aria-hidden className={`absolute inset-x-0 bottom-0 h-px transition-colors ${tab === t.id ? "bg-blue-2" : "bg-transparent"}`} />
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-3">
        {tab === "estado" && <StateList state={state} />}
        {tab === "eventos" && <EventLog state={state} />}
        {tab === "grafo" && (
          <div className="pt-4">
            {/* Horizontal cuando el panel es ancho; vertical en móvil y en la columna lateral (xl). */}
            <ResourceGraph
              holds={graph.holds}
              requests={graph.requests}
              cycle={state.status === "deadlock"}
              title="Grafo de asignación en vivo"
              className="mx-auto hidden max-w-[720px] sm:block xl:hidden"
            />
            <ResourceGraph
              holds={graph.holds}
              requests={graph.requests}
              cycle={state.status === "deadlock"}
              orientation="vertical"
              title="Grafo de asignación en vivo"
              className="mx-auto max-w-[260px] sm:hidden xl:block xl:max-w-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
