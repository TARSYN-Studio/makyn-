"use client";

import { useFormState, useFormStatus } from "react-dom";

import { signupAction, type SignupState } from "@/actions/auth";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Lang } from "@/lib/i18n";

function SubmitButton({ lang }: { lang: Lang }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {t("signup.submit", lang)}
    </Button>
  );
}

export function SignupForm({
  lang,
  next,
  presetEmail
}: {
  lang: Lang;
  next?: string;
  presetEmail?: string;
}) {
  const [state, action] = useFormState<SignupState, FormData>(signupAction, {});
  const emailLocked = Boolean(presetEmail);

  return (
    <div className="space-y-4">
    {!emailLocked && <OAuthButtons lang={lang} next={next} />}
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="fullName">{t("signup.fullName", lang)}</Label>
        <Input name="fullName" id="fullName" required autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email">{t("signup.email", lang)}</Label>
        <Input
          name="email"
          id="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={presetEmail ?? ""}
          readOnly={emailLocked}
        />
      </div>
      <div>
        <Label htmlFor="password">{t("signup.password", lang)}</Label>
        <Input name="password" id="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error === "email_in_use" && (
        <p className="text-sm text-[var(--state-overdue)]">
          {lang === "ar" ? "البريد الإلكتروني مستخدم بالفعل." : "This email is already in use."}
        </p>
      )}
      {state?.error === "invalid" && (
        <p className="text-sm text-[var(--state-overdue)]">
          {lang === "ar" ? "يرجى مراجعة البيانات والمحاولة مرة أخرى." : "Please check your input and try again."}
        </p>
      )}
      <SubmitButton lang={lang} />
    </form>
    </div>
  );
}
