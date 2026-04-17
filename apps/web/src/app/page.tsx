import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const lang: Lang = "ar";

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-navy-50">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 pb-12 text-center">
        <div className="mb-8 inline-flex items-center gap-2 text-navy-500">
          <div className="h-10 w-10 rounded-lg bg-navy-500 text-white grid place-items-center font-bold">
            م
          </div>
          <span className="text-xl font-semibold">{t("brand.name", lang)}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-navy-800 mb-4 leading-tight">
          {t("landing.headline", lang)}
        </h1>
        <p className="text-slate-600 md:text-lg max-w-2xl mb-10">{t("landing.sub", lang)}</p>

        <div className="flex items-center gap-3">
          <Link href="/signup">
            <Button size="lg">{t("landing.cta", lang)}</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              {t("landing.signin", lang)}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
