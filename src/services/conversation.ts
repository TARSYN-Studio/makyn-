import { ConversationStatus, Prisma } from "@prisma/client";

import { prisma } from "../db/client";
import { summarizeConversation } from "../ai/responder";

const OPEN_CONVERSATION_WINDOW_HOURS = 24;

export async function findOrCreateConversation(userId: string) {
  const threshold = new Date(Date.now() - OPEN_CONVERSATION_WINDOW_HOURS * 60 * 60 * 1000);

  const existing = await prisma.conversation.findFirst({
    where: {
      userId,
      status: ConversationStatus.OPEN,
      lastMessageAt: { gte: threshold }
    },
    orderBy: {
      lastMessageAt: "desc"
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      userId
    }
  });
}

export async function touchConversation(conversationId: string, primaryCategory?: string | null) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      ...(primaryCategory ? { primaryCategory } : {})
    }
  });
}

export async function maybeSummarizeConversation(conversationId: string): Promise<void> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 10
      }
    }
  });

  if (!conversation || conversation.topicSummary || conversation.messages.length < 3) {
    return;
  }

  const transcript = conversation.messages
    .map((message) => `${message.direction}: ${message.rawContent ?? message.extractedText ?? ""}`)
    .join("\n");

  const summary = await summarizeConversation(transcript);

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { topicSummary: summary }
  });
}

export function decimalOrNull(value: number | null | undefined): Prisma.Decimal | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Prisma.Decimal(value);
}

