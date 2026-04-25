import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// ───────────── Route protection config ─────────────
// Routes that require authentication
const PROTECTED_ROUTES = [
  "/profile",
  "/orders",
  "/checkout",
  "/complete-profile",
  "/reset-password",
];

// Routes that require ADMIN role (checked after auth)
const ADMIN_ROUTES = ["/admin"];

// Routes that should redirect TO home if user IS authenticated
const AUTH_ROUTES = ["/login", "/register"];

// ───────────── Middleware ─────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // ── 1. CSP nonce (per-request, cryptographically random) ──
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  // 'unsafe-eval' is only needed in dev for React refresh / Next.js HMR.
  // 'strict-dynamic' lets nonced scripts propagate trust to their imports.
  // https://challenges.cloudflare.com is whitelisted for Cloudflare Turnstile
  // (captcha en login/register). strict-dynamic ignora host-lists para scripts,
  // pero el iframe del widget necesita frame-src explícito.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://images.unsplash.com https://plus.unsplash.com https://*.supabase.co;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com;
    child-src 'self' https://challenges.cloudflare.com;
    worker-src 'self' blob:;
    connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

  // Forward the nonce to pages via request header so Server Components can read it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  // ── 2. Supabase client (used for both rate-limit RPC and auth refresh) ──
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── 3. Rate limiting on API routes (Supabase-backed, survives cold starts) ──
  if (pathname.startsWith("/api/checkout")) {
    if (!(await checkRateLimit(supabase, ip, "checkout"))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }
  } else if (pathname.startsWith("/api/")) {
    if (!(await checkRateLimit(supabase, ip, "api"))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }
  }

  // ── 4. Session refresh ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 5. Protected route checks ──
  // /checkout/success is the Stripe return URL. It must be reachable even if
  // the session cookie didn't survive the external redirect round-trip; the
  // page fetches order details via /api/orders/:id which has its own auth +
  // ownership check, so nothing sensitive leaks here.
  const isProtected =
    PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) &&
    pathname !== "/checkout/success";
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Not authenticated → redirect to login. For /admin we also gate at the auth
  // level here; the authoritative ADMIN role check runs in src/app/admin/layout.tsx
  // (Prisma) to avoid a per-request Supabase REST call at the edge.
  if (!user && (isProtected || isAdmin)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user on login/register → bounce to profile.
  if (user && isAuthRoute) {
    const profileUrl = request.nextUrl.clone();
    profileUrl.pathname = "/profile";
    return NextResponse.redirect(profileUrl);
  }

  // ── 6. Security headers ──
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public files with common extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
