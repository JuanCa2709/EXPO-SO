/**
 * `neofetch`: el resumen del sistema que aparece en la pantalla del portátil al final de la secuencia.
 * Mismo formato (logo de Debian + datos + bloques de color), con los datos reales de `debianSystem`.
 */
import type { OutputLine, Span } from "@/types/terminal";
import { debianSystem as S, prettyName } from "./debianSystem";
import { PALETTE_ROWS } from "./terminalTheme";

/** Logo de Debian de neofetch: "r" marca los caracteres del acento rojo. */
const LOGO: [string, string?][] = [
  ["       _,met$$$$$gg."],
  ["    ,g$$$$$$$$$$$$$$$P."],
  ['  ,g$$P"     """Y$$.".'],
  [" ,$$P'              `$$$."],
  ["',$$P       ,ggs.     `$$b:"],
  ["`d$$'     ,$P\"'   .    $$$", "                  r"],
  [" $$P      d$'     ,    $$P", "                  r"],
  [" $$:      $$.   -    ,d$$'", "                r"],
  [" $$;      Y$b._   _,d$P'"],
  [" Y$$.    `.`\"Y$$$$P\"'", "         rr"],
  [' `$$b      "-.__', '           rrrrr'],
  ["  `Y$$"],
  ["   `Y$$."],
  ["     `$$b."],
  ["       `Y$$b."],
  ['          `"Y$b._'],
  ['              `"""'],
];

/** Columna donde empiezan los datos (como en la pantalla del portátil). */
const INFO_COLUMN = 35;


function logoSpans(row: number): Span[] {
  const [text = "", marks = ""] = LOGO[row] ?? [];
  const padded = text.padEnd(INFO_COLUMN);
  const spans: Span[] = [];
  let current: Span | null = null;
  for (let i = 0; i < padded.length; i++) {
    const tone = marks[i] === "r" ? "accent" : undefined;
    if (current && current.tone === tone) current.text += padded[i];
    else {
      current = { text: padded[i], tone, logo: true };
      spans.push(current);
    }
  }
  return spans;
}

function uptime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [h ? `${h} hour${h === 1 ? "" : "s"}` : "", m ? `${m} min${m === 1 ? "" : "s"}` : ""].filter(Boolean);
  return parts.join(", ") || "0 mins";
}

/** @param elapsedMinutes minutos desde que se abrió la sesión (el uptime parte de `uptimeAtLoad`). */
export function neofetch(elapsedMinutes = 0): OutputLine[] {
  const user = `${S.username}@${S.hostname}`;
  const mem = S.mem;
  const field = (label: string, value: string): Span[] => [{ text: `${label}: `, tone: "accent" }, { text: value }];
  const info: Span[][] = [
    [{ text: user, tone: "accent" }],
    [{ text: "-".repeat(user.length) }],
    field("OS", `${prettyName} ${S.machine}`),
    field("Host", S.hostModel),
    field("Kernel", S.kernel),
    field("Uptime", uptime(S.uptimeAtLoad.hours * 60 + S.uptimeAtLoad.minutes + elapsedMinutes)),
    field("Packages", S.packages),
    field("Shell", `bash ${S.bashVersion}`),
    field("Resolution", S.resolution),
    field("DE", S.desktop),
    field("WM", S.windowManager),
    field("Theme", S.theme),
    field("Icons", S.theme),
    field("Terminal", S.terminal),
    field("CPU", `${S.cpuShort} (${S.cpuCores}) @ ${(S.cpuMHz / 1000).toFixed(3)}GHz`),
    field("Memory", `${Math.round(mem.usedMiB)}MiB / ${Math.round(mem.totalMiB)}MiB`),
    [],
    // La paleta es interactiva: un clic en un color lo aplica a la terminal.
    PALETTE_ROWS[0].map((c) => ({ text: "   ", swatch: c.hex })),
    PALETTE_ROWS[1].map((c) => ({ text: "   ", swatch: c.hex })),
  ];

  const rows = Math.max(LOGO.length, info.length);
  const out: OutputLine[] = [];
  for (let r = 0; r < rows; r++) out.push({ spans: [...logoSpans(r), ...(info[r] ?? [])] });
  out.push({ spans: [{ text: "" }] }, { spans: [{ text: "" }] });
  return out;
}
