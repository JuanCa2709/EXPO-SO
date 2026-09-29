/**
 * `lab`: la guía «Laboratorio práctico · Procesos y sus estados en Debian (Linux) y Windows»
 * dentro de la terminal. La parte A se hace aquí mismo; la B (Windows) se muestra con sus
 * equivalentes en Debian.
 */
import type { OutputLine, Span } from "@/types/terminal";
import { type CommandHandler, line, out, spans } from "./terminalTypes";

const title = (t: string) => line(t, "accent");
const cmd = (c: string, note = ""): OutputLine => spans({ text: "  $ ", tone: "muted" }, { text: c, tone: "prompt" }, ...(note ? [{ text: `   ${note}`, tone: "muted" } as Span] : []));
const text = (t: string) => line(`  ${t}`);
const tip = (t: string) => line(`  » ${t}`, "muted");
const blank = () => line("");

function table(rows: string[][], header = true): OutputLine[] {
  const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => (r[c] ?? "").length)));
  return rows.map((r, i) => line(`  ${r.map((cell, c) => cell.padEnd(widths[c])).join("   ")}`.trimEnd(), header && i === 0 ? "strong" : undefined));
}

const SECTIONS: Record<string, () => OutputLine[]> = {
  a1: () => [
    title("A1. Ver todos los procesos del sistema"),
    blank(),
    cmd("ps aux"),
    blank(),
    text("Identifica las columnas PID, %CPU, %MEM, STAT y COMMAND."),
    text("Elige 3 procesos de la lista y anota su PID, su comando y su estado."),
    tip("La lista es larga: ps aux | head -20   ·   ps aux | grep bash"),
  ],
  a2: () => [
    title("A2. Identificar el estado de un proceso"),
    blank(),
    text("La columna STAT usa letras para el estado (tabla completa: lab estados)."),
    blank(),
    cmd("ps aux | awk '{print $8, $11}' | sort | uniq -c"),
    blank(),
    text("Cuenta cuántos procesos hay en cada estado ahora mismo. Anota el resultado."),
  ],
  a3: () => [
    title("A3. Forzar el estado \"Detenido\" (T) y volverlo a \"Listo\""),
    blank(),
    cmd("sleep 300 &", "lo manda a segundo plano; bash muestra [1] <PID>"),
    cmd("jobs", "número de trabajo"),
    cmd("ps aux | grep sleep", "anota su PID y su estado (S)"),
    cmd("kill -STOP <PID>", "simula el estado Bloqueado/Detenido"),
    cmd("ps aux | grep sleep", "¿qué letra aparece ahora? (T)"),
    cmd("kill -CONT <PID>", "lo reactiva"),
    cmd("ps aux | grep sleep", "volvió a S (o R); al agotar su tiempo termina"),
    blank(),
    ...table([
      ["Paso", "Comando", "Estado resultante"],
      ["1", "sleep 300 &", "S (durmiendo)"],
      ["2", "kill -STOP <PID>", "T (detenido)"],
      ["3", "kill -CONT <PID>", "S/R, y al terminar su tiempo → Done"],
    ]),
    blank(),
    text("Transición completa: Ejecución/Bloqueado → Detenido (T) → Listo/Ejecución → Terminado"),
    tip("Atajos: $! es el PID del último proceso en segundo plano (kill -STOP $!)."),
    tip("En primer plano: sleep 60 y luego Ctrl+Z (T) · fg lo reanuda · Ctrl+C lo termina."),
  ],
  a4: () => [
    title("A4. Padres e hijos"),
    blank(),
    cmd("pstree -p"),
    blank(),
    text("Busca tu terminal (bash) en el árbol. ¿Quién es su padre? ¿Qué hijos tiene?"),
    tip("proceso(PID); ├─ y └─ son hijos; lo que va entre llaves {} son hilos del mismo proceso."),
    blank(),
    text("Crea un hijo explícito:"),
    cmd("bash", "abre un bash hijo"),
    cmd("echo $$", "PID del bash hijo"),
    cmd("echo $PPID", "PID de su padre (la terminal original)"),
    cmd("ps -ef | grep bash", "confírmalo"),
  ],
  a5: () => [
    title("A5. Provocar un proceso huérfano"),
    blank(),
    text("Desde el bash hijo que abriste en A4:"),
    cmd("sleep 600 &", "anota el PID del sleep"),
    cmd("ps -ef | grep <PID>", "su PPID debería ser el bash hijo"),
    blank(),
    text("Ahora mata al bash hijo (el padre del sleep):"),
    cmd("kill -9 <PPID>", "desde la otra terminal de esta página, o aquí con: kill -9 $$"),
    cmd("ps -ef | grep sleep", "el PPID del sleep cambió a 1 (systemd/init): fue adoptado"),
    blank(),
    ...table(
      [
        ["USUARIO", "PID", "PPID", "C", "STIME", "TTY", "TIME", "CMD"],
        ["exposic+", "2745", "1", "0", "19:14", "pts/0", "00:00:00", "sleep 600"],
      ],
      true,
    ),
    tip("Las dos terminales de la página (pts/0 y pts/1) son la misma máquina: ps muestra ambas."),
  ],
  a6: () => [
    title("A6. Inspeccionar el \"PCB\" real de un proceso"),
    blank(),
    cmd("echo $$", "elige un PID activo, por ejemplo el de tu terminal"),
    cmd("cat /proc/<PID>/status | head -20"),
    blank(),
    ...table([
      ["Campo", "Valor del PCB"],
      ["Name", "Identifica qué programa es"],
      ["State", "Estado del proceso"],
      ["Pid", "Identificador (PID)"],
      ["PPid", "Quién es su padre (relación padre-hijo)"],
      ["Uid/Gid", "El usuario dueño"],
      ["VmPeak/VmSize", "Memoria virtual: pico y tamaño actual"],
      ["FDSize", "Descriptores de archivo reservados (archivos abiertos)"],
      ["Threads", "Hilos del proceso (más abajo: cat /proc/<PID>/status)"],
    ]),
    blank(),
    text("Compáralos con los 8 campos del PCB: PID, estado, contador de programa, registros,"),
    text("prioridad, memoria, archivos abiertos, tiempo de CPU. ¿Cuáles no aparecen? (lab preguntas)"),
  ],
  zombi: () => [
    title("Proceso zombi (objetivo del laboratorio)"),
    blank(),
    text("Un zombi es un hijo que terminó pero cuyo padre todavía no lo recogió con wait()."),
    cmd("cd ~/laboratorio", "la carpeta del laboratorio"),
    cmd("cat zombie.c", "el programa en C"),
    cmd("./zombie &", "el hijo termina enseguida; el padre duerme 60 s sin wait()"),
    cmd("ps aux | grep zombie", "el hijo aparece como Z y [zombie] <defunct>"),
    cmd("kill -9 <PID_del_zombi>", "no pasa nada: un zombi ya terminó"),
    cmd("kill <PID_del_padre>", "al morir el padre, init adopta al zombi y lo recoge"),
  ],
  b: () => [
    title("Parte B — Windows (se hace en Windows; aquí, sus equivalentes en Debian)"),
    blank(),
    ...table([
      ["Ejercicio", "En Windows", "En esta terminal"],
      ["B1 Administrador de tareas", "Ctrl+Shift+Esc → Detalles (PID, Estado)", "top · htop"],
      ["B2 Procesos por consola", "tasklist /v · Get-Process | Sort-Object CPU", "ps aux · top"],
      ["B3 Padre e hijo", "Get-CimInstance Win32_Process (ParentProcessId)", "ps -ef · pstree -p"],
      ["B4 Terminar un proceso", "taskkill /PID <PID> /F", "kill -9 <PID>"],
      ["B5 Planificación en acción", "Administrador → Rendimiento + Alt+Tab", "top (cambios de contexto)"],
    ]),
    blank(),
    tip("Comandos de Windows escritos aquí responden como en bash: command not found."),
  ],
  comparar: () => [
    title("Comparación de comandos"),
    blank(),
    ...table([
      ["Tarea", "Debian (Linux)", "Windows"],
      ["Listar todos los procesos", "ps aux", "tasklist / Get-Process"],
      ["Ver árbol padre-hijo", "pstree -p", "Get-CimInstance Win32_Process"],
      ["Terminar un proceso", "kill -9 <PID>", "taskkill /PID <PID> /F"],
      ["Pausar / reanudar", "kill -STOP / kill -CONT", "Process Explorer → Suspend"],
      ["Detalle de un proceso", "cat /proc/<PID>/status", "Administrador de tareas → Detalles"],
      ["Monitor en tiempo real", "top / htop", "Administrador de tareas → Rendimiento"],
    ]),
  ],
  estados: () => [
    title("Estados de la columna STAT"),
    blank(),
    ...table([
      ["Letra", "Estado", "Relación con lo visto en clase"],
      ["R", "En ejecución o listo para ejecutar", "Ejecución / Listo"],
      ["S", "Durmiendo, esperando un evento", "Bloqueado"],
      ["D", "Espera de E/S no interrumpible (disco)", "Bloqueado"],
      ["T", "Detenido (stopped) o rastreado", "Pausado manualmente"],
      ["Z", "Zombi: terminó pero el padre no lo recogió", "Terminado (a medias)"],
      ["I", "Hilo del kernel inactivo (idle)", "Bloqueado"],
    ]),
    blank(),
    ...table([
      ["Modificador", "Significado"],
      ["<", "Prioridad alta (high-priority)"],
      ["N", "Prioridad baja (low-priority, nice positivo)"],
      ["s", "Es líder de sesión"],
      ["l", "Es multihilo (tiene varias hebras)"],
      ["+", "Está en el grupo de primer plano de su terminal"],
    ]),
  ],
  preguntas: () => [
    title("Preguntas del laboratorio"),
    blank(),
    text("A6. ¿Qué campos del PCB visto en clase encontraste en /proc/<PID>/status, y cuáles no"),
    text("    aparecen ahí (por ejemplo, los registros de CPU)? ¿Por qué no se exponen al usuario?"),
    text("B5. ¿Notas picos de uso de CPU al cambiar de ventana? ¿A qué se deben (cambio de contexto)?"),
    blank(),
    line("  Preguntas de cierre (para entregar)", "strong"),
    text("1. En A3, ¿qué comando simula Ejecución → Bloqueado, y cuál Bloqueado → Listo?"),
    text("2. ¿Por qué Windows no expone el PPID tan fácilmente como Linux?"),
    text("3. Si mataras explorer.exe, ¿qué pasaría con las ventanas que dependen de él?"),
    text("   Relaciónalo con los procesos huérfanos en Linux."),
    text("4. Elige un proceso de los que observaste: su PID, su padre, su estado y sus recursos"),
    text("   (memoria, hilos)."),
  ],
};

const INDEX = (): OutputLine[] => [
  title("Laboratorio práctico · Procesos y sus estados en Debian (Linux) y Windows"),
  blank(),
  line("  Parte A — Debian (Linux): se hace en esta terminal", "strong"),
  ...[
    ["a1", "Ver todos los procesos del sistema", "ps aux"],
    ["a2", "Identificar el estado de un proceso", "ps aux | awk … | sort | uniq -c"],
    ["a3", "Forzar el estado Detenido (T) y volver", "sleep 300 & · kill -STOP / -CONT"],
    ["a4", "Padres e hijos", "pstree -p · bash · echo $$ $PPID"],
    ["a5", "Provocar un proceso huérfano", "sleep 600 & · kill -9"],
    ["a6", "Inspeccionar el PCB real de un proceso", "cat /proc/<PID>/status | head -20"],
    ["zombi", "Provocar un proceso zombi", "./zombie &"],
  ].map(([id, what, how]) => spans({ text: `  lab ${id.padEnd(10)}`, tone: "prompt" }, { text: what.padEnd(42) }, { text: how, tone: "muted" })),
  blank(),
  line("  Parte B — Windows", "strong"),
  ...[
    ["b", "Ejercicios B1–B5 y sus equivalentes en Debian"],
    ["comparar", "Tabla de comandos Debian ↔ Windows"],
    ["estados", "Letras de la columna STAT"],
    ["preguntas", "Preguntas de cierre"],
  ].map(([id, what]) => spans({ text: `  lab ${id.padEnd(10)}`, tone: "prompt" }, { text: what })),
];

export const lab: CommandHandler = (args) => {
  const key = (args[0] ?? "").toLowerCase().replace(/^zombie$/, "zombi");
  if (!key) return out(...INDEX());
  const section = SECTIONS[key];
  return section ? out(...section()) : out(line(`lab: sección desconocida '${args[0]}'`, "error"), line("Escribe lab para ver el índice."));
};

export const LAB_SECTIONS = Object.keys(SECTIONS);

/** Comandos de Windows del laboratorio → su equivalente en Debian. */
export const WINDOWS_EQUIVALENTS: Record<string, string> = {
  tasklist: "ps aux",
  "get-process": "ps aux",
  "get-ciminstance": "pstree -p   (o ps -ef)",
  taskkill: "kill -9 <PID>",
  taskmgr: "top   (o htop)",
  "taskmgr.exe": "top   (o htop)",
  "notepad.exe": "sleep 300 &   (un proceso de prueba)",
  notepad: "sleep 300 &   (un proceso de prueba)",
  "explorer.exe": "pstree -p   (gnome-shell cumple ese papel)",
  "powershell.exe": "bash",
  powershell: "bash",
  "cmd.exe": "bash",
  cmd: "bash",
  "select-object": "awk '{print $2, $11}'",
  "sort-object": "sort",
};
