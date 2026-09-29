/** `theme`: muestra la paleta y cambia el color de la terminal (lo mismo que hacer clic en un color). */
import type { OutputLine, Span } from "@/types/terminal";
import { type CommandHandler, line, out, spans } from "./terminalTypes";
import { DEFAULT_ACCENT, PALETTE_ROWS, colorName, getTheme, resolveColor, setTerminalColor } from "./terminalTheme";

/** Las dos filas de la paleta, con el número de cada color debajo. */
export function paletteLines(indent = "  "): OutputLine[] {
  return PALETTE_ROWS.flatMap((row) => [
    spans({ text: indent }, ...row.map((c): Span => ({ text: "   ", swatch: c.hex }))),
    line(indent + row.map((c) => String(c.index).padStart(2).padEnd(3)).join(""), "muted"),
  ]);
}

export const theme: CommandHandler = (args) => {
  const spec = args.join(" ");
  if (!spec) {
    const t = getTheme();
    return out(
      spans({ text: "Color de la terminal: " }, { text: colorName(t.source), tone: "prompt" }, { text: `  ${t.source}`, tone: "muted" }),
      line(""),
      ...paletteLines(),
      line(""),
      line("Haz clic en un color de la paleta (también en la de neofetch), o escribe:", "muted"),
      line("  theme <número|nombre>   p. ej. theme 4 · theme cian · theme rojo claro", "muted"),
      line("  theme #ff8800           cualquier color", "muted"),
      line("  theme reset             vuelve al verde de la terminal del portátil", "muted"),
    );
  }
  if (spec === "reset" || spec === "default") {
    setTerminalColor(null);
    return out(spans({ text: "Color de la terminal → " }, { text: "verde (predeterminado)", tone: "prompt" }, { text: `  ${DEFAULT_ACCENT}`, tone: "muted" }));
  }
  const color = resolveColor(spec);
  if (!color) return out(line(`theme: color desconocido '${spec}'`, "error"), line("Escribe theme para ver la paleta.", "muted"));
  setTerminalColor(color.hex);
  return out(spans({ text: "Color de la terminal → " }, { text: color.name, tone: "prompt" }, { text: `  ${color.hex}`, tone: "muted" }));
};
