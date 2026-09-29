import { Reveal } from "./Reveal";
import { ResourceDiagram } from "./ResourceDiagram";
import { SectionHeader } from "./SectionHeader";

export function ResourceSection() {
  return (
    <section id="recurso" aria-labelledby="recurso-title" className="relative bg-bg-1/60">
      <div className="hairline-t" />
      <div className="shell grid-editorial gap-y-16 py-28 md:py-36 lg:py-40">
        <div className="col-span-12 lg:col-span-5">
          <SectionHeader index="03" eyebrow="Recurso compartido" id="recurso-title" title="Un recurso. Un solo dueño a la vez.">
            <p>
              Un recurso compartido es cualquier elemento que más de un proceso necesita para avanzar: memoria, un
              archivo, una impresora, un lock. Solo uno puede usarlo en cada instante.
            </p>
            <p>
              Mientras un proceso lo retiene, cualquier otro que lo solicite queda en espera. En la mesa, ese recurso es
              el tenedor.
            </p>
          </SectionHeader>
        </div>

        <Reveal delay={0.1} className="col-span-12 md:col-span-10 md:col-start-2 lg:col-span-6 lg:col-start-7">
          <div className="relative">
            <p className="label mb-6 flex items-center justify-between text-ink-3">
              <span>Fig. 03 — Ciclo de uso de un recurso</span>
              <span className="hidden sm:inline">request · hold · wait</span>
            </p>
            <ResourceDiagram />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
