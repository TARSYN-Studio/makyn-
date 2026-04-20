import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildAuthorizeUrl,
  generatePkce,
  generateState,
  type OAuthProvider,
  PROVIDERS
} from "@/lib/oauth";

const ALLOWED_NEXT_PREFIXES = ["/invitations/accept/", "/dashboard", "/onboarding"];

function isSafeNext(next: string): boolean {
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  const path = next.split("?")[0];
  return ALLOWED_NEXT_PREFIXES.some((p) => path === p || path.startsWith(p));
}

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider as OAuthProvider;
  if (!(provider in PROVIDERS)) {
    return NextResponse.json({ error: "unknown_provider" }, { status: 404 });
  }

  const url = new URL(request.url);
  const nextRaw = url.searchParams.get("next") ?? "";
  const next = nextRaw && isSafeNext(nextRaw) ? nextRaw : "/dashboard";

  const state = generateState();
  const { verifier, challenge } = generatePkce();

  const authorizeUrl = buildAuthorizeUrl(provider, state, challenge);

  const jar = cookies();
  const secure = process.env.NODE_ENV === "production";
  // 10 minutes is plenty for a user to complete the consent screen.
  const maxAge = 10 * 60;
  jar.set(`oauth_state_${provider}`, state, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge
  });
  jar.set(`oauth_verifier_${provider}`, verifier, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge
  });
  jar.set(`oauth_next_${provider}`, next, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge
  });

  return NextResponse.redirect(authorizeUrl);
}
