/** `pstree`: árbol de procesos con los hilos entre llaves, como en psmisc (UTF-8). */
import type { ProcView } from "./processView";

/** Nombres de hilo plausibles: GLib nombra así los suyos; algunos servicios usan los propios. */
const THREAD_NAMES: Record<string, string[]> = {
  VBoxService: ["RTThrdPP", "control", "timesync", "vminfo", "cpuhotplug", "memballoon", "vmstats", "automount"],
  node: ["node", "node", "node", "node", "libuv-worker", "libuv-worker", "libuv-worker", "libuv-worker", "node", "node"],
  "gnome-shell": ["gmain", "gdbus", "pool-spawner", "dconf worker", "gnome-shell:cs0", "gnome-s:disk$0", "gnome-shell:sh0", "JS Helper", "JS Helper", "KMS thread", "pool-0"],
  pipewire: ["pipewire", "data-loop.0"],
  "pipewire-pulse": ["pipewire-pulse", "data-loop.0"],
  wireplumber: ["gmain", "wireplumber", "data-loop.0", "gdbus"],
  VBoxClient: ["RTThrdPP", "SHCLX11"],
  "systemd-timesyn": ["sd-resolve"],
};
const GLIB = ["gmain", "gdbus", "pool-spawner", "dconf worker", "pool-0", "pool-1"];

const threadName = (p: ProcView, i: number) => (THREAD_NAMES[p.comm] ?? GLIB)[i % (THREAD_NAMES[p.comm] ?? GLIB).length];

interface Node {
  label: string;
  sort: string;
  children: Node[];
}

function build(p: ProcView, byParent: Map<number, ProcView[]>, showPids: boolean): Node {
  const kids = (byParent.get(p.pid) ?? []).map((c) => build(c, byParent, showPids));
  const threads = p.tids.map((tid, i) => {
    const name = `{${threadName(p, i)}}`;
    return { label: showPids ? `${name}(${tid})` : name, sort: name, children: [] };
  });
  const children = [...kids, ...threads].sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));
  return { label: showPids ? `${p.comm}(${p.pid})` : p.comm, sort: p.comm, children: showPids ? children : compact(children) };
}

/** Sin -p, los hermanos idénticos sin hijos se agrupan: 3*[{gmain}]. */
function compact(children: Node[]): Node[] {
  const out: Node[] = [];
  for (const c of children) {
    const prev = out[out.length - 1];
    if (prev && !c.children.length && !prev.children.length && prev.sort === c.sort) {
      const n = Number(prev.label.match(/^(\d+)\*\[/)?.[1] ?? 1) + 1;
      prev.label = `${n}*[${c.label}]`;
    } else out.push({ ...c });
  }
  return out;
}

function draw(n: Node): string[] {
  if (!n.children.length) return [n.label];
  const pad = " ".repeat([...n.label].length);
  const out: string[] = [];
  const single = n.children.length === 1;
  n.children.forEach((child, i) => {
    const first = i === 0;
    const last = i === n.children.length - 1;
    const connector = single ? "───" : first ? "─┬─" : last ? " └─" : " ├─";
    const cont = single || last ? "   " : " │ ";
    draw(child).forEach((l, j) => out.push(j === 0 ? (first ? n.label : pad) + connector + l : pad + cont + l));
  });
  return out;
}

export function pstree(procs: ProcView[], root: number, showPids: boolean): string[] | null {
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const start = byPid.get(root);
  if (!start) return null;
  const byParent = new Map<number, ProcView[]>();
  for (const p of procs) byParent.set(p.ppid, [...(byParent.get(p.ppid) ?? []), p]);
  return draw(build(start, byParent, showPids));
}
