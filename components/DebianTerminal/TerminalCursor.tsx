/** Cursor de bloque. Parpadea con foco; contorno hueco cuando la terminal no tiene foco. */
export function TerminalCursor({ char, focused }: { char?: string; focused: boolean }) {
  return (
    <span aria-hidden className={`term-cursor ${focused ? "" : "is-idle"}`}>
      {char && char !== "" ? char : " "}
    </span>
  );
}
