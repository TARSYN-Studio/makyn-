import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { ContentType } from "@makyn/db";
import { Context } from "grammy";
import pdfParse from "pdf-parse";

import { config } from "../../config";
import { extractTextFromImage } from "../../ocr/vision";

const MEDIA_DIR = "/var/makyn/media";

export type IngestedContent = {
  contentType: ContentType;
  rawContent: string | null;
  extractedText: string | null;
  mediaFileId: string | null;
  mediaLocalPath: string | null;
};

async function ensureMediaDir(): Promise<void> {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
}

async function downloadTelegramFile(ctx: Context, fileId: string, ext: string): Promise<string> {
  await ensureMediaDir();
  const file = await ctx.api.getFile(fileId);
  if (!file.file_path) throw new Error("Telegram file_path missing");
  const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Telegram download failed: ${response.status}`);
  const dest = path.join(MEDIA_DIR, `${randomUUID()}.${ext}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(dest, buffer);
  return dest;
}

export async function ingestTelegramMessage(ctx: Context): Promise<IngestedContent> {
  if (ctx.message?.text) {
    return {
      contentType: ContentType.TEXT,
      rawContent: ctx.message.text,
      extractedText: null,
      mediaFileId: null,
      mediaLocalPath: null
    };
  }

  if (ctx.message?.photo?.length) {
    const largest = ctx.message.photo.at(-1);
    if (!largest) throw new Error("Photo payload missing");
    const localPath = await downloadTelegramFile(ctx, largest.file_id, "jpg");
    const extractedText = await extractTextFromImage(localPath);
    return {
      contentType: ContentType.PHOTO,
      rawContent: ctx.message.caption ?? null,
      extractedText,
      mediaFileId: largest.file_id,
      mediaLocalPath: localPath
    };
  }

  if (ctx.message?.document) {
    const ext = ctx.message.document.file_name?.split(".").pop()?.toLowerCase() ?? "bin";
    const localPath = await downloadTelegramFile(ctx, ctx.message.document.file_id, ext);
    let extractedText = "";
    if (ctx.message.document.mime_type === "application/pdf" || ext === "pdf") {
      const buffer = await fs.readFile(localPath);
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text.trim();
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

  return { contentType: ContentType.TEXT, rawContent: null, extractedText: null, mediaFileId: null, mediaLocalPath: null };
}

export function combineContent(ingested: IngestedContent): string {
  return [ingested.rawContent, ingested.extractedText].filter(Boolean).join("\n\n").trim();
}
