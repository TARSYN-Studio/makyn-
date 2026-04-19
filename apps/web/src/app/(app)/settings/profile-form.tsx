"use client";

import { useTransition } from "react";

import { updateProfileAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Lang } from "@/lib/i18n";

type UserInput = {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  preferredLanguage: string;
};

export function ProfileForm({ user, lang }: { user: UserInput; lang: Lang }) {
  const [isPending, start] = useTransition();

  const submit = (formData: FormData) => {
    start(() => {
      void updateProfileAction(formData);
    });
  };

  return (
    <form action={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="fullName">{t("settings.profile.fullName", lang)}</Label>
        <Input name="fullName" id="fullName" defaultValue={user.fullName} required />
      </div>
      <div>
        <Label htmlFor="email">{t("settings.profile.email", lang)}</Label>
        <Input name="email" id="email" defaultValue={user.email} readOnly disabled />
      </div>
      <div>
        <Label htmlFor="phoneNumber">{t("settings.profile.phone", lang)}</Label>
        <Input name="phoneNumber" id="phoneNumber" defaultValue={user.phoneNumber ?? ""} readOnly disabled />
      </div>
      <div>
        <Label htmlFor="preferredLanguage">{t("settings.profile.language", lang)}</Label>
        <select
          id="preferredLanguage"
          name="preferredLanguage"
          defaultValue={user.preferredLanguage}
          className="h-10 w-full rounded-lg border border-[var(--stone-light)] bg-[var(--paper-low)] text-[var(--ink)] px-3 text-[13px]"
        >
          <option value="ar">{t("settings.lang.ar", lang)}</option>
          <option value="en">{t("settings.lang.en", lang)}</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {t("settings.save", lang)}
        </Button>
      </div>
    </form>
  );
}
