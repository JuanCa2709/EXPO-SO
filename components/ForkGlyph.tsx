/** Glifo técnico del tenedor (mismos trazos que /public/icons/fork.svg), centrado en el origen. */
export function ForkGlyph({
  size = 34,
  rotation = 0,
  strokeWidth = 1.5,
}: {
  size?: number;
  rotation?: number;
  strokeWidth?: number;
}) {
  const scale = size / 64;
  return (
    <g
      transform={`rotate(${rotation}) scale(${scale}) translate(-16 -32)`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth / scale}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 4v16M16 4v16M22 4v16" />
      <path d="M10 20c0 6 2.4 9.2 6 10.2 3.6-1 6-4.2 6-10.2" />
      <path d="M16 30.2V60" />
    </g>
  );
}
