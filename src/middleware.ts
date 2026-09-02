import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Middleware runs on the Edge runtime, which can't load the full auth.ts
// (PrismaAdapter, bcryptjs). Build a separate, Edge-safe NextAuth instance
// here from the shared authConfig - it's only used to decode the JWT
// session cookie via req.auth, never to perform sign-in.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/signup"];

// Per-request nonce so CSP can drop 'unsafe-inline' for scripts/styles.
// Next.js automatically applies this nonce to the inline bootstrap scripts
// it renders, as long as the response carries a CSP header containing
// 'nonce-<value>' and the same value is forwarded to the request the app
// renders from (see the two headers set below).
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isApiAuth = pathname.startsWith("/api/auth");
  const isHealth = pathname.startsWith("/api/health");

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  function withCsp(response: NextResponse): NextResponse {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  function next(): NextResponse {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Already signed in: bounce away from the login/signup screens instead of
  // showing them again (single sign-in UX - no re-auth once a session exists).
  if (req.auth && isPublic) {
    return withCsp(NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin)));
  }

  // Health checks must stay reachable unauthenticated (uptime monitors, the
  // self-ping keep-alive in instrumentation.ts) - a redirect here would read
  // as "unhealthy" to anything checking for a 200.
  if (isHealth) return next();

  if (!req.auth && !isPublic && !isApiAuth && pathname !== "/") {
    // API routes must get a JSON 401, not an HTML redirect to /login - a
    // redirected fetch() would resolve with a 200 HTML body and break every
    // JSON.parse() in api-client.ts. Route handlers already re-check the
    // session themselves (defense in depth), so this is purely about
    // returning the right response shape to API callers.
    if (pathname.startsWith("/api/")) {
      return withCsp(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return withCsp(NextResponse.redirect(loginUrl));
  }

  return next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};