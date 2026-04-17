import fs from "node:fs";
import path from "node:path";

import { prisma, type DocumentType } from "@makyn/db";
import { scheduleExtraction } from "@makyn/core/ai/document-extractors";
import { NextRequest, NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/session";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic"
]);
const ALLOWED_DOC_TYPES = new Set<string>([
  "COMMERCIAL_REGISTRATION",
  "ZATCA_VAT_CERTIFICATE",
  "ZAKAT_ASSESSMENT",
  "CHAMBER_OF_COMMERCE",
  "GOSI_REGISTRATION",
  "QIWA_ESTABLISHMENT",
  "MUDAD_CERTIFICATE",
  "MUQEEM_ACCOUNT",
  "BALADY_LICENSE",
  "CIVIL_DEFENSE_CERT",
  "MINISTRY_OF_INDUSTRY",
  "MINISTRY_OF_HEALTH",
  "MINISTRY_OF_TOURISM",
  "MINISTRY_OF_JUSTICE",
  "MINISTRY_OF_ENVIRONMENT",
  "MINISTRY_OF_CULTURE",
  "MINISTRY_OF_SPORTS",
  "SFDA_LICENSE",
  "SASO_CERTIFICATE",
  "CST_LICENSE",
  "SAMA_LICENSE",
  "CMA_LICENSE",
  "MISA_INVESTMENT_LICENSE",
  "MONSHAAT_REGISTRATION",
  "SOCPA_MEMBERSHIP",
  "SCE_MEMBERSHIP",
  "MHRSD_NITAQAT",
  "OTHER"
]);

function sanitizeFilename(name: string): string {
  // Strip path traversal and non-safe chars
  return path.basename(name).replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "_").slice(0, 200);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const docType = formData.get("docType") as string | null;
  const sessionId = formData.get("sessionId") as string | null;
  const file = formData.get("file") as File | null;

  if (!docType || !ALLOWED_DOC_TYPES.has(docType)) {
    return NextResponse.json({ error: "Invalid docType" }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const safeSessionId = sessionId ? sessionId.replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 64) : "nosession";
  const uploadDir = path.join("/var/makyn/uploads", userId, safeSessionId);
  fs.mkdirSync(uploadDir, { recursive: true });

  const ts = Date.now();
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${docType}_${ts}.${ext}`;
  const storagePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(storagePath, buffer);

  const doc = await prisma.companyDocument.create({
    data: {
      userId,
      docType: docType as DocumentType,
      originalName: sanitizeFilename(file.name),
      storagePath,
      mimeType: file.type,
      fileSizeBytes: file.size,
      extractionStatus: "PENDING",
      sessionId: safeSessionId !== "nosession" ? safeSessionId : null
    }
  });

  // TODO: add virus scanning before extraction (deferred)
  scheduleExtraction(doc.id);

  return NextResponse.json({
    documentId: doc.id,
    fileName: doc.originalName,
    fileSize: doc.fileSizeBytes,
    mimeType: doc.mimeType
  });
}
