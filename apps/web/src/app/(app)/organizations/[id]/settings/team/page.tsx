import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@makyn/db";

import { InvitationsTable, type PendingInvitation } from "./invitations-table";
import { InviteForm } from "./invite-form";
import { MembersTable } from "./members-table";
import { PageFrame } from "@/components/PageFrame";
import { canDo, OrgAccessError, requireOrgAccess } from "@/lib/permissions";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type PageProps = { params: { id: string } };

export default async function TeamSettingsPage({ params }: PageProps) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";

  let access;
  try {
    access = await requireOrgAccess(user.id, params.id, "org.read");
  } catch (e) {
    if (e instanceof OrgAccessError) notFound();
    throw e;
  }

  const [org, memberships] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: params.id, deletedAt: null },
      select: { id: true, legalNameAr: true, legalNameEn: true }
    }),
    prisma.membership.findMany({
      where: { organizationId: params.id, acceptedAt: { not: null } },
      select: {
        id: true,
        role: true,
        acceptedAt: true,
        user: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: [{ role: "asc" }, { acceptedAt: "asc" }]
    })
  ]);
  if (!org) notFound();

  const orgName =
    lang === "ar"
      ? org.legalNameAr || org.legalNameEn || ""
      : org.legalNameEn || org.legalNameAr || "";

  const members = memberships.map((m) => ({
    membershipId: m.id,
    userId: m.user.id,
    fullName: m.user.fullName,
    email: m.user.email,
    role: m.role,
    joinedAt: m.acceptedAt!.toISOString()
  }));

  const canManageInvites = canDo(access.role, "member.invite");
  let invitations: PendingInvitation[] = [];
  if (canManageInvites) {
    const now = new Date();
    const rows = await prisma.invitation.findMany({
      where: {
        organizationId: params.id,
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
    invitations = rows.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      invitedBy: inv.invitedBy.fullName || inv.invitedBy.email
    }));
  }

  return (
    <PageFrame className="max-w-5xl">
      <div className="mb-2">
        <Link
          href={`/organizations/${params.id}`}
          className="text-[12px] text-[var(--text-dim)] hover:text-[var(--accent)]"
        >
          <span className="inline-block rtl:scale-x-[-1]">←</span> {t("company.back", lang)}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-[var(--text)] mb-1">
        {t("team.title", lang)}
      </h1>
      <p className="text-[13px] text-[var(--text-dim)] mb-6">
        {t("team.subtitle", lang, { orgName })}
      </p>

      <MembersTable
        orgId={params.id}
        members={members}
        currentUserId={user.id}
        currentUserRole={access.role}
        lang={lang}
      />

      {canManageInvites && (
        <InvitationsTable
          orgId={params.id}
          invitations={invitations}
          lang={lang}
        />
      )}

      {canManageInvites && <InviteForm orgId={params.id} lang={lang} />}
    </PageFrame>
  );
}
