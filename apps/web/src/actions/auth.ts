"use server";

import { redirect } from "next/navigation";

import { login, signup } from "@/lib/auth";
import { destroyCurrentSession } from "@/lib/session";

export type SignupState = { error?: string };
export type LoginState = { error?: string };

// Narrow allowlist: only paths we currently thread `next` through.
// Widen deliberately when adding new continuation points — do not relax
// to a general "starts with /" rule, which opens protocol-relative
// (`//evil.com`) and fragment-scheme shenanigans.
const ALLOWED_NEXT_PREFIXES = ["/invitations/accept/", "/login"] as const;

function isSafeNext(next: string): boolean {
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  const path = next.split("?")[0];
  return ALLOWED_NEXT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix)
  );
}

function resolveNext(formData: FormData, fallback: string): string {
  const raw = formData.get("next")?.toString() ?? "";
  if (raw && isSafeNext(raw)) return raw;
  return fallback;
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const fullName = formData.get("fullName")?.toString() ?? "";

  const result = await signup({ email, password, fullName });
  if (!result.ok) {
    if (result.error === "email_in_use") return { error: "email_in_use" };
    return { error: "invalid" };
  }

  redirect(resolveNext(formData, "/onboarding"));
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const result = await login({ email, password });
  if (!result.ok) return { error: "invalid_credentials" };

  redirect(resolveNext(formData, "/dashboard"));
}

export async function logoutAction(formData?: FormData) {
  await destroyCurrentSession();
  const next = formData?.get("next")?.toString();
  if (next && isSafeNext(next)) redirect(next);
  redirect("/login");
}
