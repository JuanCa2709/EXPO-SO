/** Señales de Linux (x86_64) tal como las nombra y numera `kill -l`. */

export type Signal =
  | "HUP" | "INT" | "QUIT" | "ILL" | "TRAP" | "ABRT" | "BUS" | "FPE" | "KILL" | "USR1" | "SEGV" | "USR2"
  | "PIPE" | "ALRM" | "TERM" | "STKFLT" | "CHLD" | "CONT" | "STOP" | "TSTP" | "TTIN" | "TTOU" | "URG"
  | "XCPU" | "XFSZ" | "VTALRM" | "PROF" | "WINCH" | "IO" | "PWR" | "SYS";

const NAMES: Signal[] = [
  "HUP", "INT", "QUIT", "ILL", "TRAP", "ABRT", "BUS", "FPE", "KILL", "USR1", "SEGV", "USR2", "PIPE", "ALRM", "TERM", "STKFLT",
  "CHLD", "CONT", "STOP", "TSTP", "TTIN", "TTOU", "URG", "XCPU", "XFSZ", "VTALRM", "PROF", "WINCH", "IO", "PWR", "SYS",
];

/** Lo que muestra bash cuando un trabajo termina o se detiene por una señal. */
export const SIGNAL_MESSAGES: Record<Signal, string> = {
  HUP: "Hangup", INT: "Interrupt", QUIT: "Quit", ILL: "Illegal instruction", TRAP: "Trace/breakpoint trap", ABRT: "Aborted",
  BUS: "Bus error", FPE: "Floating point exception", KILL: "Killed", USR1: "User defined signal 1", SEGV: "Segmentation fault",
  USR2: "User defined signal 2", PIPE: "Broken pipe", ALRM: "Alarm clock", TERM: "Terminated", STKFLT: "Stack fault",
  CHLD: "Child exited", CONT: "Continued", STOP: "Stopped (signal)", TSTP: "Stopped", TTIN: "Stopped (tty input)",
  TTOU: "Stopped (tty output)", URG: "Urgent I/O condition", XCPU: "CPU time limit exceeded", XFSZ: "File size limit exceeded",
  VTALRM: "Virtual timer expired", PROF: "Profiling timer expired", WINCH: "Window changed", IO: "I/O possible",
  PWR: "Power failure", SYS: "Bad system call",
};

export const signalNumber = (s: Signal) => NAMES.indexOf(s) + 1;

/** Acepta 9, KILL, SIGKILL, kill… */
export function parseSignal(spec: string): Signal | null {
  if (/^\d+$/.test(spec)) return NAMES[Number(spec) - 1] ?? null;
  const name = spec.toUpperCase().replace(/^SIG/, "");
  return (NAMES as string[]).includes(name) ? (name as Signal) : null;
}

/** Salida de `kill -l`: 64 señales en columnas de cinco, como bash. */
export function signalTable(): string[] {
  const entries: string[] = NAMES.map((n, i) => `${String(i + 1).padStart(2)}) SIG${n}`);
  for (let n = 34; n <= 64; n++) {
    const name = n === 34 ? "SIGRTMIN" : n === 64 ? "SIGRTMAX" : n <= 49 ? `SIGRTMIN+${n - 34}` : `SIGRTMAX-${64 - n}`;
    entries.push(`${String(n).padStart(2)}) ${name}`);
  }
  const rows: string[] = [];
  for (let i = 0; i < entries.length; i += 5) rows.push(entries.slice(i, i + 5).map((e) => e.padEnd(16)).join("").trimEnd());
  return rows;
}
