export function LogoMark({
  className = "h-5 w-5",
  title = "MAKYN"
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      aria-label={title}
      role="img"
    >
      <rect x="13" y="13" width="16" height="74" />
      <rect x="71" y="13" width="16" height="74" />
      <polygon points="13,13 29,13 50,50 42,58" />
      <polygon points="71,13 87,13 58,58 50,50" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span
        className="text-[16px] font-bold text-[var(--text)]"
        style={{ letterSpacing: "0.1em" }}
      >
        MAKYN
      </span>
      <span
        className="text-[10px] font-normal text-[var(--text-dim)] mt-0.5"
        style={{ letterSpacing: "0.06em" }}
      >
        by Tarsyn AI
      </span>
    </span>
  );
}
