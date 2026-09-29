"use client";

import { useMemo, useState } from "react";
import { PHILOSOPHER_COUNT } from "@/lib/constants";
import { createSimulation } from "@/lib/simulation";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";
import { StateLegend } from "./StateLegend";
import { SystemDiagram } from "./SystemDiagram";

const N = PHILOSOPHER_COUNT;

function Readout({ selected }: { selected: number | null }) {
  if (selected === null) {
    return (
      <p className="text-[15px] text-ink-2">
        Selecciona un proceso en el diagrama para ver qué recursos necesita y con quién compite.
      </p>
    );
  }
  const left = selected;
  const right = (selected + 1) % N;
  const prev = (selected + N - 1) % N;
  const next = (selected + 1) % N;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-mono text-[13px]">
      <dt className="text-ink-3">PROCESO</dt>
      <dd className="text-ink">P{selected}</dd>
      <dt className="text-ink-3">NECESITA</dt>
      <dd className="text-blue-2">
        F{left} <span className="text-ink-3">izq</span> + F{right} <span className="text-ink-3">der</span>
      </dd>
      <dt className="text-ink-3">COMPITE</dt>
      <dd className="text-ink-2">
        con P{prev} por F{left} · con P{next} por F{right}
      </dd>
    </dl>
  );
}

export function PhilosopherModel() {
  const [selected, setSelected] = useState<number | null>(null);
  const initial = useMemo(() => createSimulation("deadlock"), []);
  const toggle = (id: number) => setSelected((cur) => (cur === id ? null : id));

  const diagram = {
    philosophers: initial.philosophers,
    forks: initial.forks,
    selected,
    onSelect: toggle,
    title: "Modelo del sistema: cinco filósofos y cinco tenedores",
    description: "Cada filósofo Pi necesita el tenedor Fi a su izquierda y F(i+1) a su derecha. Cada tenedor es compartido por dos vecinos.",
  };

  return (
    <section id="modelo" aria-labelledby="modelo-title" className="hairline-t relative overflow-hidden">
      <div aria-hidden className="spotlight pointer-events-none absolute inset-0 lg:left-1/3" />
      <div className="shell grid-editorial relative gap-y-16 py-28 md:py-36 lg:py-40">
        <div className="col-span-12 lg:col-span-5">
          <SectionHeader
            index="04"
            eyebrow="Modelo"
            id="modelo-title"
            title={
              <>
                Cinco procesos.
                <br />
                Cinco recursos.
              </>
            }
          >
            <p>
              Cada filósofo <span className="font-mono text-[0.92em] text-ink">Pi</span> necesita el tenedor de su
              izquierda <span className="font-mono text-[0.92em] text-ink">Fi</span> y el de su derecha{" "}
              <span className="font-mono text-[0.92em] text-ink">F(i+1) mod 5</span>. Cada tenedor es compartido por
              exactamente dos vecinos: toda la mesa es una cadena de dependencias.
            </p>
          </SectionHeader>

          <Reveal delay={0.1} className="hairline mt-10 max-w-[34rem] bg-bg-1/70 p-5">
            <Readout selected={selected} />
          </Reveal>

          <Reveal delay={0.15} className="mt-14">
            <StateLegend />
          </Reveal>
        </div>

        <Reveal delay={0.1} className="col-span-12 lg:col-span-7 lg:col-start-6 lg:pl-8">
          <div className="lg:sticky lg:top-24">
            <p className="label mb-2 flex justify-between text-ink-3">
              <span>Fig. 04 — Mesa como sistema</span>
              <span className="hidden sm:inline">Interactivo</span>
            </p>
            <SystemDiagram {...diagram} layout="ring" className="mx-auto hidden max-h-[88svh] w-full max-w-[680px] sm:block" />
            <SystemDiagram {...diagram} layout="chain" className="mx-auto w-full max-w-[360px] sm:hidden" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
