import { prisma, UserRole } from "@makyn/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { createSession } from "./session";

const SIGNUP_BCRYPT_ROUNDS = 12;

const signupSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(120)
});

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1).max(200)
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; error: "email_in_use" | "invalid" };

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; error: "invalid_credentials" | "inactive" };

export async function signup(raw: unknown): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { email, password, fullName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "email_in_use" };

  const passwordHash = await bcrypt.hash(password, SIGNUP_BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: UserRole.SME_OWNER,
      preferredLanguage: "ar"
    },
    select: { id: true }
  });

  await createSession(user.id);
  return { ok: true, userId: user.id };
}

export async function login(raw: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid_credentials" };

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, isActive: true }
  });

  if (!user) return { ok: false, error: "invalid_credentials" };
  if (!user.isActive) return { ok: false, error: "inactive" };
  // OAuth-only accounts have no passwordHash — can't log in with a password.
  if (!user.passwordHash) return { ok: false, error: "invalid_credentials" };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false, error: "invalid_credentials" };

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await createSession(user.id);
  return { ok: true, userId: user.id };
}
