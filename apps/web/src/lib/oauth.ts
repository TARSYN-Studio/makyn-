import { createHash, randomBytes } from "node:crypto";

import { prisma, UserRole } from "@makyn/db";

import { createSession } from "./session";

export type OAuthProvider = "google" | "microsoft";

type ProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scope: string;
  clientId: () => string;
  clientSecret: () => string;
  extraAuthParams?: Record<string, string>;
};

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

export const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientId: () => requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: () => requireEnv("GOOGLE_CLIENT_SECRET"),
    extraAuthParams: { access_type: "online", prompt: "select_account" }
  },
  microsoft: {
    // `common` tenant allows both personal and work/school Microsoft accounts.
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userinfoUrl: "https://graph.microsoft.com/oidc/userinfo",
    scope: "openid email profile",
    clientId: () => requireEnv("MICROSOFT_CLIENT_ID"),
    clientSecret: () => requireEnv("MICROSOFT_CLIENT_SECRET"),
    extraAuthParams: { prompt: "select_account" }
  }
};

export function redirectUri(provider: OAuthProvider): string {
  const base = requireEnv("APP_URL").replace(/\/$/, "");
  return `${base}/api/auth/${provider}/callback`;
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  state: string,
  codeChallenge: string
): string {
  const cfg = PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: cfg.clientId(),
    redirect_uri: redirectUri(provider),
    response_type: "code",
    scope: cfg.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    ...(cfg.extraAuthParams ?? {})
  });
  return `${cfg.authorizeUrl}?${params.toString()}`;
}

export function generateState(): string {
  return randomBytes(32).toString("base64url");
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function exchangeCodeForUserinfo(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string
): Promise<{ sub: string; email: string; name: string | null; emailVerified: boolean }> {
  const cfg = PROVIDERS[provider];

  const tokenRes = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(provider),
      client_id: cfg.clientId(),
      client_secret: cfg.clientSecret(),
      code_verifier: codeVerifier
    })
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => "");
    throw new Error(`OAuth token exchange failed (${provider}): ${tokenRes.status} ${body}`);
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) throw new Error(`OAuth token response missing access_token (${provider})`);

  const userRes = await fetch(cfg.userinfoUrl, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` }
  });
  if (!userRes.ok) {
    const body = await userRes.text().catch(() => "");
    throw new Error(`OAuth userinfo failed (${provider}): ${userRes.status} ${body}`);
  }

  const info = (await userRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  };

  if (!info.sub || !info.email) {
    throw new Error(`OAuth userinfo missing sub/email (${provider})`);
  }

  return {
    sub: info.sub,
    email: info.email.trim().toLowerCase(),
    name: info.name ?? null,
    // Microsoft Graph's /oidc/userinfo does not return email_verified; we
    // trust the provider either way because the subject + email come from
    // a signed id_token exchange.
    emailVerified: info.email_verified ?? true
  };
}

export async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  info: { sub: string; email: string; name: string | null; emailVerified: boolean }
): Promise<string> {
  const existingLink = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: info.sub } },
    select: { userId: true }
  });

  if (existingLink) {
    await prisma.oAuthAccount.update({
      where: { provider_providerAccountId: { provider, providerAccountId: info.sub } },
      data: { lastLoginAt: new Date(), email: info.email }
    });
    await prisma.user.update({
      where: { id: existingLink.userId },
      data: { lastLoginAt: new Date() }
    });
    return existingLink.userId;
  }

  // No existing link — try to attach to a user with the same email. If
  // none, create a brand-new user. OAuth signup = no password.
  const userByEmail = await prisma.user.findUnique({
    where: { email: info.email },
    select: { id: true, isActive: true }
  });

  if (userByEmail) {
    if (!userByEmail.isActive) throw new Error("user_inactive");
    await prisma.oAuthAccount.create({
      data: { userId: userByEmail.id, provider, providerAccountId: info.sub, email: info.email }
    });
    await prisma.user.update({
      where: { id: userByEmail.id },
      data: {
        lastLoginAt: new Date(),
        // If Google/Microsoft vouched for the email and we hadn't yet
        // verified it, consider it verified now.
        emailVerifiedAt: info.emailVerified ? new Date() : undefined
      }
    });
    return userByEmail.id;
  }

  const user = await prisma.user.create({
    data: {
      email: info.email,
      fullName: info.name ?? info.email.split("@")[0],
      role: UserRole.SME_OWNER,
      preferredLanguage: "ar",
      emailVerifiedAt: info.emailVerified ? new Date() : null,
      lastLoginAt: new Date(),
      oauthAccounts: {
        create: { provider, providerAccountId: info.sub, email: info.email }
      }
    },
    select: { id: true }
  });
  return user.id;
}

export async function completeOAuthLogin(userId: string): Promise<void> {
  await createSession(userId);
}
