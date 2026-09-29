import { ArrowRight } from "lucide-react";
import { CycleBreak } from "./CycleBreak";
import { Reveal } from "./Reveal";

const FLOW = ["Pensar", "Adquirir", "Esperar", "Bloquear"];

export function Conclusion() {
  return (
    <section id="conclusion" aria-labelledby="conclusion-title" className="hairline-t relative overflow-hidden">
      <div aria-hidden className="spotlight pointer-events-none absolute inset-0 opacity-60" />
      <div className="shell relative py-40 md:py-56">
        <Reveal>
          <p className="label flex items-center gap-3 text-ink-3">
            <span className="text-ink-2">11</span>
            <span aria-hidden className="h-px w-8 bg-ink-3/40" />
            <span>Conclusión</span>
          </p>
          <h2
            id="conclusion-title"
            className="mt-12 text-[clamp(44px,8vw,120px)] font-medium leading-[0.95] tracking-[-0.045em] text-ink"
          >
            El deadlock
            <br />
            no aparece <span className="serif italic tracking-[-0.02em] text-ink-2">por azar.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 grid-editorial">
          <p className="body col-span-12 text-[18px] md:col-span-6 md:col-start-7 lg:col-span-4 lg:col-start-9 lg:text-[19px]">
            Surge cuando varios procesos compiten por recursos compartidos bajo determinadas condiciones.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-32 md:mt-44">
          <ol className="flex flex-col gap-5 md:flex-row md:items-center md:gap-0" aria-label="Secuencia que conduce al bloqueo">
            {FLOW.map((word, i) => (
              <li key={word} className="flex items-center gap-5 md:flex-1 md:gap-0">
                <span className="flex items-baseline gap-4">
                  <span className="label text-ink-3">0{i + 1}</span>
                  <span className={`font-mono text-[18px] tracking-[0.18em] md:text-[20px] ${i === FLOW.length - 1 ? "text-red" : "text-ink"}`}>
                    {word.toUpperCase()}
                  </span>
                </span>
                {i < FLOW.length - 1 && (
                  <span aria-hidden className="hidden flex-1 items-center px-6 text-ink-3 md:flex">
                    <span className="h-px flex-1 bg-ink-3/30" />
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="hairline-t mt-32 pt-16 md:mt-44">
          <CycleBreak />
        </div>
      </div>
    </section>
  );
}
