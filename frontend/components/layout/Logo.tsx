// Монограмма — квадратная hairline-рамка (без скруглений, docs/DESIGN.md)
// с буквой по "The Letter System" вместо отдельно нарисованной иконки.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-10 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="0.75" y="0.75" width="30.5" height="30.5" fill="none" stroke="currentColor" strokeWidth={1.5} />
        <text
          x="50%"
          y="53%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="currentColor"
          className="font-gp"
          fontWeight={400}
          fontSize={18}
        >
          C
        </text>
      </svg>
      <span className="font-gp text-subheading tracking-subheading">Cozy Home</span>
    </span>
  );
}
