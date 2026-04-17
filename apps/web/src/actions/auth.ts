"use server";

import { redirect } from "next/navigation";

import { login, signup } from "@/lib/auth";
import { destroyCurrentSession } from "@/lib/session";

export type SignupState = { error?: string };

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const fullName = formData.get("fullName")?.toString() ?? "";

  const result = await signup({ email, password, fullName });
  if (!result.ok) {
    if (result.error === "email_in_use") return { error: "email_in_use" };
    return { error: "invalid" };
  }

  redirect("/onboarding");
}

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const result = await login({ email, password });
  if (!result.ok) return { error: "invalid_credentials" };

  redirect("/companies");
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/login");
}
