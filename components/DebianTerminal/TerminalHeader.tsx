import { Minus, Square, X } from "lucide-react";
import { displayPath, debianSystem as S } from "@/lib/terminal/debianSystem";

/** Icono de GNOME Terminal: ventana redondeada con un glifo dentro (como en el frame). */
function TerminalIcon() {
  return (
    <svg viewBox="0 0 20 20" className="term-icon" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="2" y="2" width="16" height="16" rx="3" />
      <path d="M6.5 13.5c0-1.7 1.6-2.6 3.5-2.6s3.5.9 3.5 2.6" strokeLinecap="round" />
      <rect x="7.4" y="5.6" width="5.2" height="4.2" rx="1.1" />
    </svg>
  );
}

/** Barra de título de la ventana de GNOME Terminal. Los controles son decorativos. */
export function TerminalHeader({ cwd }: { cwd: string }) {
  return (
    <div className="term-header">
      <TerminalIcon />
      <p className="term-title">
        {S.username}@{S.hostname}: {displayPath(cwd)}
      </p>
      <span aria-hidden className="term-controls">
        <Minus strokeWidth={1.7} />
        <Square strokeWidth={1.7} />
        <X strokeWidth={1.7} />
      </span>
    </div>
  );
}
