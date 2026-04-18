import fs from "node:fs";
import path from "node:path";

import { prisma } from "@makyn/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { writeAudit } from "@/lib/audit";
import { getSessionFromCookie } from "@/lib/session";

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s || null;
}

function date(v: unknown): Date | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { values: Record<string, unknown>; sessionId: string; documentIds: string[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { values, documentIds } = body;
  const legalNameAr = str(values["legalNameAr"]);
  if (!legalNameAr) {
    return NextResponse.json({ error: "legalNameAr is required" }, { status: 400 });
  }

  let organization;
  try {
    organization = await prisma.$transaction(async (tx) => {
      // Org + owner-role Membership in one atomic step (see
      // actions/organizations.ts for the rationale — ownerless org
      // leaks on partial failure).
      const org = await tx.organization.create({
        data: {
          legalNameAr,
          legalNameEn: str(values["legalNameEn"]),
          tradeName: str(values["tradeName"]),
          businessType: str(values["businessType"]),
          ownerLegalName: str(values["ownerLegalName"]),
          crNumber: str(values["crNumber"]),
          crIssueDate: date(values["crIssueDate"]),
          crExpiryDate: date(values["crExpiryDate"]),
          zatcaTin: str(values["zatcaTin"]),
          vatRegistrationNumber: str(values["vatRegistrationNumber"]),
          gosiEmployerNumber: str(values["gosiEmployerNumber"]),
          qiwaEstablishmentId: str(values["qiwaEstablishmentId"]),
          molFileNumber: str(values["molFileNumber"]),
          saudizationCategory: str(values["saudizationCategory"]),
          muqeemAccountNumber: str(values["muqeemAccountNumber"]),
          moi700Number: str(values["moi700Number"]),
          baladyLicenseNumber: str(values["baladyLicenseNumber"]),
          baladyLicenseType: str(values["baladyLicenseType"]),
          baladyExpiryDate: date(values["baladyExpiryDate"]),
          chamberMembershipNumber: str(values["chamberMembershipNumber"]),
          chamberMembershipExpiry: date(values["chamberMembershipExpiry"]),
          mudadWpsCompliant: bool(values["mudadWpsCompliant"]),
          civilDefenseCertNumber: str(values["civilDefenseCertNumber"]),
          civilDefenseExpiry: date(values["civilDefenseExpiry"]),
          industryLicenseNumber: str(values["industryLicenseNumber"]),
          industryLicenseExpiry: date(values["industryLicenseExpiry"]),
          sfdaLicenseNumber: str(values["sfdaLicenseNumber"]),
          sfdaLicenseType: str(values["sfdaLicenseType"]),
          sfdaLicenseExpiry: date(values["sfdaLicenseExpiry"]),
          mohLicenseNumber: str(values["mohLicenseNumber"]),
          mohFacilityType: str(values["mohFacilityType"]),
          mohLicenseExpiry: date(values["mohLicenseExpiry"]),
          tourismLicenseNumber: str(values["tourismLicenseNumber"]),
          tourismClassification: str(values["tourismClassification"]),
          tourismLicenseExpiry: date(values["tourismLicenseExpiry"]),
          cstLicenseNumber: str(values["cstLicenseNumber"]),
          cstServiceType: str(values["cstServiceType"]),
          samaLicenseNumber: str(values["samaLicenseNumber"]),
          samaLicenseType: str(values["samaLicenseType"]),
          cmaLicenseNumber: str(values["cmaLicenseNumber"]),
          cmaLicenseType: str(values["cmaLicenseType"]),
          misaLicenseNumber: str(values["misaLicenseNumber"]),
          misaLicenseExpiry: date(values["misaLicenseExpiry"]),
          sasoCertNumber: str(values["sasoCertNumber"]),
          monshaatRegistrationId: str(values["monshaatRegistrationId"])
        },
        select: { id: true, legalNameAr: true }
      });
      const now = new Date();
      await tx.membership.create({
        data: {
          userId: session.user.id,
          organizationId: org.id,
          role: "OWNER",
          invitedAt: now,
          acceptedAt: now
        }
      });
      return org;
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "An organization with one of these identifiers already exists" },
        { status: 409 }
      );
    }
    throw err;
  }

  // Link uploaded documents to org + move files to permanent path
  if (documentIds?.length) {
    const docs = await prisma.companyDocument.findMany({
      where: { id: { in: documentIds }, userId: session.user.id }
    });

    const permanentDir = path.join("/var/makyn/uploads", session.user.id, organization.id);
    fs.mkdirSync(permanentDir, { recursive: true });

    for (const doc of docs) {
      let newPath = doc.storagePath;
      try {
        if (fs.existsSync(doc.storagePath)) {
          newPath = path.join(permanentDir, path.basename(doc.storagePath));
          fs.renameSync(doc.storagePath, newPath);
        }
      } catch {
        // non-fatal: keep old path
      }
      await prisma.companyDocument.update({
        where: { id: doc.id },
        data: { organizationId: organization.id, storagePath: newPath, sessionId: null }
      });
      await writeAudit({
        actorUserId: session.user.id,
        organizationId: organization.id,
        entityType: "company_document",
        entityId: doc.id,
        action: "document.upload",
        after: { docType: doc.docType, originalName: doc.originalName }
      });
    }
  }

  await writeAudit({
    actorUserId: session.user.id,
    organizationId: organization.id,
    entityType: "organization",
    entityId: organization.id,
    action: "organization.create",
    after: { legalNameAr: organization.legalNameAr }
  });

  revalidatePath("/organizations");
  revalidatePath("/onboarding");
  // Response field stays `companyId` for now — frontend consumer in
  // ReviewForm.tsx uses that key. Renamed consumer-side in a follow-up.
  return NextResponse.json({ companyId: organization.id });
}
