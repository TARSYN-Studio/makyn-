export function NoIssues({ className = "h-[120px] w-[120px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      stroke="var(--ink-40)"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Envelope outline */}
      <rect x="24" y="38" width="60" height="44" rx="3" />
      <path d="M24 42 L54 64 L84 42" />
      {/* Check mark circle */}
      <circle cx="92" cy="78" r="14" />
      <path d="M86 78 L90 82 L98 74" />
    </svg>
  );
}
