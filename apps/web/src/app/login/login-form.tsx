"use client";

import { useFormState, useFormStatus } from "react-dom";

import { loginAction, type LoginState } from "@/actions/auth";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
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

export function LoginForm({ lang, next }: { lang: Lang; next?: string }) {
  const [state, action] = useFormState<LoginState, FormData>(loginAction, {});
  return (
    <div className="space-y-4">
    <OAuthButtons lang={lang} next={next} />
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">{t("login.email", lang)}</Label>
        <Input name="email" id="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">{t("login.password", lang)}</Label>
        <Input name="password" id="password" type="password" required autoComplete="current-password" />
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error === "invalid_credentials" && (
        <p className="text-[13px] text-[var(--state-overdue)]">
          {lang === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : "Invalid email or password."}
        </p>
      )}
      <SubmitButton lang={lang} />
    </form>
    </div>
  );
}
