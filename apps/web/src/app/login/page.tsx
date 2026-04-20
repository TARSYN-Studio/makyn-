import Link from "next/link";

import { LoginForm } from "./login-form";
import { Wordmark } from "@/components/LogoMark";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

type SearchParams = { next?: string; error?: string };

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  const lang: Lang = user?.preferredLanguage === "en" ? "en" : "ar";

  const signupHref = searchParams.next
    ? `/signup?next=${encodeURIComponent(searchParams.next)}`
    : "/signup";

  const oauthErrorMessage = searchParams.error?.startsWith("oauth_") || searchParams.error === "inactive"
    ? (lang === "ar"
        ? "تعذر إكمال تسجيل الدخول. حاول مرة أخرى."
        : "We couldn't complete that sign-in. Please try again.")
    : null;

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[var(--paper)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Wordmark size="lg" lang={lang} />
        </div>
        <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-[var(--ink)]">{t("login.title", lang)}</h1>
        </CardHeader>
        <CardBody>
          {oauthErrorMessage && (
            <p className="mb-4 rounded-md border border-[var(--state-overdue)]/30 bg-[var(--state-overdue)]/5 px-3 py-2 text-[13px] text-[var(--state-overdue)]">
              {oauthErrorMessage}
            </p>
          )}
          <LoginForm lang={lang} next={searchParams.next} />
          <p className="text-[13px] text-[var(--ink-40)] mt-4 text-center">
            {t("login.forgot", lang)} — {t("login.forgot.support", lang)}
          </p>
          <p className="text-[13px] text-[var(--ink-60)] mt-4 text-center">
            {t("login.noAccount", lang)}{" "}
            <Link href={signupHref} className="text-[var(--signal)] hover:underline">
              {t("login.signup", lang)}
            </Link>
          </p>
        </CardBody>
        </Card>
      </div>
    </div>
  );
}
