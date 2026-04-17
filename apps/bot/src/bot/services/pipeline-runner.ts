import {
  ContentType,
  MessageDirection,
  Prisma,
  prisma
} from "@makyn/db";
import {
  companyIdBelongsToUser,
  createOrUpdateIssue,
  processNotice,
  type CompanyForMatching,
  type ProcessedNotice
} from "@makyn/core";

import { logger } from "../../utils/logger";
import { findOrCreateConversation, touchConversation } from "./conversation";
import { combineContent, type IngestedContent } from "./message-ingest";

function decimalOrNull(value: number | null | undefined): Prisma.Decimal | null {
  if (value === null || value === undefined) return null;
  return new Prisma.Decimal(value);
}

export type UserContext = {
  userId: string;
  fullName: string;
  preferredLanguage: string;
};

export type PipelineRunOutcome =
  | { kind: "issue_created"; issueId: string; messageId: string; companyId: string; responseAr: string }
  | { kind: "issue_updated"; issueId: string; messageId: string; companyId: string; responseAr: string }
  | { kind: "disambiguation_needed"; messageId: string; companies: CompanyForMatching[] }
  | { kind: "no_companies"; messageId: string };

async function loadUserCompanies(userId: string): Promise<CompanyForMatching[]> {
  const rows = await prisma.company.findMany({
    where: { ownerId: userId, isActive: true },
    select: {
      id: true,
      legalNameAr: true,
      legalNameEn: true,
      tradeName: true,
      crNumber: true,
      zatcaTin: true,
      gosiEmployerNumber: true,
      qiwaEstablishmentId: true
    },
    orderBy: { createdAt: "asc" }
  });
  return rows;
}

async function persistInbound(
  user: UserContext,
  conversationId: string,
  ingested: IngestedContent
): Promise<string> {
  const row = await prisma.message.create({
    data: {
      conversationId,
      userId: user.userId,
      direction: MessageDirection.INBOUND,
      contentType: ingested.contentType,
      rawContent: ingested.rawContent,
      mediaFileId: ingested.mediaFileId,
      mediaLocalPath: ingested.mediaLocalPath,
      extractedText: ingested.extractedText
    },
    select: { id: true }
  });
  return row.id;
}

async function recordPipelineOutput(messageId: string, processed: ProcessedNotice): Promise<void> {
  await prisma.message.update({
    where: { id: messageId },
    data: {
      aiExtraction: processed.extraction as unknown as Prisma.InputJsonValue,
      aiClassification: processed.classification as unknown as Prisma.InputJsonValue,
      aiAction: processed.action as unknown as Prisma.InputJsonValue,
      aiResponseDraft: processed.responseToUserAr,
      aiPromptVersion: [
        processed.promptVersions.extractor,
        processed.promptVersions.classifier,
        processed.promptVersions.action
      ].join(","),
      detectedGovernmentBody: processed.governmentBody,
      detectedUrgency: processed.urgency,
      detectedDeadline: processed.detectedDeadline,
      detectedAmountSar: decimalOrNull(processed.detectedAmountSar),
      identifierMatchAttempted: true,
      identifierMatchConfidence: processed.matchConfidence,
      identifierMatchReasoning: processed.classification.urgency_reasoning
    }
  });
}

export async function runPipelineForInbound(
  user: UserContext,
  ingested: IngestedContent
): Promise<PipelineRunOutcome> {
  const conversation = await findOrCreateConversation(user.userId);
  const messageId = await persistInbound(user, conversation.id, ingested);

  if (ingested.contentType === ContentType.VOICE) {
    return { kind: "no_companies", messageId };
  }

  const text = combineContent(ingested);
  if (!text) {
    return { kind: "no_companies", messageId };
  }

  const companies = await loadUserCompanies(user.userId);

  if (companies.length === 0) {
    logger.info({ userId: user.userId }, "pipeline_skipped_no_companies");
    return { kind: "no_companies", messageId };
  }

  const processed = await processNotice(
    text,
    companies,
    { fullName: user.fullName, preferredLanguage: user.preferredLanguage }
  );

  await recordPipelineOutput(messageId, processed);
  await touchConversation(conversation.id, processed.classification.notice_type_code);

  const candidateCompanyId = processed.matchedCompanyId;
  if (candidateCompanyId && companyIdBelongsToUser(companies, candidateCompanyId)) {
    const { issueId, created } = await createOrUpdateIssue(processed, messageId, candidateCompanyId);
    return {
      kind: created ? "issue_created" : "issue_updated",
      issueId,
      messageId,
      companyId: candidateCompanyId,
      responseAr: processed.responseToUserAr
    };
  }

  return { kind: "disambiguation_needed", messageId, companies };
}

export type DisambiguationOutcome = Extract<PipelineRunOutcome, { kind: "issue_created" | "issue_updated" }>;

export async function runPipelineForDisambiguation(
  user: UserContext,
  messageId: string,
  chosenCompanyId: string
): Promise<DisambiguationOutcome | null> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      userId: true,
      aiExtraction: true,
      aiClassification: true,
      aiAction: true,
      aiPromptVersion: true
    }
  });

  if (!message || message.userId !== user.userId) return null;
  if (!message.aiAction || !message.aiClassification || !message.aiExtraction) return null;

  const companies = await loadUserCompanies(user.userId);
  if (!companyIdBelongsToUser(companies, chosenCompanyId)) return null;

  const extraction = message.aiExtraction as Prisma.JsonValue;
  const classification = message.aiClassification as Prisma.JsonValue;
  const action = message.aiAction as Prisma.JsonValue;

  const processed = {
    extraction,
    classification,
    action,
    governmentBody:
      (extraction as { sender?: { government_body?: string | null } })?.sender?.government_body ?? null,
    urgency:
      ((classification as { urgency_level?: number })?.urgency_level ?? 3) as 1 | 2 | 3 | 4 | 5,
    matchedCompanyId: chosenCompanyId,
    matchConfidence: 1.0,
    matchMethod: "cr" as const,
    titleAr: (action as { title_ar?: string })?.title_ar ?? "إشعار بدون عنوان",
    summaryAr: (action as { summary_ar?: string })?.summary_ar ?? "",
    recommendedActionAr: (action as { recommended_action_ar?: string })?.recommended_action_ar ?? "",
    recommendedHandler:
      ((action as { recommended_handler?: string })?.recommended_handler ?? "founder") as
        | "accountant"
        | "lawyer"
        | "hr_specialist"
        | "founder",
    actionDeadlineHours: (action as { action_deadline_hours?: number | null })?.action_deadline_hours ?? null,
    penaltyIfIgnoredAr: (action as { penalty_if_ignored_ar?: string })?.penalty_if_ignored_ar ?? "",
    whatToTellHandlerAr:
      (action as { what_to_tell_the_handler_ar?: string })?.what_to_tell_the_handler_ar ?? "",
    responseToUserAr: (action as { response_to_user_ar?: string })?.response_to_user_ar ?? "",
    detectedDeadline: null,
    detectedAmountSar: (extraction as { financial?: { amount_sar?: number | null } })?.financial?.amount_sar ?? null,
    referenceNumber:
      (extraction as { notice_reference?: { reference_number?: string | null } })?.notice_reference
        ?.reference_number ?? null,
    promptVersions: {
      extractor: "stored",
      classifier: "stored",
      action: "stored"
    },
    latencyMs: { extractor: 0, classifier: 0, action: 0, total: 0 }
  } as unknown as ProcessedNotice;

  const deadlineISO =
    (extraction as { dates?: { response_deadline?: string | null; payment_deadline?: string | null } })?.dates
      ?.response_deadline ??
    (extraction as { dates?: { payment_deadline?: string | null } })?.dates?.payment_deadline ??
    null;
  if (deadlineISO) {
    const parsed = new Date(deadlineISO);
    if (!Number.isNaN(parsed.getTime())) processed.detectedDeadline = parsed;
  }

  const { issueId, created } = await createOrUpdateIssue(processed, messageId, chosenCompanyId);
  return {
    kind: created ? "issue_created" : "issue_updated",
    issueId,
    messageId,
    companyId: chosenCompanyId,
    responseAr: processed.responseToUserAr
  };
}
