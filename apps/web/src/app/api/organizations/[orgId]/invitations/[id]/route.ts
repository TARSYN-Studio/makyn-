import { prisma } from "@makyn/db";
import { NextRequest, NextResponse } from "next/server";

import { hashEmail, writeAudit } from "@/lib/audit";
import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { getSessionFromCookie } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ orgId: string; id: string }> }
): Promise<NextResponse> {
  const { orgId, id } = await ctx.params;
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireOrgAccess(session.user.id, orgId, "invitation.revoke");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      const status = err.kind === "forbidden" ? 403 : 404;
      return NextResponse.json({ error: err.kind }, { status });
    }
    throw err;
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, email: true, role: true, acceptedAt: true, revokedAt: true }
  });
  if (!invitation) {
    return NextResponse.json({ error: "invitation_not_found" }, { status: 404 });
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "already_accepted" }, { status: 409 });
  }
  if (invitation.revokedAt) {
    // Idempotent: revoking an already-revoked invite is a no-op success.
    return NextResponse.json({ id: invitation.id }, { status: 200 });
  }

  const now = new Date();
  await prisma.invitation.update({
    where: { id },
    data: { revokedAt: now, revokedByUserId: session.user.id }
  });

  await writeAudit({
    actorUserId: session.user.id,
    organizationId: orgId,
    entityType: "invitation",
    entityId: id,
    action: "invitation.revoke",
    after: { emailHash: hashEmail(invitation.email), role: invitation.role }
  });

  return NextResponse.json({ id }, { status: 200 });
}
