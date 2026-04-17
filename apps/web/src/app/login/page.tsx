import Link from "next/link";

import { LoginForm } from "./login-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  const lang: Lang = user?.preferredLanguage === "en" ? "en" : "ar";

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-navy-500 mb-3">
            <div className="h-9 w-9 rounded-lg bg-navy-500 text-white grid place-items-center font-bold">م</div>
            <span className="font-semibold">{t("brand.name", lang)}</span>
          </div>
          <h1 className="text-xl font-semibold text-navy-800">{t("login.title", lang)}</h1>
        </CardHeader>
        <CardBody>
          <LoginForm lang={lang} />
          <p className="text-sm text-slate-500 mt-4 text-center">
            {t("login.forgot", lang)} — {t("login.forgot.support", lang)}
          </p>
          <p className="text-sm text-slate-600 mt-4 text-center">
            {t("login.noAccount", lang)}{" "}
            <Link href="/signup" className="text-navy-500 hover:underline">
              {t("login.signup", lang)}
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
