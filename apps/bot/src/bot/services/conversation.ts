import { ConversationStatus, prisma } from "@makyn/db";

const OPEN_WINDOW_HOURS = 24;

export async function findOrCreateConversation(userId: string) {
  const threshold = new Date(Date.now() - OPEN_WINDOW_HOURS * 60 * 60 * 1000);

  const existing = await prisma.conversation.findFirst({
    where: {
      userId,
      status: ConversationStatus.OPEN,
      lastMessageAt: { gte: threshold }
    },
    orderBy: { lastMessageAt: "desc" }
  });

  if (existing) return existing;

  return prisma.conversation.create({ data: { userId } });
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
