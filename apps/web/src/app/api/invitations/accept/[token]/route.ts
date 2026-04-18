import { prisma } from "@makyn/db";
import { NextRequest, NextResponse } from "next/server";

import { hashEmail, writeAudit } from "@/lib/audit";
import { getSessionFromCookie } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await ctx.params;
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      organizationId: true,
      email: true,
      role: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      organization: { select: { deletedAt: true } }
    }
  });
  if (!invitation || invitation.organization.deletedAt) {
    return NextResponse.json({ error: "invitation_not_found" }, { status: 404 });
  }
  if (invitation.revokedAt) {
    return NextResponse.json({ error: "revoked" }, { status: 410 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  // Case-insensitive match per spec §8: both sides lowercased before
  // comparison so "Foo@Example.com" invites accept "foo@example.com".
  const sessionEmail = session.user.email?.toLowerCase() ?? "";
  if (sessionEmail !== invitation.email.toLowerCase()) {
    return NextResponse.json({ error: "email_mismatch" }, { status: 403 });
  }

  // Idempotent: a live Membership means "already accepted". Mark the
  // invite accepted (if not already) and return success; don't 409.
  const now = new Date();
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invitation.organizationId
      }
    },
    select: { acceptedAt: true }
  });

  if (existingMembership?.acceptedAt) {
    if (!invitation.acceptedAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: now, acceptedByUserId: session.user.id }
      });
      // The Invitation row transitions pending → accepted even when the
      // user was already a member. Audit the state change; do not audit
      // membership.accept — the Membership itself did not change.
      await writeAudit({
        actorUserId: session.user.id,
        organizationId: invitation.organizationId,
        entityType: "invitation",
        entityId: invitation.id,
        action: "invitation.accept",
        after: { emailHash: hashEmail(invitation.email), role: invitation.role }
      });
    }
    return NextResponse.json(
      { organizationId: invitation.organizationId, status: "already_member" },
      { status: 200 }
    );
  }

  await prisma.$transaction(async (tx) => {
    // Upsert covers the rare race where a bot-created Membership exists
    // without acceptedAt (Commit A backfill sets both, but leave-then-
    // re-invite paths in future could produce this state).
    await tx.membership.upsert({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: invitation.organizationId
        }
      },
      update: { role: invitation.role, acceptedAt: now },
      create: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        invitedAt: now,
        acceptedAt: now
      }
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: now, acceptedByUserId: session.user.id }
    });
  });

  await writeAudit({
    actorUserId: session.user.id,
    organizationId: invitation.organizationId,
    entityType: "invitation",
    entityId: invitation.id,
    action: "invitation.accept",
    after: { emailHash: hashEmail(invitation.email), role: invitation.role }
  });
  await writeAudit({
    actorUserId: session.user.id,
    organizationId: invitation.organizationId,
    entityType: "membership",
    entityId: session.user.id,
    action: "membership.accept"
  });

  return NextResponse.json(
    { organizationId: invitation.organizationId, status: "accepted" },
    { status: 200 }
  );
}
