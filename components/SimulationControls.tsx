"use client";

import { ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { MODES, SPEEDS } from "@/lib/constants";
import type { SimulationMode, SimulationStatus } from "@/lib/types";

interface SimulationControlsProps {
  mode: SimulationMode;
  status: SimulationStatus;
  playing: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onMode: (mode: SimulationMode) => void;
  onSpeed: (speed: number) => void;
}

export function SimulationControls({
  mode,
  status,
  playing,
  speed,
  onPlay,
  onPause,
  onReset,
  onStep,
  onMode,
  onSpeed,
}: SimulationControlsProps) {
  const halted = status === "deadlock";
  const selected = MODES.find((m) => m.id === mode);

  return (
    <div className="p-5 sm:p-6 md:grid md:grid-cols-2 md:gap-x-10 lg:block">
      <div className="md:col-start-1 md:row-start-1">
        <p className="label text-ink-3">Controles</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onPlay} disabled={playing || halted} className="btn btn-primary h-10 justify-center px-4 text-[13px]">
            <Play size={13} fill="currentColor" aria-hidden /> Iniciar
          </button>
          <button type="button" onClick={onPause} disabled={!playing} className="btn btn-ghost h-10 justify-center px-4 text-[13px]">
            <Pause size={13} aria-hidden /> Pausar
          </button>
          <button type="button" onClick={onReset} className="btn btn-ghost h-10 justify-center px-4 text-[13px]">
            <RotateCcw size={13} aria-hidden /> Reiniciar
          </button>
          <button type="button" onClick={onStep} disabled={halted} className="btn btn-ghost h-10 justify-center px-4 text-[13px]">
            Paso <ArrowRight size={13} aria-hidden />
          </button>
        </div>
      </div>

      <fieldset className="mt-9 md:col-start-2 md:row-span-3 md:row-start-1 md:mt-0 lg:mt-9">
        <legend className="label text-ink-3">Modo</legend>
        <div className="mt-3">
          {MODES.map((m) => (
            <label
              key={m.id}
              className="hairline-t group relative flex cursor-pointer items-center gap-3 py-2.5 pl-3 text-[14px] text-ink-2 transition-colors hover:text-ink has-[:checked]:text-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-2"
            >
              <input type="radio" name="sim-mode" value={m.id} checked={mode === m.id} onChange={() => onMode(m.id)} className="peer sr-only" />
              <span aria-hidden className="absolute inset-y-2 left-0 w-px bg-transparent transition-colors peer-checked:bg-blue-2" />
              <span className={`label w-6 shrink-0 ${m.id === "deadlock" ? "text-red/80" : "text-ink-3"}`}>{m.index}</span>
              {m.label}
            </label>
          ))}
        </div>
        <p className="mt-3 min-h-[4.2em] text-[13px] leading-relaxed text-ink-3">{selected?.description}</p>
      </fieldset>

      <fieldset className="mt-5 md:col-start-1 md:row-start-2 md:mt-8 lg:mt-5">
        <legend className="label text-ink-3">Velocidad</legend>
        <div className="mt-3 grid grid-cols-3 rounded-full border border-[var(--hairline-strong)] p-0.5">
          {SPEEDS.map((s) => (
            <label
              key={s}
              className="cursor-pointer rounded-full py-1.5 text-center font-mono text-[12px] text-ink-3 transition-colors hover:text-ink has-[:checked]:bg-bg-3 has-[:checked]:text-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-2"
            >
              <input type="radio" name="sim-speed" value={s} checked={speed === s} onChange={() => onSpeed(s)} className="sr-only" />
              {s}×
            </label>
          ))}
        </div>
      </fieldset>

      <p className="label mt-8 hidden leading-relaxed text-ink-3/80 md:col-start-1 md:row-start-3 md:block">
        Teclado · <kbd className="text-ink-2">P</kbd> iniciar/pausar · <kbd className="text-ink-2">N</kbd> paso ·{" "}
        <kbd className="text-ink-2">R</kbd> reiniciar
      </p>
    </div>
  );
}
