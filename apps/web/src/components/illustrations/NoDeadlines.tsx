export function NoDeadlines({ className = "h-[120px] w-[120px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      stroke="var(--text-dim)"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Calendar body */}
      <rect x="24" y="32" width="72" height="60" rx="3" />
      {/* Header strip */}
      <path d="M24 48 L96 48" />
      {/* Binder rings */}
      <path d="M40 28 L40 38" />
      <path d="M80 28 L80 38" />
      {/* Horizontal dash (empty/none) */}
      <path d="M48 72 L72 72" strokeWidth="1.75" />
    </svg>
  );
}
