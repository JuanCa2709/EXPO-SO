import { GLOSSARY, SYSTEM_FIGURES } from "@/lib/content";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

export function ContextSection() {
  return (
    <section id="contexto" aria-labelledby="contexto-title" className="hairline-t relative">
      <div className="shell grid-editorial gap-y-20 py-28 md:py-36 lg:py-44">
        <div className="col-span-12 lg:col-span-6">
          <SectionHeader
            index="02"
            eyebrow="Contexto"
            id="contexto-title"
            title={
              <>
                ¿Qué es el problema
                <br className="hidden md:block" /> de los filósofos comensales?
              </>
            }
          >
            <p>
              Cinco filósofos se sientan alrededor de una mesa circular. Entre cada par hay un único tenedor. Para comer,
              cada uno necesita los dos que tiene a su lado; cuando termina, los devuelve y vuelve a pensar.
            </p>
            <p>
              Edsger Dijkstra lo planteó en 1965 y Tony Hoare le dio su forma actual. No trata de comida: es un modelo
              mínimo de procesos que compiten por recursos que no se pueden compartir.
            </p>
          </SectionHeader>

          <Reveal delay={0.1} className="mt-14 max-w-[34rem]">
            <p className="label text-ink-3">Traducción del modelo</p>
            <dl className="mt-5">
              {GLOSSARY.map((row) => (
                <div key={row.term} className="hairline-t grid grid-cols-[7.5rem_1fr] gap-4 py-4 sm:grid-cols-[9rem_1fr_auto]">
                  <dt className="text-[15px] text-ink-2">{row.term}</dt>
                  <dd className="text-[15px] text-ink">
                    <span aria-hidden className="mr-3 text-ink-3">→</span>
                    {row.maps}
                  </dd>
                  <dd className="label col-span-2 text-ink-3 sm:col-span-1 sm:text-right">{row.note}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pt-16">
          <figure>
            <figcaption className="label flex items-center justify-between text-ink-3">
              <span>Fig. 02 — Parámetros del sistema</span>
              <span className="text-ink-3/70">N = 5</span>
            </figcaption>
            <dl className="mt-6">
              {SYSTEM_FIGURES.map((fig, i) => (
                <div key={fig.label} className="hairline-t grid grid-cols-[6.5rem_1fr] items-end gap-6 py-8 sm:grid-cols-[8.5rem_1fr]">
                  <dt className="order-2 pb-1">
                    <span className="label block text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    <span className="mt-3 block text-[19px] font-medium tracking-[-0.02em] text-ink">{fig.label}</span>
                    <span className="mt-1 block text-[14px] text-ink-2">{fig.note}</span>
                  </dt>
                  <dd className="order-1 text-[88px] font-light leading-[0.8] tracking-[-0.06em] text-ink tabular-nums sm:text-[112px]">
                    {fig.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="hairline-t" />
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
