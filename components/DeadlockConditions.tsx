"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CONDITIONS } from "@/lib/content";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { ConditionsDiagram } from "./ConditionsDiagram";

/** Umbrales de scroll: cada condición entra y, al final, el ciclo se cierra. */
const THRESHOLDS = [0.06, 0.24, 0.42, 0.6];
const CLOSE_AT = 0.78;

export function DeadlockConditions() {
  const ref = useRef<HTMLElement>(null);
  // Mismo criterio que la variante `pin` de globals.css.
  const pinned = useMediaQuery("(min-height: 700px)");
  // Fija: el progreso recorre la altura extra. Fluida: recorre el paso de la sección por la pantalla.
  const { scrollYProgress: pinnedProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const { scrollYProgress: flowProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.9"] });
  const [count, setCount] = useState(0);
  const [closed, setClosed] = useState(false);

  const apply = (v: number) => {
    setCount(THRESHOLDS.filter((t) => v >= t).length);
    setClosed(v >= CLOSE_AT);
  };
  useMotionValueEvent(pinnedProgress, "change", (v) => pinned && apply(v));
  useMotionValueEvent(flowProgress, "change", (v) => !pinned && apply(v));
  useEffect(() => apply(pinned ? pinnedProgress.get() : flowProgress.get()), [pinned, pinnedProgress, flowProgress]);

  const active = closed ? -1 : count - 1;

  return (
    <section ref={ref} id="condiciones" aria-labelledby="condiciones-title" className="hairline-t relative pin:h-[360svh]">
      <div className="flex items-center py-24 pin:sticky pin:top-0 pin:h-[100svh] pin:overflow-hidden pin:py-0">
        <div aria-hidden className="system-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="shell grid-editorial relative w-full items-center gap-y-6 pt-16">
          <div className="col-span-12 lg:col-span-5">
            <p className="label flex items-center gap-3 text-ink-3">
              <span className="text-ink-2">06</span>
              <span aria-hidden className="h-px w-8 bg-ink-3/40" />
              <span>Condiciones de Coffman</span>
            </p>
            <h2 id="condiciones-title" className="h2 mt-5 text-balance lg:mt-6">
              Las 4 condiciones del deadlock
            </h2>
            <p className="body short-hide mt-5 hidden max-w-[30rem] md:block">
              Un deadlock solo es posible cuando las cuatro se cumplen al mismo tiempo. Romper cualquiera de ellas rompe
              el ciclo.
            </p>

            <ol className="mt-6 lg:mt-9">
              {CONDITIONS.map((c, i) => {
                const reached = i < count;
                const current = i === active;
                return (
                  <li key={c.index} className="hairline-t py-2.5 lg:py-3">
                    <div className="flex items-baseline gap-4">
                      <span className={`label tabular-nums transition-colors duration-500 ${reached ? (closed ? "text-red" : "text-blue-2") : "text-ink-3/60"}`}>
                        {c.index}
                      </span>
                      <span className={`text-[16px] tracking-[-0.01em] transition-colors duration-500 lg:text-[18px] ${reached ? "text-ink" : "text-ink-3/60"}`}>
                        {c.title}
                      </span>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ height: current ? "auto" : 0, opacity: current ? 1 : 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden pl-[2.6rem]"
                    >
                      <p className="pt-2 text-[14px] leading-relaxed text-ink-2 lg:text-[15px]">{c.text}</p>
                      <p className="label pt-2 text-ink-3">{c.example}</p>
                    </motion.div>
                  </li>
                );
              })}
            </ol>
            <p className="label mt-4 h-4 text-red transition-opacity duration-500" style={{ opacity: closed ? 1 : 0 }} aria-live="polite">
              {closed ? "Las cuatro se cumplen · cycle detected" : ""}
            </p>
          </div>

          <div className="col-span-12 flex justify-center lg:col-span-6 lg:col-start-7">
            <div className="w-full max-w-[min(280px,30svh)] pb-6 sm:max-w-[min(380px,60svh)] lg:max-w-[min(460px,62svh)] xl:max-w-[min(520px,62svh)]">
              <ConditionsDiagram count={count} closed={closed} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
