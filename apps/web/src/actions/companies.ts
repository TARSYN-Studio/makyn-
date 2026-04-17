"use server";

import { prisma } from "@makyn/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/session";

const upsertSchema = z.object({
  legalNameAr: z.string().trim().min(2).max(200),
  legalNameEn: z.string().trim().max(200).optional().or(z.literal("")),
  tradeName: z.string().trim().max(200).optional().or(z.literal("")),
  businessType: z.string().trim().max(100).optional().or(z.literal("")),
  crNumber: z.string().trim().max(40).optional().or(z.literal("")),
  crExpiryDate: z.string().trim().optional().or(z.literal("")),
  zatcaTin: z.string().trim().max(40).optional().or(z.literal("")),
  vatRegistrationNumber: z.string().trim().max(40).optional().or(z.literal("")),
  gosiEmployerNumber: z.string().trim().max(40).optional().or(z.literal("")),
  qiwaEstablishmentId: z.string().trim().max(40).optional().or(z.literal("")),
  muqeemAccountNumber: z.string().trim().max(40).optional().or(z.literal("")),
  moi700Number: z.string().trim().max(40).optional().or(z.literal("")),
  baladyLicenseNumber: z.string().trim().max(40).optional().or(z.literal("")),
  baladyLicenseType: z.string().trim().max(60).optional().or(z.literal("")),
  baladyExpiryDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal(""))
});

function emptyToNull(v: string | undefined | null): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

function parseDate(v: string | undefined | null): Date | null {
  const s = emptyToNull(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fromFormData(formData: FormData): z.infer<typeof upsertSchema> {
  const raw: Record<string, string> = {};
  upsertSchema.keyof().options.forEach((key) => {
    raw[key] = (formData.get(key) as string | null) ?? "";
  });
  return upsertSchema.parse(raw);
}

export type CompanyMutationState = { error?: string };

export async function createCompanyAction(
  _prev: CompanyMutationState,
  formData: FormData
): Promise<CompanyMutationState> {
  const user = await requireUser();
  const parsed = fromFormData(formData);

  try {
    const created = await prisma.company.create({
      data: {
        ownerId: user.id,
        legalNameAr: parsed.legalNameAr,
        legalNameEn: emptyToNull(parsed.legalNameEn),
        tradeName: emptyToNull(parsed.tradeName),
        businessType: emptyToNull(parsed.businessType),
        crNumber: emptyToNull(parsed.crNumber),
        crExpiryDate: parseDate(parsed.crExpiryDate),
        zatcaTin: emptyToNull(parsed.zatcaTin),
        vatRegistrationNumber: emptyToNull(parsed.vatRegistrationNumber),
        gosiEmployerNumber: emptyToNull(parsed.gosiEmployerNumber),
        qiwaEstablishmentId: emptyToNull(parsed.qiwaEstablishmentId),
        muqeemAccountNumber: emptyToNull(parsed.muqeemAccountNumber),
        moi700Number: emptyToNull(parsed.moi700Number),
        baladyLicenseNumber: emptyToNull(parsed.baladyLicenseNumber),
        baladyLicenseType: emptyToNull(parsed.baladyLicenseType),
        baladyExpiryDate: parseDate(parsed.baladyExpiryDate),
        notes: emptyToNull(parsed.notes)
      },
      select: { id: true }
    });
    revalidatePath("/companies");
    revalidatePath("/onboarding");
    redirect(`/companies/${created.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Unique constraint")) return { error: "duplicate_identifier" };
    throw error;
  }
}

export async function updateCompanyAction(
  companyId: string,
  _prev: CompanyMutationState,
  formData: FormData
): Promise<CompanyMutationState> {
  const user = await requireUser();

  const existing = await prisma.company.findFirst({
    where: { id: companyId, ownerId: user.id },
    select: { id: true }
  });
  if (!existing) return { error: "not_found" };

  const parsed = fromFormData(formData);

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        legalNameAr: parsed.legalNameAr,
        legalNameEn: emptyToNull(parsed.legalNameEn),
        tradeName: emptyToNull(parsed.tradeName),
        businessType: emptyToNull(parsed.businessType),
        crNumber: emptyToNull(parsed.crNumber),
        crExpiryDate: parseDate(parsed.crExpiryDate),
        zatcaTin: emptyToNull(parsed.zatcaTin),
        vatRegistrationNumber: emptyToNull(parsed.vatRegistrationNumber),
        gosiEmployerNumber: emptyToNull(parsed.gosiEmployerNumber),
        qiwaEstablishmentId: emptyToNull(parsed.qiwaEstablishmentId),
        muqeemAccountNumber: emptyToNull(parsed.muqeemAccountNumber),
        moi700Number: emptyToNull(parsed.moi700Number),
        baladyLicenseNumber: emptyToNull(parsed.baladyLicenseNumber),
        baladyLicenseType: emptyToNull(parsed.baladyLicenseType),
        baladyExpiryDate: parseDate(parsed.baladyExpiryDate),
        notes: emptyToNull(parsed.notes)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Unique constraint")) return { error: "duplicate_identifier" };
    throw error;
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  return {};
}

export async function archiveCompanyAction(companyId: string) {
  const user = await requireUser();
  await prisma.company.updateMany({
    where: { id: companyId, ownerId: user.id },
    data: { isActive: false }
  });
  revalidatePath("/companies");
  redirect("/companies");
}
