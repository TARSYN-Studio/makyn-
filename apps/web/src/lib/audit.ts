import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { prisma } from "@makyn/db";

export type AuditAction =
  // Organization lifecycle
  | "organization.create" | "organization.update" | "organization.delete"
  | "organization.transfer_ownership"
  | "organization.invite_domain_restriction_changed"
  // Memberships
  | "membership.invite" | "membership.accept"
  | "membership.remove" | "membership.role_change"
  // Invitations (Commit B). Diff carries hashed email + role, never raw.
  | "invitation.create" | "invitation.revoke" | "invitation.accept"
  // Data writes (tier 2)
  | "issue.create" | "issue.update" | "issue.status_change" | "issue.delete"
  | "document.upload" | "document.delete"
  | "note.create";

const SENSITIVE: ReadonlySet<AuditAction> = new Set([
  "organization.delete", "organization.transfer_ownership",
  "membership.invite", "membership.accept",
  "membership.remove", "membership.role_change"
]);

/**
 * SHA-256 of the lowercased, trimmed email. Use before writing an
 * email into an AuditLog diff (spec §12 / PDPL). Raw email never
 * lands in AuditLog.
 */
export function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

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
