import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@makyn/db";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "makyn_session";
const SESSION_TTL_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const headerList = headers();
  const userAgent = headerList.get("user-agent");
  const forwarded = headerList.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? null;

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: userAgent ?? undefined,
      ipAddress: ipAddress ?? undefined
    }
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60
  });

  return token;
}

export async function destroyCurrentSession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  cookies().delete(SESSION_COOKIE);
}

export async function destroySessionById(sessionId: string, actingUserId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId, userId: actingUserId } });
}

export async function getSessionFromCookie() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          preferredLanguage: true,
          theme: true,
          dockPosition: true,
          role: true,
          isActive: true
        }
      }
    }
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (!session.user.isActive) return null;

  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() }
  });

  return session;
}

export async function getCurrentUser() {
  const session = await getSessionFromCookie();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
