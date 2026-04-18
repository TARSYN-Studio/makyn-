import { prisma, OrgRole } from "@makyn/db";

export type PermAction =
  // Org-level
  | "org.read"
  | "org.update"
  | "org.delete"
  | "org.transfer_ownership"
  // Member management
  | "member.invite"
  | "member.remove"
  | "member.change_role"
  | "invitation.revoke"
  | "organization.invite_domain_restriction"
  // Data read
  | "issue.read"
  | "document.read"
  // Data write
  | "issue.create"
  | "issue.update"
  | "issue.delete"
  | "document.upload"
  | "document.delete"
  | "note.create";

// Role → allowed action set. Matches v1.4 spec §7 permission matrix.
// OWNER: everything. ADMIN: everything except delete-org / transfer-owner
// and can't remove/change OWNER role on the owner. MEMBER: data actions
// only, no member management. VIEWER: reads only.
const ALLOW: Record<OrgRole, ReadonlySet<PermAction>> = {
  OWNER: new Set<PermAction>([
    "org.read", "org.update", "org.delete", "org.transfer_ownership",
    "member.invite", "member.remove", "member.change_role",
    "invitation.revoke", "organization.invite_domain_restriction",
    "issue.read", "document.read",
    "issue.create", "issue.update", "issue.delete",
    "document.upload", "document.delete", "note.create"
  ]),
  ADMIN: new Set<PermAction>([
    "org.read", "org.update",
    "member.invite", "member.remove", "member.change_role",
    "invitation.revoke",
    "issue.read", "document.read",
    "issue.create", "issue.update", "issue.delete",
    "document.upload", "document.delete", "note.create"
  ]),
  MEMBER: new Set<PermAction>([
    "org.read",
    "issue.read", "document.read",
    "issue.create", "issue.update", "issue.delete",
    "document.upload", "document.delete", "note.create"
  ]),
  VIEWER: new Set<PermAction>([
    "org.read",
    "issue.read", "document.read"
  ])
};

export class OrgAccessError extends Error {
  constructor(
    public readonly kind: "not_member" | "forbidden" | "org_not_found",
    public readonly orgId: string,
    public readonly userId: string,
    public readonly action: PermAction
  ) {
    super(`${kind}: user=${userId} org=${orgId} action=${action}`);
    this.name = "OrgAccessError";
  }
}

export type OrgAccess = {
  userId: string;
  organizationId: string;
  role: OrgRole;
};

/**
 * Pure predicate — does `role` permit `action`?
 * Use from the UI to render/hide controls; server calls go through
 * `requireOrgAccess` which also verifies the caller is a member.
 */
export function canDo(role: OrgRole, action: PermAction): boolean {
  return ALLOW[role].has(action);
}

/**
 * Server-side gate. Call before every API route handler or server-
 * component data fetch that reads or mutates an organization (or its
 * children: issues, documents, messages).
 *
 * Returns the (userId, orgId, role) triple on success; throws
 * OrgAccessError on forbidden. Callers either let it bubble (→ 403)
 * or catch to render "Not found" for privacy.
 */
export async function requireOrgAccess(
  userId: string,
  organizationId: string,
  action: PermAction
): Promise<OrgAccess> {
  const m = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true, acceptedAt: true }
  });

  if (!m) {
    // Differentiate between "org doesn't exist" and "user isn't a member"
    // only at server-log granularity; to the caller both surface the same
    // way to prevent enumeration.
    const exists = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true }
    });
    throw new OrgAccessError(
      exists ? "not_member" : "org_not_found",
      organizationId,
      userId,
      action
    );
  }

  // Soft-deleted orgs are effectively gone for everyone except a future
  // restore flow (not built in Commit A).
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { deletedAt: true }
  });
  if (org?.deletedAt) {
    throw new OrgAccessError("org_not_found", organizationId, userId, action);
  }

  // Un-accepted invitations (Phase B) shouldn't grant access yet.
  // For Commit A backfilled memberships all have accepted_at = created_at,
  // so this only matters once Invitations ship.
  if (!m.acceptedAt) {
    throw new OrgAccessError("not_member", organizationId, userId, action);
  }

  if (!canDo(m.role, action)) {
    throw new OrgAccessError("forbidden", organizationId, userId, action);
  }

  return { userId, organizationId, role: m.role };
}

/**
 * List orgs the user can see (any role). Use for `/organizations`,
 * dashboard, and any query that must be scoped to the user's
 * accessible set. Filters out soft-deleted orgs.
 *
 * `activeOrgId` implements the v1.4.1 active-org switcher as a one-
 * line filter: when set, we return just [activeOrgId] if the user is
 * a member; otherwise an empty list (permissions layer rejects the
 * query anyway). When null/undefined we return every live org the
 * user belongs to.
 */
export async function listUserOrgIds(
  userId: string,
  opts?: { activeOrgId?: string | null }
): Promise<string[]> {
  const rows = await prisma.membership.findMany({
    where: {
      userId,
      acceptedAt: { not: null },
      organization: { deletedAt: null }
    },
    select: { organizationId: true }
  });
  const allIds = rows.map((r) => r.organizationId);
  if (opts?.activeOrgId) {
    return allIds.includes(opts.activeOrgId) ? [opts.activeOrgId] : [];
  }
  return allIds;
}
