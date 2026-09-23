// Иконка домика + название шрифтом Playfair Display (docs/DESIGN.md).
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-8 ${className}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-heading text-heading-sm text-ink">Cozy Home</span>
    </span>
  );
}
