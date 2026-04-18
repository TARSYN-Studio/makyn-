import { IssueStatus, Prisma, prisma } from "@makyn/db";

import type { ProcessedNotice } from "../ai/pipeline";
import { addDays, earliestDate } from "../utils/dates";

function decimalOrNull(value: number | null | undefined): Prisma.Decimal | null {
  if (value === null || value === undefined) return null;
  return new Prisma.Decimal(value);
}

export type IssueOutcome = {
  issueId: string;
  created: boolean;
};

/**
 * Create or update an Issue for an inbound notice.
 *
 * v1.4 Commit A: Issue ownership moved off Company.ownerId onto the
 * polymorphic membership edge. The user whose inbound channel received
 * this notice is the `createdByUserId` (creator for audit/provenance);
 * `detectedBy` records the channel. Permission to VIEW the issue comes
 * from Organization membership, not from Issue.createdByUserId.
 *
 * `sourceUserId` + `sourceChannel` carry the full source trace (see
 * Issue model docs). Matcher writes those too.
 */
export async function createOrUpdateIssue(
  processed: ProcessedNotice,
  messageId: string,
  organizationId: string,
  options?: {
    createdByUserId?: string | null;
    sourceChannel?: string | null;
    sourceUserId?: string | null;
    matchedByIdentifier?: string | null;
    matchConfidence?: number | null;
  }
): Promise<IssueOutcome> {
  // Confirm the org exists and is live; we do not gate on the user here —
  // callers (apps/bot matcher) have already authenticated the source user
  // and decided routing. Permission surface lives in apps/web.
  await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { id: true }
  });

  const thirtyDaysAgo = addDays(new Date(), -30);

  const existing = await prisma.issue.findFirst({
    where: {
      organizationId,
      governmentBody: processed.governmentBody ?? undefined,
      noticeType: processed.classification.notice_type_code,
      status: { in: [IssueStatus.OPEN, IssueStatus.ACKNOWLEDGED, IssueStatus.WITH_PROFESSIONAL] },
      createdAt: { gte: thirtyDaysAgo }
    },
    orderBy: { createdAt: "desc" }
  });

  if (existing) {
    const mergedDeadline = earliestDate(existing.detectedDeadline, processed.detectedDeadline);
    const mergedUrgency = Math.max(existing.urgencyLevel, processed.urgency);

    await prisma.$transaction([
      prisma.issue.update({
        where: { id: existing.id },
        data: {
          urgencyLevel: mergedUrgency,
          detectedDeadline: mergedDeadline,
          updatedAt: new Date()
        }
      }),
      prisma.message.update({
        where: { id: messageId },
        data: { issueId: existing.id, organizationId }
      })
    ]);

    return { issueId: existing.id, created: false };
  }

  const created = await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.create({
      data: {
        organizationId,
        detectedBy: options?.sourceChannel === "TELEGRAM" ? "INBOUND_TELEGRAM" : "BOT",
        createdByUserId: options?.createdByUserId ?? null,
        sourceChannel: options?.sourceChannel ?? null,
        sourceUserId: options?.sourceUserId ?? null,
        matchedByIdentifier: options?.matchedByIdentifier ?? null,
        matchedToOrganizationId: organizationId,
        matchConfidence: options?.matchConfidence ?? null,
        titleAr: processed.titleAr,
        summaryAr: processed.summaryAr,
        governmentBody: processed.governmentBody ?? "OTHER",
        noticeType: processed.classification.notice_type_code,
        urgencyLevel: processed.urgency,
        detectedDeadline: processed.detectedDeadline,
        detectedAmountSar: decimalOrNull(processed.detectedAmountSar),
        referenceNumber: processed.referenceNumber,
        extractedEntities: processed.extraction as unknown as Prisma.InputJsonValue,
        recommendedAction: processed.recommendedActionAr,
        recommendedHandler: processed.recommendedHandler,
        actionDeadlineHours: processed.actionDeadlineHours,
        penaltyIfIgnored: processed.penaltyIfIgnoredAr,
        whatToTellHandlerAr: processed.whatToTellHandlerAr,
        status: IssueStatus.OPEN
      }
    });

    await tx.message.update({
      where: { id: messageId },
      data: { issueId: issue.id, organizationId }
    });

    return issue;
  });

  return { issueId: created.id, created: true };
}
