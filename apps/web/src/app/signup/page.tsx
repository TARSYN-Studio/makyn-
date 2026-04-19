import Link from "next/link";

import { SignupForm } from "./signup-form";
import { Wordmark } from "@/components/LogoMark";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

export default async function SignupPage() {
  const user = await getCurrentUser();
  const lang: Lang = user?.preferredLanguage === "en" ? "en" : "ar";

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[var(--paper)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Wordmark size="lg" lang={lang} />
        </div>
        <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-[var(--ink)]">{t("signup.title", lang)}</h1>
        </CardHeader>
        <CardBody>
          <SignupForm lang={lang} />
          <p className="text-[13px] text-[var(--ink-60)] mt-6 text-center">
            {t("signup.haveAccount", lang)}{" "}
            <Link href="/login" className="text-[var(--signal)] hover:underline">
              {t("signup.login", lang)}
            </Link>
          </p>
        </CardBody>
        </Card>
      </div>
    </div>
  );
}
