import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ───────────── Route protection config ─────────────
// Routes that require authentication
const PROTECTED_ROUTES = [
  "/profile",
  "/orders",
  "/checkout",
  "/complete-profile",
];

// Routes that require ADMIN role (checked after auth)
const ADMIN_ROUTES = ["/admin"];

// Routes that should redirect TO home if user IS authenticated
const AUTH_ROUTES = ["/login", "/register"];

// ───────────── Rate limiting (in-memory, per-IP) ─────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFIG = {
  // Sensitive routes get stricter limits
  checkout: { windowMs: 60_000, maxRequests: 5 },    // 5 req/min for checkout
  api: { windowMs: 60_000, maxRequests: 30 },        // 30 req/min for general API
};

function getRateLimitKey(ip: string, bucket: string) {
  return `${ip}:${bucket}`;
}

let cleanupCounter = 0;

function checkRateLimit(ip: string, bucket: keyof typeof RATE_LIMIT_CONFIG): boolean {
  const config = RATE_LIMIT_CONFIG[bucket];
  const key = getRateLimitKey(ip, bucket);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Lazy cleanup: every 100 calls, purge expired entries
  cleanupCounter++;
  if (cleanupCounter >= 100) {
    cleanupCounter = 0;
    for (const [k, v] of rateLimitMap) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// ───────────── Middleware ─────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // ── 1. Rate limiting on API & auth routes ──
  if (pathname.startsWith("/api/checkout")) {
    if (!checkRateLimit(ip, "checkout")) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }
  } else if (pathname.startsWith("/api/")) {
    if (!checkRateLimit(ip, "api")) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }
  }

  // ── 2. Supabase session refresh (required for SSR auth) ──
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session token (important: do this before checking auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 3. Protected route checks ──
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // If not authenticated trying to access protected routes → redirect to login
  if (!user && (isProtected || isAdmin)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes strict role check
  if (user && isAdmin) {
    // We query the User table using Supabase REST API (Edge compatible)
    // Note: Prisma created the table as "User" (case sensitive in Postgres usually via Prisma)
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!dbUser || dbUser.role !== 'ADMIN') {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
  }

  // If authenticated trying to access login/register → redirect to profile
  if (user && isAuthRoute) {
    const profileUrl = request.nextUrl.clone();
    profileUrl.pathname = "/profile";
    return NextResponse.redirect(profileUrl);
  }

  // ── 4. Content Security Policy (CSP) & Security Headers ──
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://images.unsplash.com https://plus.unsplash.com https://*.supabase.co;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

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
