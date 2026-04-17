import Link from "next/link";

import { SignupForm } from "./signup-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

export default async function SignupPage() {
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
          <h1 className="text-xl font-semibold text-navy-800">{t("signup.title", lang)}</h1>
        </CardHeader>
        <CardBody>
          <SignupForm lang={lang} />
          <p className="text-sm text-slate-600 mt-6 text-center">
            {t("signup.haveAccount", lang)}{" "}
            <Link href="/login" className="text-navy-500 hover:underline">
              {t("signup.login", lang)}
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
