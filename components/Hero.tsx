"use client";

import { useMotionValue, useMotionValueEvent, useScroll } from "framer-motion";
import { ChevronDown, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PHILOSOPHER_COUNT } from "@/lib/constants";
import { seatedCount } from "@/lib/heroGeometry";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { HeroInspector } from "./HeroInspector";
import { HeroVisual } from "./HeroVisual";
import { useMotionPreference } from "./MotionProvider";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

function SeatCounter({ seated }: { seated: number }) {
  return (
    <p className="label flex items-center gap-4 text-ink-3">
      <span aria-hidden className="flex gap-1.5">
        {Array.from({ length: PHILOSOPHER_COUNT }, (_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${i < seated ? "bg-blue-2" : "bg-ink-3/30"}`} />
        ))}
      </span>
      <span className="tabular-nums">
        {seated}/{PHILOSOPHER_COUNT} procesos en la mesa
      </span>
    </p>
  );
}

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPreference();
  // Mismo criterio que la variante pin-hero de globals.css.
  const pinnedLayout = useMediaQuery("(min-width: 1024px) and (min-height: 680px)");

  // Escritorio con altura suficiente: el hero queda fijo mientras se recorre su altura extra.
  // Resto: los comensales se sientan mientras la imagen cruza la pantalla.
  const { scrollYProgress: pinned } = useScroll({ target: section, offset: ["start start", "end end"] });
  const { scrollYProgress: inline } = useScroll({ target: visual, offset: ["start 0.95", "end 0.55"] });
  const progress = useMotionValue(0);

  useEffect(() => {
    progress.set(reduced ? 1 : pinnedLayout ? pinned.get() : inline.get());
  }, [reduced, pinnedLayout, pinned, inline, progress]);
  useMotionValueEvent(pinned, "change", (v) => pinnedLayout && !reduced && progress.set(v));
  useMotionValueEvent(inline, "change", (v) => !pinnedLayout && !reduced && progress.set(v));

  const [seated, setSeated] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setSeated(seatedCount(v)));

  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const toggle = useCallback((id: number) => setSelected((cur) => (cur === id ? null : id)), []);
  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (selected !== null && selected >= seated) setSelected(null);
  }, [selected, seated]);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const complete = seated === PHILOSOPHER_COUNT;
  const caption = (
    <p className="serif text-right text-[19px] italic leading-snug text-ink-2">
      Cinco filósofos. Cinco tenedores.
      <br />
      Un solo problema.
    </p>
  );

  return (
    <section
      ref={section}
      id="inicio"
      aria-labelledby="hero-title"
      className="hero-pin relative"
    >
      <div className="relative overflow-hidden pt-16 lg:flex lg:h-[max(100svh,42.5rem)] lg:flex-col pin-hero:sticky pin-hero:top-0">
        <div aria-hidden className="system-grid pointer-events-none absolute inset-0 opacity-60" />

        <div className="shell relative z-10 flex flex-1 flex-col justify-center pb-10 pt-16 md:pt-24 lg:pointer-events-none lg:py-0">
          <div className="max-w-[44rem] lg:pointer-events-auto lg:max-w-[52%]">
            <p className="label enter text-blue-2" style={d(80)}>
              El problema de los filósofos comensales
            </p>
            <h1 id="hero-title" className="h1 hero-title enter mt-7 text-ink lg:mt-6 lg:whitespace-nowrap" style={d(160)}>
              Cuando ningún
              <br />
              proceso puede
              <br />
              <span className="text-blue">continuar.</span>
            </h1>
            <p className="body enter mt-8 max-w-[27rem] lg:mt-6" style={d(300)}>
              Un problema clásico de concurrencia donde varios procesos compiten por recursos compartidos y pueden quedar
              bloqueados.
            </p>
            <div className="enter mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 lg:mt-8" style={d(420)}>
              <a href="#simulacion" className="btn btn-primary">
                <Play size={14} strokeWidth={2} fill="currentColor" aria-hidden />
                Ver demostración
              </a>
              <a href="#contexto" className="link-arrow text-ink-2 hover:text-ink">
                Explorar el problema
                <ChevronDown size={15} strokeWidth={1.75} aria-hidden />
              </a>
            </div>
            <div className="enter mt-12 lg:mt-10" style={d(520)}>
              <SeatCounter seated={seated} />
            </div>
          </div>
        </div>

        <div ref={visual} className="relative lg:absolute lg:inset-y-0 lg:right-[-9%] lg:flex lg:w-[66%] lg:items-center">
          <div className="enter w-full" style={d(200)}>
            <HeroVisual progress={progress} seated={seated} hovered={hovered} selected={selected} onHover={setHovered} onSelect={toggle} />
          </div>
        </div>

        <HeroInspector selected={selected} onClose={close} className="shell relative z-10 pb-10 pt-2 lg:hidden" />

        <div className="shell pointer-events-none relative z-10 hidden items-end justify-between gap-8 pb-10 lg:flex">
          <a href="#contexto" className="label pointer-events-auto flex items-center gap-3 text-ink-3 transition-colors hover:text-ink-2">
            <span aria-hidden className="h-px w-8 bg-ink-3/50" />
            {complete ? "Selecciona un comensal · o sigue bajando" : "Desplázate para sentar a los procesos"}
          </a>
          <HeroInspector selected={selected} onClose={close} fallback={caption} className="pointer-events-auto flex min-h-[5.5rem] items-end justify-end" />
        </div>
      </div>
    </section>
  );
}
