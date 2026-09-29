import { COLORS } from "@/lib/constants";
import type { IndicatorState } from "@/lib/types";

const META: Record<IndicatorState, { label: string; color: string; hollow: boolean; dashed?: boolean }> = {
  idle: { label: "Idle", color: COLORS.ink3, hollow: true },
  running: { label: "Running", color: COLORS.blue, hollow: false },
  waiting: { label: "Waiting", color: COLORS.blue2, hollow: true, dashed: true },
  resolved: { label: "Resolved", color: COLORS.blue2, hollow: false },
  deadlock: { label: "Deadlock detected", color: COLORS.red, hollow: false },
};

interface StatusIndicatorProps {
  state: IndicatorState;
  label?: string;
  className?: string;
  /** Solo el punto, sin rótulo visible. */
  dotOnly?: boolean;
}

export function StatusIndicator({ state, label, className = "", dotOnly = false }: StatusIndicatorProps) {
  const m = META[state];
  const text = label ?? m.label;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0">
        {(state === "running" || state === "deadlock") && (
          <circle cx="6" cy="6" r="5.5" fill={m.color} opacity={0.18} />
        )}
        <circle
          cx="6"
          cy="6"
          r={m.hollow ? 3.6 : 3}
          fill={m.hollow ? "none" : m.color}
          stroke={m.color}
          strokeWidth={m.hollow ? 1.2 : 0}
          strokeDasharray={m.dashed ? "2 1.6" : undefined}
        />
        {state === "resolved" && <circle cx="6" cy="6" r="5.4" fill="none" stroke={m.color} strokeOpacity={0.5} />}
      </svg>
      {dotOnly ? (
        <span className="sr-only">{text}</span>
      ) : (
        <span className="label" style={{ color: state === "idle" ? undefined : m.color }}>
          {text}
        </span>
      )}
    </span>
  );
}
