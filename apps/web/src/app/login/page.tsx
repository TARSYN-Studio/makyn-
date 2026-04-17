import Link from "next/link";

import { LoginForm } from "./login-form";
import { Wordmark } from "@/components/LogoMark";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  const lang: Lang = user?.preferredLanguage === "en" ? "en" : "ar";

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[var(--bg)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3">
            <Wordmark size="sm" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text)]">{t("login.title", lang)}</h1>
        </CardHeader>
        <CardBody>
          <LoginForm lang={lang} />
          <p className="text-[13px] text-[var(--text-dim)] mt-4 text-center">
            {t("login.forgot", lang)} — {t("login.forgot.support", lang)}
          </p>
          <p className="text-[13px] text-[var(--text-mid)] mt-4 text-center">
            {t("login.noAccount", lang)}{" "}
            <Link href="/signup" className="text-[var(--accent)] hover:underline">
              {t("login.signup", lang)}
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
