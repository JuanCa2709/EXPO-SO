"use client";

import type { MotionValue } from "framer-motion";
import Image from "next/image";
import { HERO_ANCHORS, clipPolygon, outward, pctX, pctY } from "@/lib/heroGeometry";
import { HERO_DINERS } from "@/lib/heroDiners";
import { HeroDinerLayer, type DinerEmphasis } from "./HeroDinerLayer";
import { HeroOverlay } from "./HeroOverlay";

/** Bordes desvanecidos: la fotografía se funde con el fondo sin marco visible. */
const FADE =
  "linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%), linear-gradient(to right, transparent 0%, #000 22%, #000 86%, transparent 100%)";
const N = HERO_DINERS.length;

interface HeroVisualProps {
  progress: MotionValue<number>;
  seated: number;
  hovered: number | null;
  selected: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
}

export function HeroVisual({ progress, seated, hovered, selected, onHover, onSelect }: HeroVisualProps) {
  const focus = selected ?? hovered;
  const emphasis = (id: number): DinerEmphasis => {
    if (id === hovered || id === selected) return "focus";
    return selected !== null ? "dim" : "none";
  };

  return (
    <div className="relative aspect-[16/10] w-full">
      <div
        className="absolute inset-0"
        style={{ maskImage: FADE, WebkitMaskImage: FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        <Image
          src="/images/hero/base.webp"
          alt="Vista cenital de una mesa circular de piedra oscura con cinco platos; los filósofos ocupan sus sillas a medida que se desplaza la página."
          fill
          priority
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover"
        />
        {HERO_DINERS.map((d) => (
          <HeroDinerLayer key={d.id} shape={d} progress={progress} emphasis={emphasis(d.id)} />
        ))}
        <HeroOverlay progress={progress} seated={seated} active={hovered} selected={selected} />
      </div>

      {HERO_ANCHORS.map((p, i) => {
        const elbow = outward(p, 128);
        const right = elbow.x >= p.x;
        const isSeated = i < seated;
        const lit = i === focus;
        return (
          <span
            key={`label-${i}`}
            aria-hidden
            className="pointer-events-none absolute hidden flex-col font-mono text-[11px] leading-tight tracking-[0.14em] sm:flex"
            style={{
              left: pctX(elbow.x + (right ? 14 : -14)),
              top: pctY(elbow.y),
              translate: right ? "0 -50%" : "-100% -50%",
              alignItems: right ? "flex-start" : "flex-end",
            }}
          >
            <span className={`transition-colors duration-300 ${lit ? "text-blue-2" : isSeated ? "text-ink" : "text-ink-3"}`}>P{i}</span>
            <span className={`text-[10px] transition-colors duration-300 ${lit ? "text-ink-2" : "text-ink-3"}`}>
              {!isSeated ? "LIBRE" : lit ? `F${i} · F${(i + 1) % N}` : "THINKING"}
            </span>
          </span>
        );
      })}

      {HERO_DINERS.map((d) => {
        const isSeated = d.id < seated;
        return (
          <button
            key={`hit-${d.id}`}
            type="button"
            disabled={!isSeated}
            tabIndex={isSeated ? 0 : -1}
            aria-label={`Filósofo P${d.id}: ver qué recursos necesita`}
            aria-pressed={selected === d.id}
            onClick={() => onSelect(d.id)}
            onPointerEnter={() => onHover(d.id)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(d.id)}
            onBlur={() => onHover(null)}
            className="absolute cursor-pointer outline-none disabled:pointer-events-none disabled:cursor-default"
            style={{ left: pctX(d.x), top: pctY(d.y), width: pctX(d.w), height: pctY(d.h), clipPath: clipPolygon(d) }}
          />
        );
      })}
    </div>
  );
}
