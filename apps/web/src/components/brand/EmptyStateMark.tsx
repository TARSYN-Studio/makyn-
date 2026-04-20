// MK-01 inspired empty-state mark. Static (no rotation — the site uses a
// 120s spin for marketing; in-app we honour the no-infinite-motion rule).
// Circle border in ink-40 so it recedes; centre signal-blue square anchors.

export function EmptyStateMark({ size = 96 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
      className="block"
    >
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="var(--ink-40)"
        strokeWidth="0.5"
      />
      <circle
        cx="50"
        cy="50"
        r="30"
        fill="none"
        stroke="var(--ink-40)"
        strokeWidth="0.5"
      />
      <line x1="50" y1="2" x2="50" y2="98" stroke="var(--ink-40)" strokeWidth="0.25" />
      <line x1="2" y1="50" x2="98" y2="50" stroke="var(--ink-40)" strokeWidth="0.25" />
      <rect x="46" y="46" width="8" height="8" fill="var(--signal)" />
    </svg>
  );
}
