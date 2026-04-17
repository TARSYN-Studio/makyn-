import Link from "next/link";

import { NewCompanyForm } from "./new-company-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export default async function NewCompanyPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/companies" className="text-sm text-slate-500 hover:text-navy-500">
          ← {t("common.back", lang)}
        </Link>
      </div>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-navy-800">{t("companyNew.title", lang)}</h1>
        </CardHeader>
        <CardBody>
          <NewCompanyForm lang={lang} />
        </CardBody>
      </Card>
    </div>
  );
}
