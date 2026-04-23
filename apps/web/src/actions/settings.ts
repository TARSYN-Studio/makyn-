"use server";

import { prisma } from "@makyn/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { destroySessionById } from "@/lib/session";
import { requireUser } from "@/lib/session";

const languageSchema = z.enum(["ar", "en"]);
const themeSchema = z.enum(["light", "dark"]);
const dockSchema = z.enum(["side", "top"]);

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const fullName = formData.get("fullName")?.toString().trim();
  const languageRaw = formData.get("preferredLanguage")?.toString();

  const data: Record<string, string> = {};
  if (fullName && fullName.length >= 2) data.fullName = fullName;
  const langParsed = languageSchema.safeParse(languageRaw);
  if (langParsed.success) data.preferredLanguage = langParsed.data;

  if (Object.keys(data).length === 0) return;

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function setLanguageAction(formData: FormData) {
  const user = await requireUser();
  const raw = formData.get("lang")?.toString();
  const parsed = languageSchema.safeParse(raw);
  if (!parsed.success) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { preferredLanguage: parsed.data }
  });
  revalidatePath("/", "layout");
}

export async function setThemeAction(formData: FormData) {
  const user = await requireUser();
  const raw = formData.get("theme")?.toString();
  const parsed = themeSchema.safeParse(raw);
  if (!parsed.success) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { theme: parsed.data }
  });
  revalidatePath("/", "layout");
}

export async function setDockAction(formData: FormData) {
  const user = await requireUser();
  const raw = formData.get("dockPosition")?.toString();
  const parsed = dockSchema.safeParse(raw);
  if (!parsed.success) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { dockPosition: parsed.data }
  });
  revalidatePath("/", "layout");
}

export async function endSessionAction(sessionId: string) {
  const user = await requireUser();
  await destroySessionById(sessionId, user.id);
  revalidatePath("/settings");
}
