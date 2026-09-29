"use client";

import { useInView } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { type SimulationController, useSimulation } from "@/lib/useSimulation";

/**
 * Una sola instancia del motor para toda la página: el panel visual y las terminales Debian
 * leen y escriben el mismo estado.
 */
export const SimulationContext = createContext<SimulationController | null>(null);
const ViewportContext = createContext<(visible: boolean) => void>(() => {});

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(0);
  // El reloj solo corre mientras algún consumidor (panel o terminal) está en pantalla.
  const sim = useSimulation("deadlock", { active: visible > 0 });
  const register = useCallback((isVisible: boolean) => setVisible((n) => n + (isVisible ? 1 : -1)), []);

  return (
    <SimulationContext.Provider value={sim}>
      <ViewportContext.Provider value={register}>{children}</ViewportContext.Provider>
    </SimulationContext.Provider>
  );
}

export function useDemoSimulation(): SimulationController {
  const sim = useContext(SimulationContext);
  if (!sim) throw new Error("useDemoSimulation debe usarse dentro de <SimulationProvider>");
  return sim;
}

/** Marca un bloque como consumidor visible del motor mientras está en pantalla. */
export function useSimulationViewport(ref: React.RefObject<Element | null>) {
  const register = useContext(ViewportContext);
  const inView = useInView(ref, { amount: 0 });
  useEffect(() => {
    if (!inView) return;
    register(true);
    return () => register(false);
  }, [inView, register]);
}
