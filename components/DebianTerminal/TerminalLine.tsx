"use client";

import { memo, useEffect, useState, useSyncExternalStore } from "react";
import { DEFAULT_THEME, colorName, getTheme, setTerminalColor, subscribeTheme } from "@/lib/terminal/terminalTheme";
import type { OutputLine, PromptInfo, TerminalEntry } from "@/types/terminal";

export function Prompt({ prompt }: { prompt: PromptInfo }) {
  return (
    <>
      <span className="term-user">
        {prompt.user}@{prompt.host}
      </span>
      :{prompt.path}$
    </>
  );
}

/** Un color de la paleta: al pulsarlo pasa a ser el color de la terminal. */
function Swatch({ hex, text }: { hex: string; text: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => DEFAULT_THEME);
  const selected = theme.custom && theme.source === hex;
  const name = colorName(hex);
  return (
    <button
      type="button"
      className={`term-swatch${selected ? " is-selected" : ""}`}
      style={{ background: hex }}
      onClick={() => setTerminalColor(hex)}
      aria-label={`Usar ${name} como color de la terminal`}
      aria-pressed={selected}
      title={`Usar ${name}`}
    >
      {text}
    </button>
  );
}

/** Aparición carácter a carácter: solo para mensajes importantes. */
function useTypewriter(text: string, enabled: boolean) {
  const [count, setCount] = useState(enabled ? 0 : text.length);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) window.clearInterval(id);
        return Math.min(text.length, c + 1);
      });
    }, 22);
    return () => window.clearInterval(id);
  }, [text, enabled]);
  return enabled ? count : text.length;
}

function Output({ line, animate }: { line: OutputLine; animate: boolean }) {
  const full = line.spans.map((s) => s.text).join("");
  const count = useTypewriter(full, Boolean(line.typewriter) && animate);
  let remaining = count;
  return (
    <>
      {line.spans.map((span, i) => {
        const shown = span.text.slice(0, Math.max(0, remaining));
        remaining -= span.text.length;
        if (span.swatch) return <Swatch key={i} hex={span.swatch} text={shown} />;
        return (
          <span
            key={i}
            className={`tone-${span.tone ?? "default"}${span.logo ? " nf-logo" : ""}`}
          >
            {shown}
          </span>
        );
      })}
      {count < full.length && <span className="sr-only">{full}</span>}
    </>
  );
}

interface TerminalLineProps {
  entry: TerminalEntry;
  isNew: boolean;
  animate: boolean;
}

export const TerminalLine = memo(function TerminalLine({ entry, isNew, animate }: TerminalLineProps) {
  return (
    <div className={`term-line ${isNew && animate ? "is-new" : ""}`}>
      {entry.kind === "command" ? (
        <>
          <Prompt prompt={entry.prompt} /> {entry.input}
          {entry.interrupted && <span className="tone-muted">^C</span>}
        </>
      ) : (
        <Output line={entry.line} animate={isNew && animate} />
      )}
    </div>
  );
});
