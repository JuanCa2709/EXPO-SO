const TOKEN = /(\/\/.*$)|\b(wait|signal)\b|\b(if|else|semaforo|min|max)\b|(\d+)/g;

function highlight(line: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(line.slice(last, i));
    const cls = m[1] ? "text-ink-3" : m[2] ? "text-blue-2" : m[3] ? "text-ink" : "text-blue-2/80";
    parts.push(
      <span key={i} className={cls}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

/** Pseudocódigo con numeración de línea y resaltado mínimo. */
export function CodeBlock({ lines, label }: { lines: string[]; label: string }) {
  return (
    <figure className="hairline bg-bg-1/80">
      <figcaption className="label hairline-b flex justify-between px-4 py-2.5 text-ink-3">
        <span>{label}</span>
        <span>pseudocódigo</span>
      </figcaption>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-[1.75] text-ink-2">
        <code>
          {lines.map((line, i) => (
            <span key={i} className="block">
              <span aria-hidden className="mr-4 inline-block w-4 select-none text-right text-ink-3/50">
                {i + 1}
              </span>
              {highlight(line)}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
