export function NoCompanies({ className = "h-[120px] w-[120px]" }: { className?: string }) {
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
      {/* Building outline */}
      <rect x="28" y="32" width="48" height="60" rx="2" />
      {/* Windows — two columns of three */}
      <rect x="36" y="42" width="8" height="8" rx="1" />
      <rect x="52" y="42" width="8" height="8" rx="1" />
      <rect x="36" y="56" width="8" height="8" rx="1" />
      <rect x="52" y="56" width="8" height="8" rx="1" />
      <rect x="36" y="70" width="8" height="8" rx="1" />
      <rect x="52" y="70" width="8" height="8" rx="1" />
      {/* Door */}
      <path d="M44 92 L44 82 L60 82 L60 92" />
      {/* Plus mark (add) */}
      <circle cx="86" cy="42" r="10" />
      <path d="M86 36 L86 48 M80 42 L92 42" />
    </svg>
  );
}
