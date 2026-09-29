"use client";

import { useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { STORY_STEPS } from "@/lib/content";
import { deadlockStorySnapshots } from "@/lib/simulation";
import { StatusIndicator } from "./StatusIndicator";
import { SystemDiagram } from "./SystemDiagram";

const CENTER_TITLES = ["THINKING", "HUNGRY", "HOLDING", "WAITING", "DEADLOCK"];

function StepBlock({ index, active, onActive, children }: { index: number; active: boolean; onActive: (i: number) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-48% 0px -48% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  return (
    <div ref={ref} className={`flex min-h-[68svh] items-center transition-opacity duration-500 md:min-h-[82svh] ${active ? "opacity-100" : "opacity-30"}`}>
      {children}
    </div>
  );
}

export function ScrollStory() {
  const snapshots = useMemo(() => deadlockStorySnapshots(), []);
  const [step, setStep] = useState(0);
  const snap = snapshots[step];
  const final = step === snapshots.length - 1;

  const diagram = {
    philosophers: snap.philosophers,
    forks: snap.forks,
    cycle: snap.cycle,
    title: `Paso ${step + 1} de 5: ${STORY_STEPS[step].title}`,
    description: STORY_STEPS[step].text,
  };

  return (
    <section id="secuencia" aria-labelledby="secuencia-title" className="hairline-t relative">
      <div className="shell">
        <header className="grid-editorial pt-28 md:pt-36 lg:pt-40">
          <div className="col-span-12 lg:col-span-6">
            <p className="label flex items-center gap-3 text-ink-3">
              <span className="text-ink-2">07</span>
              <span aria-hidden className="h-px w-8 bg-ink-3/40" />
              <span>Secuencia</span>
            </p>
            <h2 id="secuencia-title" className="h2 mt-6">
              Anatomía de <span className="serif italic text-ink-2">un</span> bloqueo.
            </h2>
          </div>
          <p className="body col-span-12 mt-6 max-w-[30rem] self-end lg:col-span-4 lg:col-start-9 lg:mt-0">
            Cinco pasos, cada uno generado por el mismo motor que ejecuta la simulación. Ningún estado está dibujado a
            mano.
          </p>
        </header>

        <div className="relative mt-10 md:grid md:grid-cols-12 md:gap-6">
          <div className="perf-glass sticky top-16 z-10 -mx-5 bg-bg/92 px-5 pb-3 pt-3 backdrop-blur-md md:static md:col-span-7 md:col-start-6 md:row-start-1 md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <div className="md:sticky md:top-20 md:flex md:h-[calc(100svh-5rem)] md:flex-col md:justify-center">
              <SystemDiagram
                {...diagram}
                layout="ring"
                center={{ eyebrow: `STEP 0${step + 1}`, title: CENTER_TITLES[step], tone: final ? "red" : step > 1 ? "blue" : "neutral" }}
                className="mx-auto hidden max-h-[calc(100svh-11rem)] w-full max-w-[620px] md:block"
              />
              <SystemDiagram {...diagram} layout="ring" showStateLabels={false} className="mx-auto w-[min(62vw,40svh)] md:hidden" />
              <div className="hairline-t mx-auto mt-2 flex w-full max-w-[620px] items-center justify-between gap-4 pt-3 md:mt-4">
                <StatusIndicator state={final ? "deadlock" : step === 0 ? "idle" : step === 3 ? "waiting" : "running"} label={final ? "Deadlock" : `Step 0${step + 1}`} />
                <span className="truncate font-mono text-[12px] text-ink-2" aria-live="polite">
                  {STORY_STEPS[step].readout}
                </span>
              </div>
            </div>
          </div>

          <div className="relative md:col-span-5 md:col-start-1 md:row-start-1">
            {STORY_STEPS.map((s, i) => (
              <StepBlock key={s.index} index={i} active={i === step} onActive={setStep}>
                <div>
                  <p className={`label ${i === 4 ? "text-red" : "text-blue-2"}`}>Step {s.index}</p>
                  <h3 className="mt-4 text-[30px] font-medium leading-[1.05] tracking-[-0.03em] text-ink md:text-[34px] lg:text-[40px]">{s.title}</h3>
                  <p className="body mt-4 max-w-[24rem]">{s.text}</p>
                </div>
              </StepBlock>
            ))}
            <StepBlock index={4} active={final} onActive={setStep}>
              <div>
                <p className="font-mono text-[clamp(40px,6vw,76px)] font-medium leading-none tracking-[-0.02em] text-red">DEADLOCK</p>
                <p className="mt-6 text-[20px] leading-snug text-ink">
                  Todos esperan.
                  <br />
                  Nadie puede avanzar.
                </p>
                <a href="#simulacion" className="link-arrow mt-8">
                  Provocarlo en la simulación <ArrowRight size={15} aria-hidden />
                </a>
              </div>
            </StepBlock>
            <div className="h-[20svh]" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
