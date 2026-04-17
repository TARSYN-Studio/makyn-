"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { createCompanyAction, type CompanyMutationState } from "@/actions/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { t, type Lang } from "@/lib/i18n";

function SubmitBtn({ lang }: { lang: Lang }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {t("companyNew.submit", lang)}
    </Button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-semibold text-[var(--text)] text-[13px]">{title}</legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </fieldset>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function NewCompanyForm({ lang }: { lang: Lang }) {
  const [state, action] = useFormState<CompanyMutationState, FormData>(createCompanyAction, {});

  return (
    <form action={action} className="space-y-8">
      <Section title={t("companyNew.title", lang)}>
        <Field id="legalNameAr" label={t("companyNew.legalNameAr", lang)}>
          <Input name="legalNameAr" id="legalNameAr" required />
        </Field>
        <Field id="legalNameEn" label={t("companyNew.legalNameEn", lang)}>
          <Input name="legalNameEn" id="legalNameEn" />
        </Field>
        <Field id="tradeName" label={t("companyNew.tradeName", lang)}>
          <Input name="tradeName" id="tradeName" />
        </Field>
        <Field id="businessType" label={t("companyNew.businessType", lang)}>
          <Input name="businessType" id="businessType" />
        </Field>
      </Section>

      <Section title={t("companyNew.section.commerce", lang)}>
        <Field id="crNumber" label={t("companyNew.crNumber", lang)}>
          <Input name="crNumber" id="crNumber" inputMode="numeric" />
        </Field>
        <Field id="crExpiryDate" label={`${t("companyNew.crNumber", lang)} — ${lang === "ar" ? "انتهاء" : "expiry"}`}>
          <Input name="crExpiryDate" id="crExpiryDate" type="date" />
        </Field>
      </Section>

      <Section title={t("companyNew.section.tax", lang)}>
        <Field id="zatcaTin" label={t("companyNew.zatcaTin", lang)}>
          <Input name="zatcaTin" id="zatcaTin" inputMode="numeric" />
        </Field>
        <Field id="vatRegistrationNumber" label={`${t("companyNew.zatcaTin", lang)} — VAT`}>
          <Input name="vatRegistrationNumber" id="vatRegistrationNumber" />
        </Field>
      </Section>

      <Section title={t("companyNew.section.labor", lang)}>
        <Field id="gosiEmployerNumber" label={t("companyNew.gosi", lang)}>
          <Input name="gosiEmployerNumber" id="gosiEmployerNumber" />
        </Field>
        <Field id="qiwaEstablishmentId" label={t("companyNew.qiwa", lang)}>
          <Input name="qiwaEstablishmentId" id="qiwaEstablishmentId" />
        </Field>
      </Section>

      <Section title={t("companyNew.section.immigration", lang)}>
        <Field id="muqeemAccountNumber" label={`Muqeem`}>
          <Input name="muqeemAccountNumber" id="muqeemAccountNumber" />
        </Field>
        <Field id="moi700Number" label={t("companyNew.moi700", lang)}>
          <Input name="moi700Number" id="moi700Number" />
        </Field>
      </Section>

      <Section title={t("companyNew.section.municipal", lang)}>
        <Field id="baladyLicenseNumber" label={t("companyNew.balady", lang)}>
          <Input name="baladyLicenseNumber" id="baladyLicenseNumber" />
        </Field>
        <Field id="baladyLicenseType" label="Balady type">
          <Input name="baladyLicenseType" id="baladyLicenseType" />
        </Field>
        <Field id="baladyExpiryDate" label={lang === "ar" ? "انتهاء الرخصة" : "License expiry"}>
          <Input name="baladyExpiryDate" id="baladyExpiryDate" type="date" />
        </Field>
      </Section>

      <div>
        <Label htmlFor="notes">{t("companyNew.notes", lang)}</Label>
        <Textarea name="notes" id="notes" rows={3} />
      </div>

      {state?.error === "duplicate_identifier" && (
        <p className="text-[13px] text-[var(--red)]">
          {lang === "ar"
            ? "أحد المعرفات (CR/TIN/GOSI/Qiwa) مستخدم في شركة أخرى."
            : "One of the identifiers (CR/TIN/GOSI/Qiwa) is already in use by another company."}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitBtn lang={lang} />
        <Link href="/companies">
          <Button variant="ghost">{t("companyNew.cancel", lang)}</Button>
        </Link>
      </div>
    </form>
  );
}
