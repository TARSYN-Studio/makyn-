"use server";

import { prisma, type OrgRole } from "@makyn/db";
import { revalidatePath } from "next/cache";

import { hashEmail, writeAudit } from "@/lib/audit";
import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

type ActionResult = { ok: true } | { ok: false; error: string };

const ASSIGNABLE_ROLES: ReadonlySet<OrgRole> = new Set(["ADMIN", "MEMBER", "VIEWER"]);

export async function changeRoleAction(
  orgId: string,
  targetUserId: string,
  newRole: string
): Promise<ActionResult> {
  const user = await requireUser();

  try {
    await requireOrgAccess(user.id, orgId, "member.change_role");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return { ok: false, error: err.kind === "forbidden" ? "forbidden" : "not_found" };
    }
    throw err;
  }

  if (!ASSIGNABLE_ROLES.has(newRole as OrgRole)) {
    return { ok: false, error: "invalid_role" };
  }

  const target = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    select: { id: true, role: true, acceptedAt: true }
  });
  if (!target || !target.acceptedAt) return { ok: false, error: "member_not_found" };
  if (target.role === "OWNER") return { ok: false, error: "cannot_change_owner_role" };

  const updated = await prisma.membership.update({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    data: { role: newRole as OrgRole },
    select: { id: true, role: true }
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId: orgId,
    entityType: "membership",
    entityId: updated.id,
    action: "membership.role_change"
  });

  revalidatePath(`/organizations/${orgId}/settings/team`);
  return { ok: true };
}

export async function revokeInvitationAction(
  orgId: string,
  invitationId: string
): Promise<ActionResult> {
  const user = await requireUser();

  try {
    await requireOrgAccess(user.id, orgId, "invitation.revoke");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return { ok: false, error: err.kind === "forbidden" ? "forbidden" : "not_found" };
    }
    throw err;
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, organizationId: orgId },
    select: { id: true, email: true, role: true, acceptedAt: true, revokedAt: true }
  });
  if (!invitation) return { ok: false, error: "invitation_not_found" };
  if (invitation.acceptedAt) return { ok: false, error: "already_accepted" };
  if (invitation.revokedAt) {
    revalidatePath(`/organizations/${orgId}/settings/team`);
    return { ok: true };
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { revokedAt: new Date(), revokedByUserId: user.id }
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId: orgId,
    entityType: "invitation",
    entityId: invitationId,
    action: "invitation.revoke",
    after: { emailHash: hashEmail(invitation.email), role: invitation.role }
  });

  revalidatePath(`/organizations/${orgId}/settings/team`);
  return { ok: true };
}

export async function removeMemberAction(
  orgId: string,
  targetUserId: string
): Promise<ActionResult> {
  const user = await requireUser();

  try {
    await requireOrgAccess(user.id, orgId, "member.remove");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return { ok: false, error: err.kind === "forbidden" ? "forbidden" : "not_found" };
    }
    throw err;
  }

  const target = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    select: { id: true, role: true, acceptedAt: true }
  });
  if (!target || !target.acceptedAt) return { ok: false, error: "member_not_found" };
  if (target.role === "OWNER") return { ok: false, error: "cannot_remove_owner" };

  await prisma.membership.delete({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } }
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId: orgId,
    entityType: "membership",
    entityId: target.id,
    action: "membership.remove"
  });

  revalidatePath(`/organizations/${orgId}/settings/team`);
  return { ok: true };
}
