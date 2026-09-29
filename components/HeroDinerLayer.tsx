"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import { dinerDirection, pctX, pctY, seatRange } from "@/lib/heroGeometry";
import type { HeroDinerShape } from "@/lib/heroDiners";
import { useMotionPreference } from "./MotionProvider";

export type DinerEmphasis = "none" | "focus" | "dim";

interface HeroDinerLayerProps {
  shape: HeroDinerShape;
  progress: MotionValue<number>;
  emphasis: DinerEmphasis;
}

/**
 * Un comensal recortado de la fotografía. Vista cenital: de pie está más cerca
 * de la cámara (más grande, desenfocado, desplazado hacia fuera); al sentarse
 * desciende hasta su silla y encaja exactamente en la imagen original.
 */
export function HeroDinerLayer({ shape, progress, emphasis }: HeroDinerLayerProps) {
  const t = useTransform(progress, seatRange(shape.id), [0, 1]);
  const eased = useTransform(t, (v) => 1 - (1 - v) ** 3);
  const dir = dinerDirection(shape);

  const opacity = useTransform(t, [0, 0.45], [0, 1]);
  const scale = useTransform(eased, [0, 1], [1.2, 1]);
  const x = useTransform(eased, (v) => `${(dir.x * 26 * (1 - v)).toFixed(2)}%`);
  const y = useTransform(eased, (v) => `${(dir.y * 26 * (1 - v)).toFixed(2)}%`);
  // El desenfoque animado es caro: en equipos modestos el comensal solo se desplaza y aparece.
  const { lowPower } = useMotionPreference();
  const filter = useTransform(t, (v) => (lowPower || v >= 0.999 ? "none" : `blur(${((1 - v) * 9).toFixed(2)}px)`));

  return (
    <motion.div
      aria-hidden
      className="absolute will-change-transform"
      style={{ left: pctX(shape.x), top: pctY(shape.y), width: pctX(shape.w), height: pctY(shape.h), opacity, scale, x, y, filter }}
    >
      <div
        className={`relative h-full w-full transition-[filter] duration-300 ease-out ${
          emphasis === "focus" ? "brightness-[1.75]" : emphasis === "dim" ? "brightness-[0.45]" : ""
        }`}
      >
        <Image src={`/images/hero/diner-${shape.id}.webp`} alt="" fill sizes="(min-width: 1024px) 14vw, 30vw" className="object-fill" />
      </div>
    </motion.div>
  );
}
