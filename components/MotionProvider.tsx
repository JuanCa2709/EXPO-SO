"use client";

import { MotionConfig, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getDeviceProfile } from "@/lib/devicePerformance";

interface MotionPreference {
  /** true si el sistema o el usuario piden reducir el movimiento. */
  reduced: boolean;
  /** Preferencia manual guardada desde la barra de navegación. */
  manual: boolean;
  toggle: () => void;
  /** Equipo modesto: se desactivan los efectos más costosos (desenfoques, grano). */
  lowPower: boolean;
}

const MotionContext = createContext<MotionPreference>({
  reduced: false,
  manual: false,
  toggle: () => {},
  lowPower: false,
});

const STORAGE_KEY = "deadlock06:reduced-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const system = useReducedMotion() ?? false;
  const [manual, setManual] = useState(false);
  // El servidor no conoce la preferencia: hasta hidratar, todos renderizan igual que en el servidor.
  const [hydrated, setHydrated] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const low = getDeviceProfile().lowPower;
    setLowPower(low);
    document.documentElement.dataset.perf = low ? "low" : "full";
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setManual(true);
    } catch {
      /* almacenamiento no disponible: se usa la preferencia del sistema */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = manual ? "reduced" : "full";
  }, [manual]);

  const toggle = useCallback(() => {
    setManual((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* sin persistencia */
      }
      return next;
    });
  }, []);

  const reduced = hydrated && (system || manual);
  const value = useMemo(() => ({ reduced, manual, toggle, lowPower }), [reduced, manual, toggle, lowPower]);

  return (
    <MotionContext.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>{children}</MotionConfig>
    </MotionContext.Provider>
  );
}

export const useMotionPreference = () => useContext(MotionContext);
