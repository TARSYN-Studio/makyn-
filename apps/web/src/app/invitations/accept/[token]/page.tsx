import Link from "next/link";

import { prisma } from "@makyn/db";

import { logoutAction } from "@/actions/auth";
import { Wordmark } from "@/components/LogoMark";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";

import { AcceptInvitationForm } from "./accept-form";

type Props = { params: Promise<{ token: string }> };

// i18n keys for this page land in punch-list item 6 alongside the
// /settings/team UI. Until then, copy is inline bilingual and
// gated on the viewer's preferredLanguage.
const COPY = {
  ar: {
    title: "دعوة للانضمام",
    invalid: "هذه الدعوة غير صالحة.",
    revoked: "تم إلغاء هذه الدعوة.",
    accepted: "تم قبول هذه الدعوة بالفعل.",
    expired: "انتهت صلاحية هذه الدعوة.",
    signInPrompt: (email: string) =>
      `الرجاء تسجيل الدخول باستخدام ${email} لقبول الدعوة.`,
    mismatchPrompt: (invited: string, current: string) =>
      `هذه الدعوة مرسلة إلى ${invited}، لكنك مسجل الدخول بحساب ${current}. الرجاء تسجيل الخروج وتسجيل الدخول بالبريد الصحيح.`,
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    logout: "تسجيل الخروج",
    invitedBy: "دعاك",
    toJoin: "للانضمام إلى",
    asRole: "بصلاحية",
    roles: { ADMIN: "مشرف", MEMBER: "عضو", VIEWER: "مشاهد" },
    accept: "قبول الدعوة"
  },
  en: {
    title: "Invitation to join",
    invalid: "This invitation is not valid.",
    revoked: "This invitation has been revoked.",
    accepted: "This invitation has already been accepted.",
    expired: "This invitation has expired.",
    signInPrompt: (email: string) =>
      `Please sign in as ${email} to accept this invitation.`,
    mismatchPrompt: (invited: string, current: string) =>
      `This invitation was sent to ${invited}, but you're signed in as ${current}. Please sign out and sign in with the correct email.`,
    login: "Sign in",
    signup: "Create account",
    logout: "Sign out",
    invitedBy: "invited you",
    toJoin: "to join",
    asRole: "as",
    roles: { ADMIN: "Admin", MEMBER: "Member", VIEWER: "Viewer" },
    accept: "Accept invitation"
  }
} as const;

export default async function AcceptInvitationPage({ params }: Props) {
  const { token } = await params;
  const user = await getCurrentUser();
  const lang: "ar" | "en" = user?.preferredLanguage === "en" ? "en" : "ar";
  const c = COPY[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      organization: {
        select: { id: true, legalNameAr: true, legalNameEn: true, deletedAt: true }
      },
      invitedBy: {
        select: { fullName: true, email: true }
      }
    }
  });

  let status: "ok" | "invalid" | "revoked" | "accepted" | "expired" = "ok";
  if (!invitation || invitation.organization.deletedAt) {
    status = "invalid";
  } else if (invitation.revokedAt) {
    status = "revoked";
  } else if (invitation.acceptedAt) {
    status = "accepted";
  } else if (invitation.expiresAt < new Date()) {
    status = "expired";
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[var(--paper)]" dir={dir}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Wordmark size="lg" lang={lang} />
        </div>
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold text-[var(--ink)]">{c.title}</h1>
          </CardHeader>
          <CardBody>
            {status !== "ok" && (
              <p className="text-[14px] text-[var(--ink)]">
                {status === "invalid" && c.invalid}
                {status === "revoked" && c.revoked}
                {status === "accepted" && c.accepted}
                {status === "expired" && c.expired}
              </p>
            )}

            {status === "ok" && invitation && (
              <>
                <p className="text-[14px] text-[var(--ink)] mb-4">
                  <strong>{invitation.invitedBy.fullName || invitation.invitedBy.email}</strong>
                  {" "}{c.invitedBy}{" "}{c.toJoin}{" "}
                  <strong>
                    {(lang === "ar"
                      ? invitation.organization.legalNameAr
                      : invitation.organization.legalNameEn) ||
                      invitation.organization.legalNameAr}
                  </strong>
                  {" "}{c.asRole}{" "}
                  <strong>
                    {c.roles[invitation.role as "ADMIN" | "MEMBER" | "VIEWER"]}
                  </strong>.
                </p>

                {!user && (
                  <>
                    <p className="text-[13px] text-[var(--ink-60)] mb-3">
                      {c.signInPrompt(invitation.email)}
                    </p>
                    <div className="flex gap-3">
                      <Link
                        href={`/login?next=${encodeURIComponent(
                          `/invitations/accept/${token}`
                        )}`}
                        className="text-[var(--signal)] hover:underline"
                      >
                        {c.login}
                      </Link>
                      <Link
                        href={`/signup?next=${encodeURIComponent(
                          `/invitations/accept/${token}`
                        )}&email=${encodeURIComponent(invitation.email)}`}
                        className="text-[var(--signal)] hover:underline"
                      >
                        {c.signup}
                      </Link>
                    </div>
                  </>
                )}

                {user && user.email.toLowerCase() !== invitation.email.toLowerCase() && (
                  <>
                    <p className="text-[13px] text-[var(--danger,#c0392b)] mb-3">
                      {c.mismatchPrompt(invitation.email, user.email)}
                    </p>
                    <form action={logoutAction}>
                      <input
                        type="hidden"
                        name="next"
                        value={`/login?next=${encodeURIComponent(`/invitations/accept/${token}`)}`}
                      />
                      <button
                        type="submit"
                        className="text-[var(--signal)] hover:underline text-[13px]"
                      >
                        {c.logout}
                      </button>
                    </form>
                  </>
                )}

                {user && user.email.toLowerCase() === invitation.email.toLowerCase() && (
                  <AcceptInvitationForm
                    token={token}
                    orgId={invitation.organization.id}
                    label={c.accept}
                    lang={lang}
                  />
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
