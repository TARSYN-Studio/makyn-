"use server";

import { prisma } from "@makyn/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { requireOrgAccess, OrgAccessError } from "@/lib/permissions";
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

export type OrganizationMutationState = { error?: string };
// Legacy-name export for now; consumers get renamed in the same commit.
export type CompanyMutationState = OrganizationMutationState;

export async function createOrganizationAction(
  _prev: OrganizationMutationState,
  formData: FormData
): Promise<OrganizationMutationState> {
  const user = await requireUser();
  const parsed = fromFormData(formData);

  try {
    // Transaction: create the org + the creator's OWNER membership in one
    // atomic step. Every new org always has at least one owner; doing this
    // in two statements could leak an ownerless org if the second fails.
    const created = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
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
        },
        select: { id: true, legalNameAr: true }
      });
      const now = new Date();
      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "OWNER",
          invitedAt: now,
          acceptedAt: now
        }
      });
      return org;
    });

    await writeAudit({
      actorUserId: user.id,
      organizationId: created.id,
      entityType: "organization",
      entityId: created.id,
      action: "organization.create",
      after: { legalNameAr: created.legalNameAr }
    });

    revalidatePath("/organizations");
    revalidatePath("/onboarding");
    redirect(`/organizations/${created.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Unique constraint")) return { error: "duplicate_identifier" };
    throw error;
  }
}

export async function updateOrganizationAction(
  organizationId: string,
  _prev: OrganizationMutationState,
  formData: FormData
): Promise<OrganizationMutationState> {
  const user = await requireUser();

  try {
    await requireOrgAccess(user.id, organizationId, "org.update");
  } catch (e) {
    if (e instanceof OrgAccessError) return { error: "not_found" };
    throw e;
  }

  const parsed = fromFormData(formData);
  const before = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      legalNameAr: true, legalNameEn: true, tradeName: true, businessType: true,
      crNumber: true, crExpiryDate: true, zatcaTin: true, vatRegistrationNumber: true,
      gosiEmployerNumber: true, qiwaEstablishmentId: true, muqeemAccountNumber: true,
      moi700Number: true, baladyLicenseNumber: true, baladyLicenseType: true,
      baladyExpiryDate: true, notes: true
    }
  });

  try {
    const after = await prisma.organization.update({
      where: { id: organizationId },
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
      },
      select: {
        legalNameAr: true, legalNameEn: true, tradeName: true, businessType: true,
        crNumber: true, crExpiryDate: true, zatcaTin: true, vatRegistrationNumber: true,
        gosiEmployerNumber: true, qiwaEstablishmentId: true, muqeemAccountNumber: true,
        moi700Number: true, baladyLicenseNumber: true, baladyLicenseType: true,
        baladyExpiryDate: true, notes: true
      }
    });

    await writeAudit({
      actorUserId: user.id,
      organizationId,
      entityType: "organization",
      entityId: organizationId,
      action: "organization.update",
      before,
      after
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Unique constraint")) return { error: "duplicate_identifier" };
    throw error;
  }

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/organizations");
  return {};
}

export async function archiveOrganizationAction(organizationId: string) {
  const user = await requireUser();

  // Archive = isActive:false. Separate from soft-delete (deletedAt) which
  // is owner-only and cascades edge flipping to stale. For now archive
  // only requires org.update permission.
  try {
    await requireOrgAccess(user.id, organizationId, "org.update");
  } catch (e) {
    if (e instanceof OrgAccessError) {
      redirect("/organizations");
    }
    throw e;
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { isActive: false }
  });

  await writeAudit({
    actorUserId: user.id,
    organizationId,
    entityType: "organization",
    entityId: organizationId,
    action: "organization.update",
    before: { isActive: true },
    after: { isActive: false }
  });

  revalidatePath("/organizations");
  redirect("/organizations");
}

// ---------------------------------------------------------------------------
// Legacy-name exports — keep the old symbol names so transitional imports
// continue to resolve during the rewrite. Consumers should migrate to the
// new names; these can be deleted once grep finds no more references.
// ---------------------------------------------------------------------------

export const createCompanyAction = createOrganizationAction;
export const updateCompanyAction = updateOrganizationAction;
export const archiveCompanyAction = archiveOrganizationAction;
