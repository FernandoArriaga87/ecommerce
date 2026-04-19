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

// Routes that require ADMIN or MODERATOR role (checked after auth)
const ADMIN_ROUTES = ["/admin"];

// Routes that should redirect TO home if user IS authenticated
const AUTH_ROUTES = ["/login", "/register"];

// ───────────── Rate limiting (in-memory, per-IP) ─────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFIG = {
  // Sensitive routes get stricter limits
  auth: { windowMs: 60_000, maxRequests: 10 },      // 10 req/min for login/register
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

  if (pathname === "/login" || pathname === "/register") {
    if (request.method === "POST" || pathname.startsWith("/api/")) {
      if (!checkRateLimit(ip, "auth")) {
        return NextResponse.json(
          { error: "Demasiados intentos. Espera un momento." },
          { status: 429 }
        );
      }
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

  // If authenticated trying to access login/register → redirect to profile
  if (user && isAuthRoute) {
    const profileUrl = request.nextUrl.clone();
    profileUrl.pathname = "/profile";
    return NextResponse.redirect(profileUrl);
  }

  // Admin routes require checking role in the DB (via Prisma)
  // Note: We can't use Prisma in edge middleware, so we protect admin at the
  // page/API level. The middleware ensures authentication at minimum.
  // The admin layout/pages should additionally check user.role === "ADMIN".

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
