"use client";

type Status = "healthy" | "attention" | "overdue" | "neutral";

export function StatusDot({
  status,
  size = 8,
  pulse
}: {
  status: Status;
  size?: number;
  pulse?: boolean;
}) {
  const color =
    status === "overdue"
      ? "var(--state-overdue)"
      : status === "attention"
        ? "var(--state-pending)"
        : status === "healthy"
          ? "var(--state-resolved)"
          : "var(--ink-40)";
  const shouldPulse = pulse ?? (status === "overdue" || status === "attention");
  return (
    <span className="inline-flex relative" style={{ width: size, height: size }}>
      {shouldPulse && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: color,
            animation: "breath 2400ms ease-in-out infinite"
          }}
        />
      )}
      <span
        className="relative rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  );
}
