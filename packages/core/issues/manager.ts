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

export async function createOrUpdateIssue(
  processed: ProcessedNotice,
  messageId: string,
  companyId: string
): Promise<IssueOutcome> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: { id: true, ownerId: true }
  });

  const thirtyDaysAgo = addDays(new Date(), -30);

  const existing = await prisma.issue.findFirst({
    where: {
      companyId,
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
        data: { issueId: existing.id, companyId }
      })
    ]);

    return { issueId: existing.id, created: false };
  }

  const created = await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.create({
      data: {
        companyId,
        ownerId: company.ownerId,
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
      data: { issueId: issue.id, companyId }
    });

    return issue;
  });

  return { issueId: created.id, created: true };
}
