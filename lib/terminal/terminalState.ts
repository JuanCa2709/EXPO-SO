/** Estado de la sesión de terminal: líneas visibles, directorio, historial y modo de entrada. */
import type { OutputLine, PromptInfo, TerminalEntry } from "@/types/terminal";
import { HOME, debianSystem as S, displayPath, prettyName } from "./debianSystem";
import { neofetch } from "./neofetch";
import { line } from "./terminalTypes";

export type InputMode = "input" | "password" | "busy";

export interface TerminalState {
  entries: TerminalEntry[];
  nextId: number;
  cwd: string;
  history: string[];
  mode: InputMode;
  /** Texto que precede a la entrada en modo contraseña ("[sudo] password for …"). */
  passwordPrompt: string | null;
}

export type TerminalAction =
  | { type: "command"; input: string; record: boolean; interrupted?: boolean }
  | { type: "append"; lines: OutputLine[] }
  | { type: "clear" }
  | { type: "cwd"; cwd: string }
  | { type: "mode"; mode: InputMode; passwordPrompt?: string | null };

const MAX_ENTRIES = 600;

export const bannerLines = (tty: string = S.tty): OutputLine[] => [
  line(prettyName),
  line(`Linux ${S.hostname} ${S.kernel} ${S.machine}`),
  line(""),
  line(`Last login: today on ${tty}`),
];

export const promptFor = (cwd: string): PromptInfo => ({ user: S.username, host: S.hostname, path: displayPath(cwd) });

function withLines(state: TerminalState, lines: OutputLine[]): TerminalState {
  const added: TerminalEntry[] = lines.map((l, i) => ({ id: state.nextId + i, kind: "output", line: l }));
  return { ...state, entries: [...state.entries, ...added].slice(-MAX_ENTRIES), nextId: state.nextId + added.length };
}

/**
 * Pantalla inicial de la sesión:
 * - "banner": el mensaje de inicio de sesión.
 * - "neofetch": la misma pantalla que muestra el portátil al final de la secuencia.
 * Determinista (sin reloj) para que el render del servidor y del cliente coincidan.
 */
export type InitialScreen = "banner" | "neofetch";

export function createTerminalState({ tty, screen = "banner" }: { tty?: string; screen?: InitialScreen } = {}): TerminalState {
  const empty: TerminalState = { entries: [], nextId: 0, cwd: HOME, history: [], mode: "input", passwordPrompt: null };
  if (screen === "banner") return withLines(empty, bannerLines(tty));
  const withCommand = terminalReducer(empty, { type: "command", input: "neofetch", record: true });
  return withLines(withCommand, neofetch(0));
}

export function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case "command": {
      const entry: TerminalEntry = { id: state.nextId, kind: "command", prompt: promptFor(state.cwd), input: action.input, interrupted: action.interrupted };
      const trimmed = action.input.trim();
      // HISTCONTROL=ignoreboth: sin líneas vacías, sin duplicados consecutivos, sin líneas que empiezan con espacio.
      const keep = action.record && trimmed && !action.input.startsWith(" ") && state.history[state.history.length - 1] !== trimmed;
      return {
        ...state,
        entries: [...state.entries, entry].slice(-MAX_ENTRIES),
        nextId: state.nextId + 1,
        history: keep ? [...state.history, trimmed] : state.history,
      };
    }
    case "append":
      return withLines(state, action.lines);
    case "clear":
      return { ...state, entries: [] };
    case "cwd":
      return { ...state, cwd: action.cwd };
    case "mode":
      return { ...state, mode: action.mode, passwordPrompt: action.passwordPrompt ?? null };
  }
}
