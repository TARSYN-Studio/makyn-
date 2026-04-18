import { headers } from "next/headers";

import { prisma } from "@makyn/db";

export type AuditAction =
  // Organization lifecycle
  | "organization.create" | "organization.update" | "organization.delete"
  | "organization.transfer_ownership"
  // Memberships
  | "membership.invite" | "membership.accept"
  | "membership.remove" | "membership.role_change"
  // Data writes (tier 2)
  | "issue.create" | "issue.update" | "issue.status_change" | "issue.delete"
  | "document.upload" | "document.delete"
  | "note.create";

const SENSITIVE: ReadonlySet<AuditAction> = new Set([
  "organization.delete", "organization.transfer_ownership",
  "membership.invite", "membership.accept",
  "membership.remove", "membership.role_change"
]);

type AuditInput = {
  actorUserId: string | null;
  organizationId: string | null;
  entityType: string;
  entityId?: string | null;
  action: AuditAction;
  /** {before, after} for writes. Ignored for sensitive-only events. */
  before?: unknown;
  after?: unknown;
};

/**
 * Write one audit row. Never throws — audit failure must not break the
 * user's primary action. If the DB write fails we console.error and
 * continue (operator will notice via alerting once wired).
 *
 * `diff` is {before, after} for data writes, null for sensitive events
 * per spec. This matches Tier-2 in the scope decision Mohammed picked.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    const userAgent = h.get("user-agent") ?? null;

    const diff = SENSITIVE.has(input.action)
      ? null
      : { before: input.before ?? null, after: input.after ?? null };

    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        organizationId: input.organizationId,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        action: input.action,
        diff: diff as never,
        ip,
        userAgent
      }
    });
  } catch (err) {
    console.error("[audit] write failed", {
      action: input.action,
      organizationId: input.organizationId,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
