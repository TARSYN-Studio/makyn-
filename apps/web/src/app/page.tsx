import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/LogoMark";
import { t, type Lang } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const lang: Lang = "ar";

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 pb-12 text-center">
        <div className="mb-8 inline-flex items-center">
          <Wordmark size="lg" />
        </div>

        <h1
          className="text-[32px] md:text-[40px] text-[var(--ink)] mb-4 leading-tight"
          style={{ fontWeight: 500, letterSpacing: "-0.01em" }}
        >
          {t("landing.headline", lang)}
        </h1>
        <p className="text-[var(--ink-60)] md:text-[16px] max-w-2xl mb-10">
          {t("landing.sub", lang)}
        </p>

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
