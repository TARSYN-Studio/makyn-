"use server";

import { prisma, type OrgRole } from "@makyn/db";
import { defaultInvitationExpiry, generateInvitationToken } from "@makyn/core/email";
import { revalidatePath } from "next/cache";

import { hashEmail, writeAudit } from "@/lib/audit";
import { getEmailService } from "@/lib/email";
import { env } from "@/lib/env";
import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

type ActionResult = { ok: true } | { ok: false; error: string };

export type InviteResult =
  | { ok: true; id: string; email: string }
  | { ok: false; error: "domain_not_allowed"; allowed: string[] }
  | {
      ok: false;
      error:
        | "invalid_email"
        | "invalid_role"
        | "already_member"
        | "forbidden"
        | "not_found"
        | "org_not_found"
        | "generic";
    };

const ASSIGNABLE_ROLES: ReadonlySet<OrgRole> = new Set(["ADMIN", "MEMBER", "VIEWER"]);
const INVITABLE_ROLES: ReadonlySet<OrgRole> = new Set(["ADMIN", "MEMBER", "VIEWER"]);

function normalizeDomain(raw: string): string | null {
  const d = raw.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d)) {
    return null;
  }
  return d;
}

function normalizeEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return null;
  return v;
}

function matchesDomainAllowlist(email: string, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return allowed.some((d) => d.toLowerCase() === domain);
}

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

export async function updateInvitationSettingsAction(
  orgId: string,
  allowedDomains: string[]
): Promise<ActionResult> {
  const user = await requireUser();

  try {
    await requireOrgAccess(user.id, orgId, "organization.invite_domain_restriction");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return { ok: false, error: err.kind === "forbidden" ? "forbidden" : "not_found" };
    }
    throw err;
  }

  const domains: string[] = [];
  for (const item of allowedDomains) {
    const d = normalizeDomain(item);
    if (!d) return { ok: false, error: "invalid_domain" };
    if (!domains.includes(d)) domains.push(d);
  }

  const before = await prisma.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    select: { inviteDomainRestriction: true }
  });
  if (!before) return { ok: false, error: "org_not_found" };

  await prisma.organization.update({
    where: { id: orgId },
    data: { inviteDomainRestriction: domains }
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId: orgId,
    entityType: "organization",
    entityId: orgId,
    action: "organization.invite_domain_restriction_changed",
    before: { allowedDomains: before.inviteDomainRestriction },
    after: { allowedDomains: domains }
  });

  revalidatePath(`/organizations/${orgId}/settings/team`);
  return { ok: true };
}

export async function inviteMemberAction(
  orgId: string,
  emailRaw: string,
  role: string
): Promise<InviteResult> {
  const user = await requireUser();

  try {
    await requireOrgAccess(user.id, orgId, "member.invite");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      return { ok: false, error: err.kind === "forbidden" ? "forbidden" : "not_found" };
    }
    throw err;
  }

  const email = normalizeEmail(emailRaw);
  if (!email) return { ok: false, error: "invalid_email" };

  if (!INVITABLE_ROLES.has(role as OrgRole)) {
    return { ok: false, error: "invalid_role" };
  }

  const org = await prisma.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    select: {
      id: true,
      legalNameAr: true,
      legalNameEn: true,
      inviteDomainRestriction: true
    }
  });
  if (!org) return { ok: false, error: "org_not_found" };

  if (!matchesDomainAllowlist(email, org.inviteDomainRestriction)) {
    return {
      ok: false,
      error: "domain_not_allowed",
      allowed: org.inviteDomainRestriction
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId: existingUser.id, organizationId: orgId }
      },
      select: { acceptedAt: true }
    });
    if (existingMembership?.acceptedAt) {
      return { ok: false, error: "already_member" };
    }
  }

  const now = new Date();
  const token = generateInvitationToken();
  const expiresAt = defaultInvitationExpiry(now);

  const invitation = await prisma.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: {
        organizationId: orgId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now }
      },
      data: { revokedAt: now, revokedByUserId: user.id }
    });
    return tx.invitation.create({
      data: {
        organizationId: orgId,
        email,
        role: role as OrgRole,
        token,
        invitedByUserId: user.id,
        expiresAt
      },
      select: { id: true, email: true, role: true, expiresAt: true }
    });
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId: orgId,
    entityType: "invitation",
    entityId: invitation.id,
    action: "invitation.create",
    after: { emailHash: hashEmail(email), role: invitation.role }
  });

  try {
    const emailService = getEmailService();
    const acceptUrl = `${env.APP_URL}/invitations/accept/${token}`;
    const inviterName = user.fullName || user.email || "MAKYN";
    const inviterEmail = user.email || "no-reply@makyn.site";
    const locale: "ar" | "en" = user.preferredLanguage === "ar" ? "ar" : "en";
    const organizationName =
      (locale === "ar" ? org.legalNameAr : org.legalNameEn) ||
      org.legalNameAr ||
      "MAKYN";
    await emailService.sendInvitation({
      to: email,
      organizationName,
      inviterName,
      inviterEmail,
      role: invitation.role as Exclude<OrgRole, "OWNER">,
      acceptUrl,
      locale,
      expiresAt
    });
  } catch (err) {
    console.error("[team.invite] email send failed", {
      invitationId: invitation.id,
      error: err instanceof Error ? err.message : String(err)
    });
  }

  revalidatePath(`/organizations/${orgId}/settings/team`);
  return { ok: true, id: invitation.id, email: invitation.email };
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
