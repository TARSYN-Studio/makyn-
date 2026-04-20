import { prisma } from "@makyn/db";
import { NextRequest, NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { getSessionFromCookie } from "@/lib/session";

function normalizeDomain(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const d = raw.trim().toLowerCase();
  // hostname only, no scheme, no path, at least one dot
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d)) return null;
  return d;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orgId: string }> }
): Promise<NextResponse> {
  const { orgId } = await ctx.params;
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireOrgAccess(session.user.id, orgId, "org.read");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      const status = err.kind === "forbidden" ? 403 : 404;
      return NextResponse.json({ error: err.kind }, { status });
    }
    throw err;
  }

  const org = await prisma.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    select: { inviteDomainRestriction: true }
  });
  if (!org) return NextResponse.json({ error: "org_not_found" }, { status: 404 });

  return NextResponse.json({ allowedDomains: org.inviteDomainRestriction });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ orgId: string }> }
): Promise<NextResponse> {
  const { orgId } = await ctx.params;
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await requireOrgAccess(session.user.id, orgId, "organization.invite_domain_restriction");
  } catch (err) {
    if (err instanceof OrgAccessError) {
      const status = err.kind === "forbidden" ? 403 : 404;
      return NextResponse.json({ error: err.kind }, { status });
    }
    throw err;
  }

  let body: { allowedDomains?: unknown };
  try {
    body = (await req.json()) as { allowedDomains?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.allowedDomains)) {
    return NextResponse.json({ error: "allowedDomains must be an array" }, { status: 400 });
  }

  if (body.allowedDomains.length > 20) {
    return NextResponse.json({ error: "too_many_domains", max: 20 }, { status: 400 });
  }

  const domains: string[] = [];
  for (const item of body.allowedDomains) {
    const d = normalizeDomain(item);
    if (!d) {
      return NextResponse.json(
        { error: "invalid_domain", value: item },
        { status: 400 }
      );
    }
    if (!domains.includes(d)) domains.push(d);
  }

  const before = await prisma.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    select: { inviteDomainRestriction: true }
  });
  if (!before) return NextResponse.json({ error: "org_not_found" }, { status: 404 });

  await prisma.organization.update({
    where: { id: orgId },
    data: { inviteDomainRestriction: domains }
  });

  await writeAudit({
    actorUserId: session.user.id,
    organizationId: orgId,
    entityType: "organization",
    entityId: orgId,
    action: "organization.invite_domain_restriction_changed",
    before: { allowedDomains: before.inviteDomainRestriction },
    after: { allowedDomains: domains }
  });

  return NextResponse.json({ allowedDomains: domains });
}
