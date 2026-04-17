import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { ContentType, ConversationStatus, FounderAction, MessageDirection, Prisma, User } from "@prisma/client";
import pdfParse from "pdf-parse";
import { Api, Context, RawApi } from "grammy";

import { classifyMessage } from "../ai/classifier";
import { config } from "../config";
import { prisma } from "../db/client";
import { extractTextFromImage } from "../ocr/vision";
import { logger } from "../utils/logger";
import { notifyAdminChat } from "./admin-notifier";
import { decimalOrNull, findOrCreateConversation, maybeSummarizeConversation, touchConversation } from "./conversation";

const HOLDING_ACKNOWLEDGEMENT = "استلمنا رسالتك، الفريق يراجعها الآن وسنعود إليك قريباً";
const VOICE_NOT_SUPPORTED = "Voice notes coming soon, please send text or photo";
const MEDIA_DIR = "/var/makyn/media";

type BotContext = Context & {
  state: {
    appUser?: User;
    pendingEditMessageId?: string;
  };
};

type ExtractedInboundContent = {
  contentType: ContentType;
  rawContent: string | null;
  extractedText: string | null;
  mediaFileId?: string | null;
  mediaLocalPath?: string | null;
};

async function ensureMediaDir(): Promise<void> {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
}

async function downloadTelegramFile(ctx: BotContext, fileId: string, extension: string): Promise<string> {
  await ensureMediaDir();
  const file = await ctx.api.getFile(fileId);
  const destination = path.join(MEDIA_DIR, `${randomUUID()}.${extension}`);

  if (!file.file_path) {
    throw new Error("Telegram file path missing");
  }

  const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Unable to download Telegram file: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, buffer);
  return destination;
}

async function extractPdfText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const parsed = await pdfParse(buffer);
  return parsed.text.trim();
}

async function extractInboundContent(ctx: BotContext): Promise<ExtractedInboundContent> {
  if (ctx.message?.text) {
    return {
      contentType: ContentType.TEXT,
      rawContent: ctx.message.text,
      extractedText: null
    };
  }

  if (ctx.message?.photo?.length) {
    const largestPhoto = ctx.message.photo.at(-1);
    if (!largestPhoto) {
      throw new Error("Photo payload missing");
    }

    const localPath = await downloadTelegramFile(ctx, largestPhoto.file_id, "jpg");
    const extractedText = await extractTextFromImage(localPath);
    return {
      contentType: ContentType.PHOTO,
      rawContent: ctx.message.caption ?? null,
      extractedText,
      mediaFileId: largestPhoto.file_id,
      mediaLocalPath: localPath
    };
  }

  if (ctx.message?.document) {
    const extension = ctx.message.document.file_name?.split(".").pop()?.toLowerCase() ?? "bin";
    const localPath = await downloadTelegramFile(ctx, ctx.message.document.file_id, extension);

    let extractedText = "";
    if (ctx.message.document.mime_type === "application/pdf" || extension === "pdf") {
      extractedText = await extractPdfText(localPath);
    } else if (ctx.message.document.mime_type?.startsWith("image/")) {
      extractedText = await extractTextFromImage(localPath);
    }

    return {
      contentType: ContentType.DOCUMENT,
      rawContent: ctx.message.caption ?? ctx.message.document.file_name ?? null,
      extractedText: extractedText || null,
      mediaFileId: ctx.message.document.file_id,
      mediaLocalPath: localPath
    };
  }

  if (ctx.message?.voice) {
    const localPath = await downloadTelegramFile(ctx, ctx.message.voice.file_id, "ogg");
    return {
      contentType: ContentType.VOICE,
      rawContent: null,
      extractedText: null,
      mediaFileId: ctx.message.voice.file_id,
      mediaLocalPath: localPath
    };
  }

  return {
    contentType: ContentType.TEXT,
    rawContent: null,
    extractedText: null
  };
}

export async function processInboundMessage(ctx: BotContext, user: User, api: Api<RawApi>): Promise<void> {
  const conversation = await findOrCreateConversation(user.id);
  const extracted = await extractInboundContent(ctx);

  logger.info(
    {
      userId: user.id,
      telegramId: user.telegramId.toString(),
      contentType: extracted.contentType,
      conversationId: conversation.id
    },
    "inbound_message_received"
  );

  if (extracted.contentType === ContentType.VOICE) {
    await ctx.reply(VOICE_NOT_SUPPORTED);
    return;
  }

  const combinedContent = [extracted.rawContent, extracted.extractedText].filter(Boolean).join("\n\n").trim();

  const inboundMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      userId: user.id,
      direction: MessageDirection.INBOUND,
      contentType: extracted.contentType,
      rawContent: extracted.rawContent,
      mediaFileId: extracted.mediaFileId,
      mediaLocalPath: extracted.mediaLocalPath,
      extractedText: extracted.extractedText,
      founderAction: FounderAction.PENDING
    }
  });

  const { classification, promptVersion } = await classifyMessage(combinedContent);

  await prisma.message.update({
    where: { id: inboundMessage.id },
    data: {
      aiClassification: classification as Prisma.InputJsonValue,
      aiResponseDraft: classification.suggested_response_ar,
      aiConfidence: classification.confidence,
      aiPromptVersion: promptVersion,
      detectedGovernmentBody: classification.government_body,
      detectedCategory: classification.category,
      detectedUrgency: classification.urgency_level,
      detectedDeadline: classification.detected_deadline_iso ? new Date(classification.detected_deadline_iso) : null,
      detectedAmountSar: decimalOrNull(classification.detected_amount_sar),
      founderAction: FounderAction.PENDING
    }
  });

  const shouldAutoSend =
    classification.confidence >= config.AUTO_SEND_CONFIDENCE_THRESHOLD &&
    classification.urgency_level <= config.AUTO_SEND_MAX_URGENCY &&
    !classification.requires_immediate_action &&
    !classification.requires_professional;

  if (shouldAutoSend) {
    await ctx.reply(classification.suggested_response_ar);

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        userId: user.id,
        direction: MessageDirection.OUTBOUND,
        contentType: ContentType.TEXT,
        rawContent: classification.suggested_response_ar,
        aiResponseDraft: classification.suggested_response_ar,
        aiConfidence: classification.confidence,
        wasSentAutomatically: true,
        founderReviewed: false,
        sentAt: new Date()
      }
    });

    logger.info({ conversationId: conversation.id, auto: true }, "outbound_message_sent");
  } else {
    await ctx.reply(HOLDING_ACKNOWLEDGEMENT);
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: ConversationStatus.AWAITING_FOUNDER_REVIEW }
    });

    await notifyAdminChat(api, {
      messageId: inboundMessage.id,
      conversationId: conversation.id,
      userId: user.id,
      telegramUserId: user.telegramId,
      displayName: user.displayName,
      username: user.telegramUsername,
      businessName: user.businessName,
      rawContent: extracted.rawContent,
      extractedText: extracted.extractedText,
      classification
    });
  }

  await touchConversation(conversation.id, classification.category);
  await maybeSummarizeConversation(conversation.id);
}
