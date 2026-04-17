"use server";

import { randomBytes } from "node:crypto";

import { ChannelType, prisma } from "@makyn/db";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/session";

const TOKEN_TTL_MINUTES = 10;

export async function createTelegramConnectTokenAction(): Promise<{ token: string; botUsername: string }> {
  const user = await requireUser();
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.channelConnectToken.create({
    data: {
      userId: user.id,
      channelType: ChannelType.TELEGRAM,
      token,
      expiresAt
    }
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "MAKYN_BOT";
  revalidatePath("/channels");
  return { token, botUsername };
}

export async function disconnectTelegramAction() {
  const user = await requireUser();
  await prisma.messagingChannel.updateMany({
    where: { userId: user.id, channelType: ChannelType.TELEGRAM },
    data: { isActive: false }
  });
  revalidatePath("/channels");
}
