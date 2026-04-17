"use client";

import { useFormState, useFormStatus } from "react-dom";

import { loginAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Lang } from "@/lib/i18n";

function SubmitButton({ lang }: { lang: Lang }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {t("login.submit", lang)}
    </Button>
  );
}

export function LoginForm({ lang }: { lang: Lang }) {
  const [state, action] = useFormState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">{t("login.email", lang)}</Label>
        <Input name="email" id="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">{t("login.password", lang)}</Label>
        <Input name="password" id="password" type="password" required autoComplete="current-password" />
      </div>
      {state?.error === "invalid_credentials" && (
        <p className="text-[13px] text-[var(--red)]">
          {lang === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : "Invalid email or password."}
        </p>
      )}
      <SubmitButton lang={lang} />
    </form>
  );
}
