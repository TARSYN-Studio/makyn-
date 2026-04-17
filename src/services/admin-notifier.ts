import { ConversationStatus, FounderAction, MessageDirection } from "@prisma/client";
import { Api, InlineKeyboard, RawApi } from "grammy";

import { config } from "../config";
import { prisma } from "../db/client";
import { logger } from "../utils/logger";

export type ReviewPayload = {
  messageId: string;
  conversationId: string;
  userId: string;
  telegramUserId: bigint;
  displayName: string;
  username?: string | null;
  businessName?: string | null;
  rawContent?: string | null;
  extractedText?: string | null;
  classification: {
    government_body: string | null;
    category: string;
    urgency_level: number;
    confidence: number;
    urgency_reasoning: string;
    flags_for_founder: string[];
    suggested_response_ar: string;
  };
};

function buildReviewKeyboard(messageId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Approve", `admin:approve:${messageId}`)
    .text("✏️ Edit", `admin:edit:${messageId}`)
    .row()
    .text("❌ Reject", `admin:reject:${messageId}`)
    .text("⬆️ Escalate", `admin:escalate:${messageId}`);
}

export async function notifyAdminChat(api: Api<RawApi>, payload: ReviewPayload): Promise<void> {
  const text = [
    "🔔 New message for review",
    "",
    `From: ${payload.displayName} (${payload.username ? `@${payload.username}` : "—"})`,
    `Company: ${payload.businessName ?? "—"}`,
    `Received: ${new Date().toISOString()}`,
    "",
    "━━━ ORIGINAL MESSAGE ━━━",
    payload.rawContent ?? "—",
    payload.extractedText ? "" : undefined,
    payload.extractedText ? "━━━ EXTRACTED ━━━" : undefined,
    payload.extractedText ?? undefined,
    "",
    "━━━ CLASSIFICATION ━━━",
    `Body: ${payload.classification.government_body ?? "—"}`,
    `Category: ${payload.classification.category}`,
    `Urgency: ${payload.classification.urgency_level}/5`,
    `Confidence: ${payload.classification.confidence.toFixed(2)}`,
    `Reasoning: ${payload.classification.urgency_reasoning}`,
    `Flags: ${payload.classification.flags_for_founder.join(", ") || "—"}`,
    "",
    "━━━ AI DRAFT RESPONSE ━━━",
    payload.classification.suggested_response_ar
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  await api.sendMessage(config.FOUNDER_ADMIN_CHAT_ID.toString(), text, {
    reply_markup: buildReviewKeyboard(payload.messageId)
  });
}

export async function handleApprove(api: Api<RawApi>, messageId: string): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { user: true, conversation: true }
  });

  if (!message?.aiResponseDraft) {
    return;
  }

  await api.sendMessage(message.user.telegramId.toString(), message.aiResponseDraft);

  await prisma.$transaction([
    prisma.message.update({
      where: { id: messageId },
      data: {
        founderReviewed: true,
        founderAction: FounderAction.APPROVED,
        sentAt: new Date()
      }
    }),
    prisma.message.create({
      data: {
        conversationId: message.conversationId,
        userId: message.userId,
        direction: MessageDirection.OUTBOUND,
        contentType: message.contentType,
        rawContent: message.aiResponseDraft,
        aiResponseDraft: message.aiResponseDraft,
        founderReviewed: true,
        founderAction: FounderAction.APPROVED,
        sentAt: new Date()
      }
    }),
    prisma.conversation.update({
      where: { id: message.conversationId },
      data: { status: ConversationStatus.OPEN }
    })
  ]);

  logger.info({ conversationId: message.conversationId, auto: false }, "founder_approved_message");
}

export async function handleReject(messageId: string): Promise<void> {
  await prisma.message.update({
    where: { id: messageId },
    data: {
      founderReviewed: true,
      founderAction: FounderAction.REJECTED
    }
  });
}

export async function handleEscalate(api: Api<RawApi>, messageId: string): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { user: true }
  });

  if (!message) {
    return;
  }

  await api.sendMessage(message.user.telegramId.toString(), "تم تحويل رسالتك للمتخصص وسيتواصل معك قريباً");

  await prisma.$transaction([
    prisma.message.update({
      where: { id: messageId },
      data: {
        founderReviewed: true,
        founderAction: FounderAction.PENDING
      }
    }),
    prisma.conversation.update({
      where: { id: message.conversationId },
      data: { status: ConversationStatus.ESCALATED }
    })
  ]);
}

export async function handleEditedResponse(api: Api<RawApi>, messageId: string, editedText: string): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { user: true }
  });

  if (!message) {
    return;
  }

  await api.sendMessage(message.user.telegramId.toString(), editedText);

  await prisma.$transaction([
    prisma.message.update({
      where: { id: messageId },
      data: {
        founderReviewed: true,
        founderAction: FounderAction.EDITED,
        founderEditedResponse: editedText,
        sentAt: new Date()
      }
    }),
    prisma.message.create({
      data: {
        conversationId: message.conversationId,
        userId: message.userId,
        direction: MessageDirection.OUTBOUND,
        contentType: message.contentType,
        rawContent: editedText,
        founderEditedResponse: editedText,
        founderReviewed: true,
        founderAction: FounderAction.EDITED,
        sentAt: new Date()
      }
    }),
    prisma.conversation.update({
      where: { id: message.conversationId },
      data: { status: ConversationStatus.OPEN }
    })
  ]);

  logger.info({ conversationId: message.conversationId, auto: false }, "founder_edited_message");
}
