/**
 * /proc/<PID>/status: la parte del PCB que Linux expone al usuario (kernel 6.12).
 * Los registros de CPU y el contador de programa no aparecen: solo los ve el kernel.
 */
import type { Proc } from "./machine";

const STATE_NAMES: Record<string, string> = {
  R: "R (running)",
  S: "S (sleeping)",
  D: "D (disk sleep)",
  T: "T (stopped)",
  Z: "Z (zombie)",
  I: "I (idle)",
};

const kb = (n: number) => `${String(n).padStart(8)} kB`;

/** Valores deterministas por PID (no cambian entre lecturas del mismo proceso). */
const seeded = (pid: number, salt: number, max: number) => ((pid * 2654435761 + salt * 40503) >>> 0) % max;

export function procStatus(p: Proc): string {
  const root = p.user === "root";
  const id = root ? "0" : "1000";
  const zombie = p.state === "Z";
  const vsz = p.vsz;
  const rss = p.rss;
  const lines: [string, string][] = [
    ["Name", p.comm],
    ["Umask", root ? "0022" : "0002"],
    ["State", STATE_NAMES[p.state] ?? STATE_NAMES.S],
    ["Tgid", String(p.pid)],
    ["Ngid", "0"],
    ["Pid", String(p.pid)],
    ["PPid", String(p.ppid)],
    ["TracerPid", "0"],
    ["Uid", `${id}\t${id}\t${id}\t${id}`],
    ["Gid", `${id}\t${id}\t${id}\t${id}`],
    ["FDSize", p.kernel || zombie ? "0" : p.threads > 3 ? "256" : "64"],
    ["Groups", root ? "" : "27 44 46 100 1000 "],
    ["NStgid", String(p.pid)],
    ["NSpid", String(p.pid)],
    ["NSpgid", String(p.pid)],
    ["NSsid", String(p.pid)],
  ];
  if (!p.kernel && !zombie) {
    lines.push(
      ["VmPeak", kb(vsz + 132)],
      ["VmSize", kb(vsz)],
      ["VmLck", kb(0)],
      ["VmPin", kb(0)],
      ["VmHWM", kb(rss)],
      ["VmRSS", kb(rss)],
      ["RssAnon", kb(Math.round(rss * 0.33))],
      ["RssFile", kb(Math.round(rss * 0.67))],
      ["RssShmem", kb(0)],
      ["VmData", kb(Math.round(vsz * 0.15))],
      ["VmStk", kb(132)],
      ["VmExe", kb(p.comm === "bash" ? 892 : 24)],
      ["VmLib", kb(1920)],
      ["VmPTE", kb(56)],
      ["VmSwap", kb(0)],
      ["HugetlbPages", kb(0)],
    );
  }
  lines.push(
    ["CoreDumping", "0"],
    ["THP_enabled", "1"],
    ["untag_mask", "0xffffffffffffffff"],
    ["Threads", String(p.threads)],
    ["SigQ", "0/15187"],
    ["SigPnd", "0000000000000000"],
    ["ShdPnd", "0000000000000000"],
    ["SigBlk", p.comm === "bash" ? "0000000000010000" : "0000000000000000"],
    ["SigIgn", p.comm === "bash" ? "0000000000384004" : "0000000000001000"],
    ["SigCgt", p.comm === "bash" ? "000000004b813efb" : "0000000000000000"],
    ["CapInh", "0000000000000000"],
    ["CapPrm", root ? "000001ffffffffff" : "0000000000000000"],
    ["CapEff", root ? "000001ffffffffff" : "0000000000000000"],
    ["CapBnd", "000001ffffffffff"],
    ["CapAmb", "0000000000000000"],
    ["NoNewPrivs", "0"],
    ["Seccomp", "0"],
    ["Seccomp_filters", "0"],
    ["Speculation_Store_Bypass", "thread vulnerable"],
    ["SpeculationIndirectBranch", "conditional enabled"],
    ["Cpus_allowed", "3"],
    ["Cpus_allowed_list", "0-1"],
    ["Mems_allowed", "00000000,00000001"],
    ["Mems_allowed_list", "0"],
    ["voluntary_ctxt_switches", String(40 + seeded(p.pid, 1, 9000))],
    ["nonvoluntary_ctxt_switches", String(seeded(p.pid, 2, 400))],
  );
  return lines.map(([k, v]) => `${k}:\t${v}`).join("\n");
}
