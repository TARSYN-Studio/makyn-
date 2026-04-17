import { extractNotice, type ExtractedNotice } from "./extractor";
import { classifyNotice, type CompanyForMatching, type NoticeClassification } from "./classifier";
import { generateAction, type ActionUserContext, type NoticeAction } from "./action";

export type ProcessedNotice = {
  extraction: ExtractedNotice;
  classification: NoticeClassification;
  action: NoticeAction;

  governmentBody: string | null;
  urgency: 1 | 2 | 3 | 4 | 5;
  matchedCompanyId: string | null;
  matchConfidence: number;
  matchMethod: NoticeClassification["match_method"];
  titleAr: string;
  summaryAr: string;
  recommendedActionAr: string;
  recommendedHandler: NoticeAction["recommended_handler"];
  actionDeadlineHours: number | null;
  penaltyIfIgnoredAr: string;
  whatToTellHandlerAr: string;
  responseToUserAr: string;
  detectedDeadline: Date | null;
  detectedAmountSar: number | null;
  referenceNumber: string | null;

  promptVersions: {
    extractor: string;
    classifier: string;
    action: string;
  };

  latencyMs: {
    extractor: number;
    classifier: number;
    action: number;
    total: number;
  };
};

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function processNotice(
  rawText: string,
  companies: CompanyForMatching[],
  user: ActionUserContext
): Promise<ProcessedNotice> {
  const totalStart = Date.now();

  const { extraction, promptVersion: extractorVersion, latencyMs: extractorLatency } = await extractNotice(rawText);

  const {
    classification,
    promptVersion: classifierVersion,
    latencyMs: classifierLatency
  } = await classifyNotice(extraction, rawText, companies);

  const {
    action,
    promptVersion: actionVersion,
    latencyMs: actionLatency
  } = await generateAction(extraction, classification, user);

  const detectedDeadline = parseDate(extraction.dates.response_deadline) ?? parseDate(extraction.dates.payment_deadline);

  return {
    extraction,
    classification,
    action,

    governmentBody: extraction.sender.government_body,
    urgency: classification.urgency_level,
    matchedCompanyId: classification.matched_company_id,
    matchConfidence: classification.match_confidence,
    matchMethod: classification.match_method,
    titleAr: action.title_ar,
    summaryAr: action.summary_ar,
    recommendedActionAr: action.recommended_action_ar,
    recommendedHandler: action.recommended_handler,
    actionDeadlineHours: action.action_deadline_hours,
    penaltyIfIgnoredAr: action.penalty_if_ignored_ar,
    whatToTellHandlerAr: action.what_to_tell_the_handler_ar,
    responseToUserAr: action.response_to_user_ar,
    detectedDeadline,
    detectedAmountSar: extraction.financial.amount_sar,
    referenceNumber: extraction.notice_reference.reference_number,

    promptVersions: {
      extractor: extractorVersion,
      classifier: classifierVersion,
      action: actionVersion
    },
    latencyMs: {
      extractor: extractorLatency,
      classifier: classifierLatency,
      action: actionLatency,
      total: Date.now() - totalStart
    }
  };
}
