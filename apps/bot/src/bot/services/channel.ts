import { ChannelType, prisma } from "@makyn/db";

export async function resolveConnectedUser(telegramUserId: bigint): Promise<{
  userId: string;
  fullName: string;
  preferredLanguage: string;
  channelId: string;
} | null> {
  const channel = await prisma.messagingChannel.findUnique({
    where: {
      channelType_externalId: {
        channelType: ChannelType.TELEGRAM,
        externalId: telegramUserId.toString()
      }
    },
    include: {
      user: {
        select: { id: true, fullName: true, preferredLanguage: true, isActive: true }
      }
    }
  });

  if (!channel || !channel.isActive || !channel.user.isActive) return null;

  await prisma.messagingChannel.update({
    where: { id: channel.id },
    data: { lastUsedAt: new Date() }
  });

  return {
    userId: channel.user.id,
    fullName: channel.user.fullName,
    preferredLanguage: channel.user.preferredLanguage,
    channelId: channel.id
  };
}

export async function claimConnectToken(
  tokenValue: string,
  telegramUserId: bigint,
  telegramUsername: string | null
): Promise<{ ok: true; userId: string; fullName: string } | { ok: false; reason: "invalid" | "expired" | "used" }> {
  const token = await prisma.channelConnectToken.findUnique({
    where: { token: tokenValue },
    include: { user: { select: { id: true, fullName: true, isActive: true } } }
  });

  if (!token || token.channelType !== ChannelType.TELEGRAM) return { ok: false, reason: "invalid" };
  if (token.usedAt) return { ok: false, reason: "used" };
  if (token.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (!token.user.isActive) return { ok: false, reason: "invalid" };

  await prisma.$transaction([
    prisma.messagingChannel.upsert({
      where: {
        channelType_externalId: {
          channelType: ChannelType.TELEGRAM,
          externalId: telegramUserId.toString()
        }
      },
      create: {
        userId: token.userId,
        channelType: ChannelType.TELEGRAM,
        externalId: telegramUserId.toString(),
        externalHandle: telegramUsername,
        isActive: true
      },
      update: {
        userId: token.userId,
        externalHandle: telegramUsername,
        isActive: true,
        lastUsedAt: new Date()
      }
    }),
    prisma.channelConnectToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    })
  ]);

  return { ok: true, userId: token.userId, fullName: token.user.fullName };
}
