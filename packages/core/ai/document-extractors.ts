import fs from "node:fs";
import path from "node:path";

import * as visionLib from "@google-cloud/vision";
import { prisma, type DocumentType } from "@makyn/db";

import { openaiClient, OPENAI_MODEL } from "./client";
import { EXTRACTOR_PROMPTS, EXTRACTOR_PROMPT_VERSION } from "./extractor-prompts";

type ImageAnnotatorClient = InstanceType<typeof visionLib.ImageAnnotatorClient>;
let visionClient: ImageAnnotatorClient | undefined;

function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    visionClient = new visionLib.ImageAnnotatorClient();
  }
  return visionClient;
}

async function ocrImageFile(filePath: string): Promise<string> {
  const client = getVisionClient();
  const [result] = await client.documentTextDetection(filePath);
  return result.fullTextAnnotation?.text?.trim() ?? "";
}

async function ocrPdf(filePath: string): Promise<string> {
  // Use Vision's native PDF support via batchAnnotateFiles — one call, inline
  // base64 content, handles born-digital AND scanned PDFs. Replaces the
  // previous pdf-to-img → pdfjs pipeline which broke in Next's server bundle
  // because pdf.worker.mjs wasn't shipped into .next/server/app/api/...
  // Limits: ≤20MB payload, ≤5 pages sync. Our upload cap is 10MB; CRs are 1-2
  // pages, so sync fits for v1. If we ever need >5 pages, switch to
  // asyncBatchAnnotateFiles with a GCS bucket.
  const client = getVisionClient();
  const buf = fs.readFileSync(filePath);
  const [result] = await client.batchAnnotateFiles({
    requests: [
      {
        inputConfig: {
          content: buf.toString("base64"),
          mimeType: "application/pdf"
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
      }
    ]
  });
  const responses = result.responses?.[0]?.responses ?? [];
  const pages: string[] = [];
  responses.forEach((r, i) => {
    const text = r.fullTextAnnotation?.text?.trim();
    if (text) pages.push(`--- Page ${i + 1} ---\n${text}`);
  });
  return pages.join("\n\n");
}

async function extractOcrText(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return ocrPdf(filePath);
  }
  // image types
  return ocrImageFile(filePath);
}

async function callExtractorLlm(docType: DocumentType, ocrText: string): Promise<{ data: unknown; confidence: number }> {
  const systemPrompt = EXTRACTOR_PROMPTS[docType];
  const client = openaiClient();

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions: systemPrompt,
    input: ocrText.slice(0, 12000), // cap to avoid token limits
    text: { format: { type: "json_object" } }
  });

  const raw = response.output_text.trim();
  const data = JSON.parse(raw) as Record<string, unknown>;
  const confidence = typeof data["confidence"] === "number" ? (data["confidence"] as number) : 0.5;
  return { data, confidence };
}

export async function extractDocument(documentId: string): Promise<void> {
  const doc = await prisma.companyDocument.findUniqueOrThrow({ where: { id: documentId } });

  await prisma.companyDocument.update({
    where: { id: documentId },
    data: { extractionStatus: "PROCESSING", extractionStartedAt: new Date() }
  });

  try {
    if (!fs.existsSync(doc.storagePath)) {
      throw new Error(`File not found: ${doc.storagePath}`);
    }

    // Step 1: OCR
    const ocrText = await extractOcrText(doc.storagePath, doc.mimeType);
    await prisma.companyDocument.update({ where: { id: documentId }, data: { ocrText } });

    if (!ocrText.trim()) {
      await prisma.companyDocument.update({
        where: { id: documentId },
        data: {
          extractionStatus: "FAILED",
          extractionError: "OCR returned empty text — document may be blank or unreadable",
          extractionCompletedAt: new Date()
        }
      });
      return;
    }

    // Step 2: LLM extraction
    let extractedData: unknown;
    let confidence: number;
    try {
      ({ data: extractedData, confidence } = await callExtractorLlm(doc.docType, ocrText));
    } catch (llmErr) {
      // One retry with a stricter prompt prefix
      try {
        const retryText = `Return ONLY valid JSON, nothing else.\n\n${ocrText}`;
        ({ data: extractedData, confidence } = await callExtractorLlm(doc.docType, retryText));
      } catch {
        throw llmErr;
      }
    }

    const finalStatus = confidence >= 0.4 ? "COMPLETED" : "PARTIAL";
    await prisma.companyDocument.update({
      where: { id: documentId },
      data: {
        extractedData: extractedData as object,
        extractionConfidence: confidence,
        extractionVersion: EXTRACTOR_PROMPT_VERSION,
        extractionStatus: finalStatus,
        extractionCompletedAt: new Date()
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.companyDocument.update({
      where: { id: documentId },
      data: {
        extractionStatus: "FAILED",
        extractionError: msg.slice(0, 1000),
        extractionCompletedAt: new Date()
      }
    });
  }
}

export function scheduleExtraction(documentId: string): void {
  // Fire-and-forget: errors are captured to the DB row
  setImmediate(() => {
    extractDocument(documentId).catch(() => undefined);
  });
}

// Map extracted field names to Company model fields for pre-filling the review form
export { mergeExtractedFields, type ExtractedCompanyFields } from "./extracted-fields";
