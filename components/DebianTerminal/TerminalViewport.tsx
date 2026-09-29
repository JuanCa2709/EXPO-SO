"use client";

import { forwardRef } from "react";
import type { TerminalEntry } from "@/types/terminal";
import { TerminalLine } from "./TerminalLine";

interface TerminalViewportProps {
  entries: TerminalEntry[];
  /** Las entradas con id ≥ este valor aparecieron tras montar (se animan). */
  firstNewId: number;
  animate: boolean;
  onActivate: () => void;
  /** Alto del área desplazable (por defecto, el de la sección de simulación). */
  heightClass?: string;
  children: React.ReactNode;
}

/**
 * Área desplazable. Un clic enfoca la entrada salvo que el usuario esté seleccionando texto
 * (así se puede copiar cualquier salida).
 */
export const TerminalViewport = forwardRef<HTMLDivElement, TerminalViewportProps>(function TerminalViewport(
  { entries, firstNewId, animate, onActivate, heightClass = "h-[min(58svh,30rem)] lg:h-[min(60svh,34rem)]", children },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`term-viewport ${heightClass}`}
      onMouseUp={() => {
        if (!window.getSelection()?.toString()) onActivate();
      }}
    >
      <div className="term-lines" role="log" aria-live="polite" aria-label="Salida de la terminal">
        {entries.map((entry) => (
          <TerminalLine key={entry.id} entry={entry} isNew={entry.id >= firstNewId} animate={animate} />
        ))}
      </div>
      {children}
    </div>
  );
});
