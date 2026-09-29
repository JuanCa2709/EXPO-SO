"use client";

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { DebianTerminal } from "../DebianTerminal/DebianTerminal";
import { useMotionPreference } from "../MotionProvider";
import { useSimulationViewport } from "../SimulationContext";
import { SequenceLoading } from "./SequenceLoading";
import { FRAME_CHAR, WINDOW_IN_FRAME } from "@/lib/laptopWindow";
import { SequenceRenderer, frameSize } from "./sequenceRenderer";
import { useImageSequence } from "./useImageSequence";
import "./laptopOpening.css";

/** Los frames ocupan [0, SEQUENCE_END]; el resto es el paso a la terminal real. */
const SEQUENCE_END = 0.86;
const TERMINAL_IN: [number, number] = [0.88, 0.95];
/**
 * Inercia del scroll: la escena sigue a la rueda con ~0,3 s de suavizado.
 * Amortiguación por encima de la crítica: nunca se pasa de largo (los frames no retroceden).
 */
const SPRING = { stiffness: 90, damping: 14, mass: 0.35, restDelta: 0.0001 };
/** Frames por segundo a partir de los cuales el fundido entre frames es completo. */
const FULL_BLEND_FPS = 36;

/** Avance de un carácter de DejaVu Sans Mono / Menlo, en em. */
const MONO_ADVANCE = 0.602;

interface TerminalLayout {
  left: number;
  top: number;
  width: number;
  height: number;
  font: number;
  /** true: coincide con la ventana del frame; false: maximizada (pantallas pequeñas). */
  aligned: boolean;
}

/**
 * Coloca la terminal real exactamente sobre la ventana que aparece en el último frame
 * (mismo tamaño y misma letra). Si en esa posición quedaría ilegible, se maximiza.
 */
function terminalLayout(renderer: SequenceRenderer, stage: HTMLElement): TerminalLayout {
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const rect = renderer.cssRectOf(WINDOW_IN_FRAME);
  const frame = renderer.cssRectOf({ x: 0, y: 0, w: 1, h: 1 });
  if (rect && frame) {
    const font = (frame.w * FRAME_CHAR) / MONO_ADVANCE;
    const fits = rect.x >= 4 && rect.y >= 0 && rect.x + rect.w <= W - 4 && rect.y + rect.h <= H && rect.w >= 600 && font >= 12;
    if (fits) return { left: rect.x, top: rect.y, width: rect.w, height: rect.h, font, aligned: true };
  }
  const pad = W < 640 ? 10 : 20;
  const width = Math.min(W - pad * 2, 1180);
  return { left: (W - width) / 2, top: pad, width, height: H - pad * 2, font: W < 640 ? 12.5 : W < 1024 ? 13.5 : 15, aligned: false };
}

const sameLayout = (a: TerminalLayout | null, b: TerminalLayout) =>
  !!a && a.aligned === b.aligned && (["left", "top", "width", "height", "font"] as const).every((k) => Math.abs(a[k] - b[k]) < 0.5);

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Texto editorial secundario: entra y sale en un tramo del scroll. */
function StoryText({ progress, range, className, children }: { progress: MotionValue<number>; range: [number, number, number, number]; className: string; children: React.ReactNode }) {
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, [range[0], range[1]], [8, 0]);
  return (
    <motion.div aria-hidden className={`pointer-events-none absolute ${className}`} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

export function LaptopScene({ templates, widths }: { templates: string[]; widths: readonly number[] }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<SequenceRenderer | null>(null);
  const paintRef = useRef<() => void>(() => {});
  const { reduced } = useMotionPreference();
  const [layout, setLayout] = useState<TerminalLayout | null>(null);
  useSimulationViewport(section);

  const onFrameReady = useCallback(() => paintRef.current(), []);
  const sequence = useImageSequence(templates, widths, section, onFrameReady);
  const last = templates.length - 1;

  // Progreso controlado solo por el scroll; con movimiento reducido, directamente el estado final.
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const progress = useSpring(0, SPRING);
  useEffect(() => progress.jump(reduced ? 1 : scrollYProgress.get()), [reduced, progress, scrollYProgress]);
  useMotionValueEvent(scrollYProgress, "change", (v) => !reduced && progress.set(v));

  const relayout = useCallback(() => {
    const r = renderer.current;
    const el = stage.current;
    if (!r || !el) return;
    const next = terminalLayout(r, el);
    setLayout((cur) => (sameLayout(cur, next) ? cur : next));
  }, []);

  // Posición fraccionaria. En movimiento, los frames vecinos se funden (se lee como desenfoque de
  // movimiento); al frenar, el fundido se estrecha hasta el frame real más cercano.
  const paint = useCallback(() => {
    const r = renderer.current;
    if (!r || !sequence) return;
    const first = sequence.frameAt(0);
    if (!first) return;
    if (r.setSource(frameSize(first))) relayout();
    const p = progress.get();
    const velocity = progress.getVelocity();
    const position = Math.min(1, Math.max(0, p / SEQUENCE_END)) * last;
    sequence.focus(position, velocity);
    r.render(position, ((Math.abs(velocity) / SEQUENCE_END) * last) / FULL_BLEND_FPS, sequence.frameAt, last);
  }, [sequence, progress, last, relayout]);

  useEffect(() => {
    paintRef.current = () => {
      renderer.current?.invalidate();
      paint();
    };
    paintRef.current();
  }, [paint]);

  // El scroll nunca re-renderiza React: el canvas se repinta directamente en el ciclo de animación.
  useMotionValueEvent(progress, "change", paint);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const r = new SequenceRenderer(el);
    renderer.current = r;
    const observer = new ResizeObserver(() => {
      r.layout();
      relayout();
      paintRef.current();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      renderer.current = null;
    };
  }, [relayout]);

  // Paso final: la ventana del frame se convierte en la terminal real, en el mismo sitio.
  const terminalOpacity = useTransform(progress, (p) => smoothstep(TERMINAL_IN[0], TERMINAL_IN[1], p));
  const terminalScale = useTransform(terminalOpacity, (o) => (layout?.aligned ? 1 : 0.985 + 0.015 * o));
  const [interactive, setInteractive] = useState(false);
  const syncInteractive = useCallback((v: number) => setInteractive((cur) => (cur === v > 0.6 ? cur : v > 0.6)), []);
  useMotionValueEvent(terminalOpacity, "change", syncInteractive);
  useEffect(() => syncInteractive(terminalOpacity.get()), [reduced, terminalOpacity, syncInteractive]);

  const terminalStyle = layout
    ? ({ left: layout.left, top: layout.top, width: layout.width, height: layout.height, "--term-immersive-size": `${layout.font.toFixed(2)}px` } as React.CSSProperties)
    : undefined;

  return (
    <section ref={section} aria-label="El portátil se abre y la cámara entra en la pantalla hasta la terminal Debian" className="laptop-scroll hairline-t">
      <div className="laptop-sticky">
        <div ref={stage} className="laptop-stage">
          <canvas ref={canvas} aria-hidden className="laptop-canvas" />
          <motion.div className="laptop-terminal" style={{ opacity: terminalOpacity, scale: terminalScale }} inert={!interactive}>
            <DebianTerminal tty="pts/0" variant="immersive" screen="neofetch" style={terminalStyle} />
          </motion.div>
        </div>

        <StoryText progress={progress} range={[-0.01, 0, 0.09, 0.13]} className="left-5 top-[18%] md:left-12 xl:left-[72px]">
          <p className="text-[clamp(28px,4vw,52px)] font-medium leading-[1.02] tracking-[-0.035em] text-ink">
            Una máquina.
            <br />
            <span className="text-ink-2">Un sistema.</span>
          </p>
        </StoryText>
        <StoryText progress={progress} range={[0.15, 0.19, 0.31, 0.35]} className="bottom-[12%] left-5 md:left-12 xl:left-[72px]">
          <p className="label text-ink-2">Preparando entorno…</p>
        </StoryText>
        <StoryText progress={progress} range={[0.39, 0.43, 0.56, 0.61]} className="bottom-[12%] right-5 text-right md:right-12 xl:right-[72px]">
          <ul className="label space-y-2 text-ink-2">
            <li>Kernel</li>
            <li>Processes</li>
            <li>Resources</li>
          </ul>
        </StoryText>
        <StoryText progress={progress} range={[0.68, 0.71, 0.75, 0.77]} className="bottom-[10%] left-1/2 -translate-x-1/2">
          <p className="label whitespace-nowrap text-blue-2">System ready</p>
        </StoryText>

        {sequence && !reduced && <SequenceLoading sequence={sequence} />}
      </div>
    </section>
  );
}
