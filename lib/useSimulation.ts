"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SEED, TICK_MS } from "./constants";
import { advance, createSimulation } from "./simulation";
import type { SimulationMode, SimulationState } from "./types";

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

interface Options {
  /** false pausa el reloj (p. ej. cuando el panel sale de pantalla). */
  active?: boolean;
  initialSpeed?: number;
}

/** Conecta el motor puro con React: reloj, velocidad y controles. */
export function useSimulation(initialMode: SimulationMode, { active = true, initialSpeed = 1 }: Options = {}) {
  const [state, setState] = useState(() => createSimulation(initialMode, DEFAULT_SEED));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);

  const running = playing && active && state.status !== "deadlock";

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setState((s) => advance(s)), TICK_MS / speed);
    return () => window.clearTimeout(id);
  }, [running, state, speed]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);

  const reset = useCallback((mode?: SimulationMode) => {
    setPlaying(false);
    setState((s) => createSimulation(mode ?? s.mode, randomSeed()));
  }, []);

  const stepOnce = useCallback(() => {
    setPlaying(false);
    setState((s) => advance(s));
  }, []);

  const restart = useCallback(() => {
    setState((s) => createSimulation(s.mode, randomSeed()));
    setPlaying(true);
  }, []);

  /** Sustituye el estado por uno ya calculado por el motor (p. ej. la secuencia de `deadlock` de la terminal). */
  const replace = useCallback((next: SimulationState) => {
    setPlaying(false);
    setState(next);
  }, []);

  return {
    state,
    /** El reloj está avanzando ahora mismo. */
    running,
    /** El usuario pidió reproducir (aunque el panel esté fuera de pantalla). */
    playing: playing && state.status !== "deadlock",
    speed,
    setSpeed,
    play,
    pause,
    reset,
    restart,
    stepOnce,
    replace,
  };
}

export type SimulationController = ReturnType<typeof useSimulation>;
