"use client";

import { useInView } from "framer-motion";
import { ArrowRight, CircleAlert, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PHILOSOPHER_COUNT } from "@/lib/constants";
import { DeadlockTimeline } from "./DeadlockTimeline";
import { useMotionPreference } from "./MotionProvider";
import { ResourceGraph, type GraphEdge } from "./ResourceGraph";
import { SectionHeader } from "./SectionHeader";

const N = PHILOSOPHER_COUNT;
const ids = Array.from({ length: N }, (_, i) => i);

interface Frame {
  phase: number;
  holds: GraphEdge[];
  requests: GraphEdge[];
  acquired: number;
  waiting: number;
}

/** 13 fotogramas: solicitud, 5 asignaciones, 5 esperas, ciclo, deadlock. */
const FRAMES: Frame[] = [
  { phase: 0, holds: [], requests: ids.map((i) => [i, i]), acquired: 0, waiting: 0 },
  ...ids.map((k) => ({
    phase: 1,
    holds: ids.filter((i) => i <= k).map((i): GraphEdge => [i, i]),
    requests: ids.filter((i) => i > k).map((i): GraphEdge => [i, i]),
    acquired: k + 1,
    waiting: 0,
  })),
  ...ids.map((k) => ({
    phase: 2,
    holds: ids.map((i): GraphEdge => [i, i]),
    requests: ids.filter((i) => i <= k).map((i): GraphEdge => [i, (i + 1) % N]),
    acquired: N,
    waiting: k + 1,
  })),
  { phase: 3, holds: ids.map((i) => [i, i]), requests: ids.map((i) => [i, (i + 1) % N]), acquired: N, waiting: N },
  { phase: 4, holds: ids.map((i) => [i, i]), requests: ids.map((i) => [i, (i + 1) % N]), acquired: N, waiting: N },
];
const LAST = FRAMES.length - 1;

function TraceColumn({ title, rows, active }: { title: string; rows: string[]; active: number }) {
  return (
    <div>
      <p className="label text-ink-3">{title}</p>
      <ol className="mt-3 font-mono text-[13px]">
        {rows.map((row, i) => (
          <li key={row} className={`hairline-t flex items-center gap-3 py-2 transition-colors duration-500 ${i < active ? "text-ink" : "text-ink-3/50"}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${i < active ? "bg-blue-2" : "bg-ink-3/30"}`} />
            {row}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ConflictSection() {
  const panel = useRef<HTMLDivElement>(null);
  const inView = useInView(panel, { amount: 0.35 });
  const { reduced } = useMotionPreference();
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (inView && !started) {
      setStarted(true);
      if (reduced) setFrame(LAST);
      else setPlaying(true);
    }
  }, [inView, started, reduced]);

  useEffect(() => {
    if (!playing || !inView) return;
    if (frame >= LAST) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setFrame((f) => f + 1), frame === 0 ? 1100 : 750);
    return () => window.clearTimeout(id);
  }, [playing, inView, frame]);

  const f = FRAMES[frame];
  const cycle = f.phase >= 3;

  const replay = () => {
    setFrame(0);
    setPlaying(!reduced);
  };

  return (
    <section id="conflicto" aria-labelledby="conflicto-title" className="hairline-t relative bg-bg-1/60">
      <div className="shell grid-editorial gap-y-14 py-28 md:py-36 lg:py-40">
        <div className="col-span-12 lg:col-span-6">
          <SectionHeader index="05" eyebrow="Conflicto" id="conflicto-title" title="Cómo se genera un conflicto">
            <p>
              Cada filósofo toma primero su tenedor izquierdo. Todas esas solicitudes tienen éxito. El problema aparece
              en la segunda: el tenedor derecho de cada uno es el izquierdo de su vecino.
            </p>
          </SectionHeader>
        </div>

        <div ref={panel} className="hairline col-span-12 bg-bg/60">
          <div className="hairline-b flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <p className="label text-ink-3">
              Fig. 05 — Traza de ejecución <span className="ml-3 text-ink-2 tabular-nums">t = {String(frame).padStart(2, "0")}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setFrame((x) => Math.min(LAST, x + 1));
                }}
                disabled={frame >= LAST} className="btn btn-ghost h-9 px-4 text-[13px]" aria-label="Siguiente paso">
                Paso <ArrowRight size={14} aria-hidden />
              </button>
              <button type="button" onClick={replay} className="btn btn-ghost h-9 px-4 text-[13px]">
                {frame === 0 && !playing ? <Play size={13} aria-hidden /> : <RotateCcw size={13} aria-hidden />}
                {frame === 0 && !playing ? "Reproducir" : "Repetir"}
              </button>
            </div>
          </div>

          <div className="px-5 pt-8 sm:px-8">
            <DeadlockTimeline phase={f.phase} />
          </div>

          <div className="grid gap-12 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <ResourceGraph holds={f.holds} requests={f.requests} cycle={cycle} title="Grafo de asignación durante el conflicto" className="hidden sm:block" />
              <ResourceGraph
                holds={f.holds}
                requests={f.requests}
                cycle={cycle}
                orientation="vertical"
                title="Grafo de asignación durante el conflicto"
                className="mx-auto max-w-[240px] sm:hidden"
              />
            </div>
            <div className="grid content-start gap-8 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-2">
              <TraceColumn title="Adquiere" rows={ids.map((i) => `P${i} → F${i}`)} active={f.acquired} />
              <TraceColumn title="Espera" rows={ids.map((i) => `P${i} → F${(i + 1) % N}`)} active={f.waiting} />
              <div className="sm:col-span-2" aria-live="polite">
                <div className={`hairline-t pt-5 transition-opacity duration-500 ${cycle ? "opacity-100" : "opacity-0"}`}>
                  <p className="label text-red">Cycle detected</p>
                  <p className="mt-2 font-mono text-[14px] text-ink">P0 → P1 → P2 → P3 → P4 → P0</p>
                </div>
                <p className={`mt-5 flex items-center gap-2.5 transition-opacity duration-500 ${f.phase === 4 ? "opacity-100" : "opacity-0"}`}>
                  <CircleAlert size={16} className="text-red" aria-hidden />
                  <span className="text-[15px] text-ink">Deadlock: todos retienen uno y esperan otro.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
