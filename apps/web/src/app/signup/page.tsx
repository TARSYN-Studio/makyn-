import Link from "next/link";

import { SignupForm } from "./signup-form";
import { Wordmark } from "@/components/LogoMark";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

type SearchParams = { next?: string; email?: string };

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  const lang: Lang = user?.preferredLanguage === "en" ? "en" : "ar";

  const nextHref = searchParams.next
    ? `/login?next=${encodeURIComponent(searchParams.next)}`
    : "/login";

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Wordmark size="lg" />
        </div>
        <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-[var(--text)]">{t("signup.title", lang)}</h1>
        </CardHeader>
        <CardBody>
          <SignupForm lang={lang} next={searchParams.next} presetEmail={searchParams.email} />
          <p className="text-[13px] text-[var(--text-mid)] mt-6 text-center">
            {t("signup.haveAccount", lang)}{" "}
            <Link href={nextHref} className="text-[var(--accent)] hover:underline">
              {t("signup.login", lang)}
            </Link>
          </p>
        </CardBody>
        </Card>
      </div>
    </div>
  );
}
