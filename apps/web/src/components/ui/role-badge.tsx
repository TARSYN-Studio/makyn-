import { Badge } from "@/components/ui/badge";
import { t, type Lang } from "@/lib/i18n";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

/**
 * Role pill used in org-scoped page headers and the members table.
 * OWNER renders nothing — seeing "Owner" on your own org is noise.
 *
 * Tones follow the desaturated brand palette — no saturated colour:
 *   ADMIN  → signal tint + signal rule (the only accent colour)
 *   MEMBER → paper-low + stone rule (neutral)
 *   VIEWER → ink-40 outline, transparent fill (the quietest role)
 *
 * The underlying Badge handles locale-aware typography (EN uppercase
 * tracked / AR sentence-case semibold) — nothing to do here.
 */
export function RoleBadge({ role, lang }: { role: Role; lang: Lang }) {
  if (role === "OWNER") return null;
  const label = t(`team.role.${role}`, lang);
  if (role === "ADMIN") return <Badge variant="signal">{label}</Badge>;
  if (role === "MEMBER") return <Badge variant="neutral">{label}</Badge>;
  // VIEWER — lightest weight, outline only.
  return (
    <Badge className="bg-transparent border border-[var(--ink-40)] border-s-2 border-s-[var(--ink-40)] text-[var(--ink-60)]">
      {label}
    </Badge>
  );
}
