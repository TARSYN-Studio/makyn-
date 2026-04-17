"use server";

import { prisma } from "@makyn/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { destroySessionById } from "@/lib/session";
import { requireUser } from "@/lib/session";

const languageSchema = z.enum(["ar", "en"]);

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

export async function endSessionAction(sessionId: string) {
  const user = await requireUser();
  await destroySessionById(sessionId, user.id);
  revalidatePath("/settings");
}
