import { Badge } from "@/components/ui/badge";
import { t, type Lang } from "@/lib/i18n";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

/**
 * Renders the caller's role relative to the current org context.
 * OWNER renders nothing — seeing "Owner" on your own org is noise.
 * Tones mirror the members-table RoleChip so header + inline visuals
 * stay consistent.
 */
export function RoleBadge({ role, lang }: { role: Role; lang: Lang }) {
  if (role === "OWNER") return null;
  const label = t(`team.role.${role}`, lang);
  if (role === "ADMIN") return <Badge variant="navy">{label}</Badge>;
  if (role === "MEMBER") return <Badge variant="neutral">{label}</Badge>;
  return (
    <Badge className="bg-transparent border border-[var(--border)] text-[var(--text-dim)]">
      {label}
    </Badge>
  );
}
