import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  completeOAuthLogin,
  exchangeCodeForUserinfo,
  findOrCreateOAuthUser,
  type OAuthProvider,
  PROVIDERS
} from "@/lib/oauth";

// Behind a reverse proxy (Caddy → Next on :3000), `new URL(request.url).origin`
// resolves to the internal origin (e.g. http://localhost:3000). We must
// redirect against the public origin — prefer x-forwarded-host/proto, fall
// back to APP_URL.
function publicBase(url: URL): string {
  const fromEnv = process.env.APP_URL?.replace(/\/$/, "");
  return fromEnv || url.origin;
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
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const jar = cookies();
  const expectedState = jar.get(`oauth_state_${provider}`)?.value;
  const verifier = jar.get(`oauth_verifier_${provider}`)?.value;
  const next = jar.get(`oauth_next_${provider}`)?.value ?? "/dashboard";

  // Always clear the transient cookies — success or failure.
  jar.delete(`oauth_state_${provider}`);
  jar.delete(`oauth_verifier_${provider}`);
  jar.delete(`oauth_next_${provider}`);

  if (errorParam) {
    return NextResponse.redirect(new URL(`/login?error=oauth_${errorParam}`, publicBase(url)));
  }
  if (!code || !state || !expectedState || !verifier) {
    return NextResponse.redirect(new URL("/login?error=oauth_missing", publicBase(url)));
  }
  if (state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", publicBase(url)));
  }

  try {
    const info = await exchangeCodeForUserinfo(provider, code, verifier);
    const userId = await findOrCreateOAuthUser(provider, info);
    await completeOAuthLogin(userId);
  } catch (err) {
    const msg = err instanceof Error && err.message === "user_inactive" ? "inactive" : "oauth_failed";
    return NextResponse.redirect(new URL(`/login?error=${msg}`, publicBase(url)));
  }

  return NextResponse.redirect(new URL(next, publicBase(url)));
}
