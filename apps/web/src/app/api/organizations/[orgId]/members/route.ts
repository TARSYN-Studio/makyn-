import { prisma } from "@makyn/db";
import { NextRequest, NextResponse } from "next/server";

import { OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { getSessionFromCookie } from "@/lib/session";

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

  const memberships = await prisma.membership.findMany({
    where: {
      organizationId: orgId,
      acceptedAt: { not: null }
    },
    select: {
      id: true,
      role: true,
      acceptedAt: true,
      user: { select: { id: true, fullName: true, email: true } }
    },
    orderBy: [{ role: "asc" }, { acceptedAt: "asc" }]
  });

  return NextResponse.json({
    members: memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      fullName: m.user.fullName,
      email: m.user.email,
      role: m.role,
      joinedAt: m.acceptedAt!.toISOString()
    }))
  });
}
