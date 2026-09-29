"use client";

import { useEffect, useState } from "react";
import { type DeviceProfile, getDeviceProfile } from "@/lib/devicePerformance";
import { FrameSequence } from "./frameCache";

/**
 * Ancho de frame necesario: el que ocupará el portátil en pantalla por la densidad de píxeles
 * (limitada a 1,5 en táctiles). Con ahorro de datos, red lenta o poca memoria se baja un escalón.
 */
function chooseWidth(widths: readonly number[], profile: DeviceProfile, vw: number, vh: number): number {
  const aspect = 16 / 9;
  const drawn = vh > vw ? Math.min(vh * aspect, vw * 1.5, vh * 0.62 * aspect) : Math.min(vw, vh * aspect);
  const needed = drawn * Math.min(profile.dpr, profile.coarse ? 1.5 : 2);
  let index = widths.findIndex((w) => w >= needed * 0.9);
  if (index < 0) index = widths.length - 1;
  if (profile.saveData || profile.slowNetwork || profile.memory <= 2) index = Math.max(0, index - 1);
  return widths[index];
}

/** Presupuesto de memoria para frames decodificados: ~24 MB por GB de RAM (entre 48 y 200 MB). */
function memoryBudget(profile: DeviceProfile): number {
  const mb = Math.min(200, Math.max(48, profile.memory * 24)) * (profile.coarse ? 0.75 : 1);
  return mb * 1024 * 1024;
}

/**
 * Crea la secuencia adaptada al dispositivo. La descarga empieza cuando la sección se acerca
 * (dos pantallas antes) o, con buena red, cuando el navegador queda libre tras cargar la página.
 */
export function useImageSequence(templates: string[], widths: readonly number[], section: React.RefObject<Element | null>, onFrameReady: () => void) {
  const [sequence, setSequence] = useState<FrameSequence | null>(null);

  useEffect(() => {
    const profile = getDeviceProfile();
    const width = chooseWidth(widths, profile, window.innerWidth, window.innerHeight);
    const seq = new FrameSequence({
      urls: templates.map((t) => t.replace("{w}", String(width))),
      budgetBytes: memoryBudget(profile),
      concurrency: profile.lowPower ? 3 : 6,
      decodeConcurrency: profile.lowPower ? 1 : 2,
      onFrameReady,
    });
    setSequence(seq);

    const start = () => seq.start();
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && start(), { rootMargin: "200% 0px" });
    if (section.current) observer.observe(section.current);

    let idle: number | undefined;
    const onLoad = () => {
      idle = window.setTimeout(start, 1200);
    };
    const eager = !profile.saveData && !profile.slowNetwork;
    if (eager) {
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("load", onLoad);
      window.clearTimeout(idle);
      seq.dispose();
    };
    // onFrameReady es estable (useCallback); la secuencia no se recrea al hacer scroll.
  }, [templates, widths, section, onFrameReady]);

  return sequence;
}
