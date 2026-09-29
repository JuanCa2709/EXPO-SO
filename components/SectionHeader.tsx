import { Reveal } from "./Reveal";

interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  id?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Cabecera editorial: índice numérico, línea de 1px, rótulo y titular. */
export function SectionHeader({ index, eyebrow, title, id, children, className }: SectionHeaderProps) {
  return (
    <Reveal as="header" className={className}>
      <p className="label flex items-center gap-3 text-ink-3">
        <span className="text-ink-2 tabular-nums">{index}</span>
        <span aria-hidden className="h-px w-8 bg-ink-3/40" />
        <span>{eyebrow}</span>
      </p>
      <h2 id={id} className="h2 mt-6 text-balance">
        {title}
      </h2>
      {children && <div className="body mt-6 max-w-[34rem] space-y-4">{children}</div>}
    </Reveal>
  );
}
