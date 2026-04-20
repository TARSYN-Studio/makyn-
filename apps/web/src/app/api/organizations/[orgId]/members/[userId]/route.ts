import { prisma, type OrgRole } from "@makyn/db";
import { NextRequest, NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { getSessionFromCookie } from "@/lib/session";

const ASSIGNABLE_ROLES: ReadonlySet<OrgRole> = new Set(["ADMIN", "MEMBER", "VIEWER"]);

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ orgId: string; userId: string }> }
): Promise<NextResponse> {
  const { orgId, userId: targetUserId } = await ctx.params;
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireOrgAccess(session.user.id, orgId, "member.change_role");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      const status = err.kind === "forbidden" ? 403 : 404;
      return NextResponse.json({ error: err.kind }, { status });
    }
    throw err;
  }

  let body: { role?: unknown };
  try {
    body = (await req.json()) as { role?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newRole = body.role;
  if (typeof newRole !== "string" || !ASSIGNABLE_ROLES.has(newRole as OrgRole)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const target = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    select: { id: true, role: true, acceptedAt: true }
  });
  if (!target || !target.acceptedAt) {
    return NextResponse.json({ error: "member_not_found" }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "cannot_change_owner_role" }, { status: 403 });
  }

  const updated = await prisma.membership.update({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    data: { role: newRole as OrgRole },
    select: { id: true, role: true }
  });

  await writeAudit({
    actorUserId: session.user.id,
    organizationId: orgId,
    entityType: "membership",
    entityId: updated.id,
    action: "membership.role_change"
  });

  return NextResponse.json({ userId: targetUserId, role: updated.role });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ orgId: string; userId: string }> }
): Promise<NextResponse> {
  const { orgId, userId: targetUserId } = await ctx.params;
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireOrgAccess(session.user.id, orgId, "member.remove");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      const status = err.kind === "forbidden" ? 403 : 404;
      return NextResponse.json({ error: err.kind }, { status });
    }
    throw err;
  }

  const target = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    select: { id: true, role: true, acceptedAt: true }
  });
  if (!target || !target.acceptedAt) {
    return NextResponse.json({ error: "member_not_found" }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "cannot_remove_owner" }, { status: 403 });
  }

  await prisma.membership.delete({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } }
  });

  await writeAudit({
    actorUserId: session.user.id,
    organizationId: orgId,
    entityType: "membership",
    entityId: target.id,
    action: "membership.remove"
  });

  return NextResponse.json({ userId: targetUserId });
}
