"use client";

import { useFormState, useFormStatus } from "react-dom";

import { updateCompanyAction, type CompanyMutationState } from "@/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { t, type Lang } from "@/lib/i18n";

type CompanyInput = {
  id: string;
  legalNameAr: string;
  legalNameEn: string | null;
  tradeName: string | null;
  businessType: string | null;
  crNumber: string | null;
  crExpiryDate: Date | null;
  zatcaTin: string | null;
  vatRegistrationNumber: string | null;
  gosiEmployerNumber: string | null;
  qiwaEstablishmentId: string | null;
  muqeemAccountNumber: string | null;
  moi700Number: string | null;
  baladyLicenseNumber: string | null;
  baladyLicenseType: string | null;
  baladyExpiryDate: Date | null;
  notes: string | null;
};

function SaveBtn({ lang }: { lang: Lang }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {t("company.save", lang)}
    </Button>
  );
}

function dateForInput(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function CompanyDetailsForm({ company, lang }: { company: CompanyInput; lang: Lang }) {
  const [state, action] = useFormState<CompanyMutationState, FormData>(
    updateCompanyAction.bind(null, company.id),
    {}
  );

  const fields: Array<{ key: keyof CompanyInput; label: string; type?: string }> = [
    { key: "legalNameAr", label: t("companyNew.legalNameAr", lang) },
    { key: "legalNameEn", label: t("companyNew.legalNameEn", lang) },
    { key: "tradeName", label: t("companyNew.tradeName", lang) },
    { key: "businessType", label: t("companyNew.businessType", lang) },
    { key: "crNumber", label: t("companyNew.crNumber", lang) },
    { key: "crExpiryDate", label: `CR expiry`, type: "date" },
    { key: "zatcaTin", label: t("companyNew.zatcaTin", lang) },
    { key: "vatRegistrationNumber", label: "VAT #" },
    { key: "gosiEmployerNumber", label: t("companyNew.gosi", lang) },
    { key: "qiwaEstablishmentId", label: t("companyNew.qiwa", lang) },
    { key: "muqeemAccountNumber", label: "Muqeem" },
    { key: "moi700Number", label: t("companyNew.moi700", lang) },
    { key: "baladyLicenseNumber", label: t("companyNew.balady", lang) },
    { key: "baladyLicenseType", label: "Balady type" },
    { key: "baladyExpiryDate", label: "Balady expiry", type: "date" }
  ];

  const valueFor = (key: keyof CompanyInput, type?: string) => {
    const v = company[key];
    if (v instanceof Date) return dateForInput(v);
    if (type === "date" && typeof v === "string") return v;
    return v ?? "";
  };

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label, type }) => (
          <div key={key as string}>
            <Label htmlFor={key as string}>{label}</Label>
            <Input
              id={key as string}
              name={key as string}
              type={type ?? "text"}
              defaultValue={valueFor(key, type) as string}
              required={key === "legalNameAr"}
            />
          </div>
        ))}
      </div>
      <div>
        <Label htmlFor="notes">{t("companyNew.notes", lang)}</Label>
        <Textarea name="notes" id="notes" defaultValue={company.notes ?? ""} rows={3} />
      </div>

      {state?.error === "duplicate_identifier" && (
        <p className="text-[13px] text-[var(--red)]">
          {lang === "ar"
            ? "أحد المعرفات مستخدم في شركة أخرى."
            : "One of the identifiers is already in use by another company."}
        </p>
      )}

      <SaveBtn lang={lang} />
    </form>
  );
}
