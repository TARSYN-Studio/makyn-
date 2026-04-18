import { prisma, type OrgRole } from "@makyn/db";
import { defaultInvitationExpiry, generateInvitationToken } from "@makyn/core/email";
import { NextRequest, NextResponse } from "next/server";

import { hashEmail, writeAudit } from "@/lib/audit";
import { getEmailService } from "@/lib/email";
import { env } from "@/lib/env";
import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { getSessionFromCookie } from "@/lib/session";

type CreateBody = { email?: unknown; role?: unknown };

const INVITABLE_ROLES: ReadonlySet<OrgRole> = new Set(["ADMIN", "MEMBER", "VIEWER"]);

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  // Pragmatic validation: one @, non-empty local + host with a dot.
  // Graph will reject anything malformed anyway; this just blocks
  // the obviously-broken cases before we hit the transport.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return null;
  return v;
}

function matchesDomainAllowlist(email: string, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return allowed.some((d) => d.toLowerCase() === domain);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ orgId: string }> }
): Promise<NextResponse> {
  const { orgId } = await ctx.params;
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireOrgAccess(session.user.id, orgId, "member.invite");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      const status = err.kind === "forbidden" ? 403 : 404;
      return NextResponse.json({ error: err.kind }, { status });
    }
    throw err;
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const role = body.role;
  if (typeof role !== "string" || !INVITABLE_ROLES.has(role as OrgRole)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
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
  if (!org) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  if (!matchesDomainAllowlist(email, org.inviteDomainRestriction)) {
    return NextResponse.json(
      { error: "domain_not_allowed", allowed: org.inviteDomainRestriction },
      { status: 403 }
    );
  }

  // If the email is already a live member, don't invite.
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: orgId
        }
      },
      select: { acceptedAt: true }
    });
    if (existingMembership?.acceptedAt) {
      return NextResponse.json({ error: "already_member" }, { status: 409 });
    }
  }

  // Duplicate-revokes-old: any active (not accepted, not revoked,
  // not expired) invite for this (email, org) gets revoked, then we
  // create a fresh one. The composite index covers this lookup.
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
      data: {
        revokedAt: now,
        revokedByUserId: session.user.id
      }
    });
    return tx.invitation.create({
      data: {
        organizationId: orgId,
        email,
        role: role as OrgRole,
        token,
        invitedByUserId: session.user.id,
        expiresAt
      },
      select: { id: true, email: true, role: true, expiresAt: true }
    });
  });

  await writeAudit({
    actorUserId: session.user.id,
    organizationId: orgId,
    entityType: "invitation",
    entityId: invitation.id,
    action: "invitation.create",
    after: { emailHash: hashEmail(email), role: invitation.role }
  });

  // Send the email — failures are logged but don't undo the invite,
  // per spec (the OWNER/ADMIN can always re-send via duplicate flow).
  try {
    const emailService = getEmailService();
    const acceptUrl = `${env.APP_URL}/invitations/accept/${token}`;
    const inviterName = session.user.fullName || session.user.email || "MAKYN";
    const inviterEmail = session.user.email || "no-reply@makyn.site";
    const locale: "ar" | "en" =
      session.user.preferredLanguage === "ar" ? "ar" : "en";
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
    console.error("[invitations.create] email send failed", {
      invitationId: invitation.id,
      error: err instanceof Error ? err.message : String(err)
    });
  }

  // Never return the token — lives in the email URL + DB only.
  return NextResponse.json(
    {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString()
    },
    { status: 201 }
  );
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orgId: string }> }
): Promise<NextResponse> {
  const { orgId } = await ctx.params;
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireOrgAccess(session.user.id, orgId, "member.invite");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      const status = err.kind === "forbidden" ? 403 : 404;
      return NextResponse.json({ error: err.kind }, { status });
    }
    throw err;
  }

  const now = new Date();
  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId: orgId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now }
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
      invitedBy: { select: { fullName: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    invitations: invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      invitedBy: inv.invitedBy.fullName || inv.invitedBy.email
    }))
  });
}
