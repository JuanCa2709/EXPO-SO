import { ArrowUp } from "lucide-react";
import { TEAM } from "@/lib/content";

export function Team() {
  return (
    <footer id="equipo" aria-labelledby="equipo-title" className="hairline-t relative bg-bg-1/60">
      <div className="shell grid-editorial gap-y-16 pb-10 pt-24 md:pt-32">
        <div className="col-span-12 lg:col-span-4">
          <p className="label flex items-center gap-3 text-ink-3">
            <span className="text-ink-2">12</span>
            <span aria-hidden className="h-px w-8 bg-ink-3/40" />
            <span>Equipo</span>
          </p>
          <h2 id="equipo-title" className="mt-8 font-mono text-[28px] font-medium tracking-[0.08em] text-ink">
            GRUPO 06
          </h2>
          <p className="label mt-3 text-ink-2">Filósofos comensales</p>
        </div>

        <ul className="col-span-12 grid grid-cols-3 gap-6 lg:col-span-7 lg:col-start-6" aria-label="Integrantes">
          {TEAM.map((m, i) => (
            <li key={m.name} className="hairline-t pt-5">
              <span className="label text-ink-3">P{i}</span>
              <span aria-hidden className="mt-6 block text-[clamp(44px,7vw,88px)] font-light leading-none tracking-[-0.05em] text-ink">
                {m.initials}
              </span>
              <span className="mt-4 block text-[15px] text-ink-2">{m.name}</span>
            </li>
          ))}
        </ul>

        <div className="hairline-t col-span-12 mt-8 flex flex-wrap items-center justify-between gap-4 pt-6">
          <span className="font-mono text-[12px] tracking-[0.14em] text-ink-2">
            DEADLOCK <span className="text-ink-3">/</span> 06
          </span>
          <span className="label text-ink-3">Sistemas Operativos · 2026</span>
          <a href="#inicio" className="label flex items-center gap-2 text-ink-3 transition-colors hover:text-ink">
            Volver arriba <ArrowUp size={13} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
