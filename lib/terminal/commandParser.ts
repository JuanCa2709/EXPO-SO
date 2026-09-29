/**
 * Parser controlado: convierte la línea escrita en una tubería de comandos.
 * No evalúa nada: separa palabras, respeta comillas, expande variables de una lista cerrada
 * ($$, $PPID, $!, $?, $HOME…) y solo admite `|` (tubería) y `&` final (segundo plano).
 */
import type { ParsedCommand } from "./terminalTypes";

export type Env = Record<string, string>;

type Token = { type: "word"; value: string; quoted: boolean } | { type: "op"; value: string };

export interface ParsedLine {
  raw: string;
  pipeline: ParsedCommand[];
  background: boolean;
}

export type ParseResult = { ok: true; line: ParsedLine } | { ok: false; reason: "empty" | "operator" | "quote" | "pipe"; token?: string };

const NAME = /[A-Za-z_][A-Za-z0-9_]*/y;

/** Expande `$…` en la posición i. Devuelve el texto y cuántos caracteres consumió. */
function expand(input: string, i: number, env: Env): [string, number] {
  const next = input[i + 1];
  if (next !== undefined && "$!?#0".includes(next)) return [env[next] ?? "", 2];
  if (next === "{") {
    const end = input.indexOf("}", i + 2);
    if (end > i) return [env[input.slice(i + 2, end)] ?? "", end - i + 1];
  }
  NAME.lastIndex = i + 1;
  const m = NAME.exec(input);
  if (m) return [env[m[0]] ?? "", m[0].length + 1];
  return ["$", 1];
}

export function tokenize(input: string, env: Env = {}): { tokens: Token[]; unclosed: boolean } {
  const tokens: Token[] = [];
  let word = "";
  let started = false;
  let quoted = false;
  let quote: '"' | "'" | null = null;

  const flush = () => {
    if (started && (word !== "" || quoted)) tokens.push({ type: "word", value: word, quoted });
    word = "";
    started = false;
    quoted = false;
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else word += ch;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') quote = null;
      else if (ch === "\\" && i + 1 < input.length && '"\\$`'.includes(input[i + 1])) word += input[++i];
      else if (ch === "$") {
        const [text, used] = expand(input, i, env);
        word += text;
        i += used - 1;
      } else word += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      started = true;
      quoted = true;
    } else if (ch === "\\" && i + 1 < input.length) {
      word += input[++i];
      started = true;
    } else if (/\s/.test(ch)) {
      flush();
    } else if (ch === "|" || ch === "&" || ch === ";" || ch === ">" || ch === "<" || ch === "`") {
      flush();
      const double = (ch === "|" || ch === "&") && input[i + 1] === ch;
      tokens.push({ type: "op", value: double ? ch + ch : ch });
      if (double) i++;
    } else if (ch === "$" && input[i + 1] === "(") {
      flush();
      tokens.push({ type: "op", value: "$(" });
      i++;
    } else if (ch === "$") {
      const [text, used] = expand(input, i, env);
      word += text;
      started = true;
      i += used - 1;
    } else if (ch === "~" && !started && (i + 1 === input.length || /[\s/]/.test(input[i + 1])) && env.HOME) {
      // Tilde al inicio de una palabra sin comillas: el directorio personal.
      word += env.HOME;
      started = true;
    } else {
      word += ch;
      started = true;
    }
  }
  flush();
  return { tokens, unclosed: quote !== null };
}

export function parse(raw: string, env: Env = {}): ParseResult {
  const { tokens, unclosed } = tokenize(raw.trim(), env);
  if (unclosed) return { ok: false, reason: "quote" };
  if (!tokens.length) return { ok: false, reason: "empty" };

  const last = tokens[tokens.length - 1];
  const background = last.type === "op" && last.value === "&";
  if (background) tokens.pop();
  if (!tokens.length) return { ok: false, reason: "pipe", token: "&" };

  const pipeline: ParsedCommand[] = [];
  let current: string[] = [];
  for (const t of tokens) {
    if (t.type === "word") current.push(t.value);
    else if (t.value === "|") {
      if (!current.length) return { ok: false, reason: "pipe", token: "|" };
      pipeline.push({ raw: current.join(" "), name: current[0], args: current.slice(1) });
      current = [];
    } else return { ok: false, reason: "operator", token: t.value };
  }
  if (!current.length) return { ok: false, reason: "pipe", token: "|" };
  pipeline.push({ raw: current.join(" "), name: current[0], args: current.slice(1) });
  return { ok: true, line: { raw: raw.trim(), pipeline, background } };
}

/** Separa flags cortas combinadas (-la → l, a) y operandos. */
export function splitFlags(args: string[]): { flags: Set<string>; long: string[]; operands: string[] } {
  const flags = new Set<string>();
  const long: string[] = [];
  const operands: string[] = [];
  for (const a of args) {
    if (a.startsWith("--") && a.length > 2) long.push(a.slice(2));
    else if (a.startsWith("-") && a.length > 1) for (const f of a.slice(1)) flags.add(f);
    else operands.push(a);
  }
  return { flags, long, operands };
}
