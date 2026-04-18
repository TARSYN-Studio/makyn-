import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/organizations", "/channels", "/settings", "/onboarding"];
const PUBLIC_ONLY = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // v1.4 app-layer rename: /companies{,/...} → /organizations{,/...}.
  // 301 so link previews and bookmarks get permanently rewritten. Keep
  // for one release cycle; drop in the v1.6 cleanup commit.
  if (pathname === "/companies" || pathname.startsWith("/companies/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/companies/, "/organizations");
    return NextResponse.redirect(url, 301);
  }
  if (pathname === "/api/companies" || pathname.startsWith("/api/companies/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/api\/companies/, "/api/organizations");
    return NextResponse.redirect(url, 301);
  }

  const hasSession = Boolean(req.cookies.get("makyn_session")?.value);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (PUBLIC_ONLY.includes(pathname) && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/organizations";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-makyn-path", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"
  ]
};
