import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitBucket = "checkout" | "api" | "auth" | "write";

const CONFIG: Record<RateLimitBucket, { windowMs: number; max: number }> = {
  // Sensitive routes get stricter limits.
  checkout: { windowMs: 60_000, max: 5 },
  api: { windowMs: 60_000, max: 30 },
  // Auth actions (login/register) — identical to checkout to brute-force.
  auth: { windowMs: 60_000, max: 5 },
  // Any user-driven write (reviews, wishlist, profile) — loose enough for
  // normal UX, tight enough to prevent scripted abuse.
  write: { windowMs: 60_000, max: 15 },
};

// Thin wrapper around the public.check_rate_limit RPC. See
// prisma/migrations/rate_limit_fn.sql for the SQL side.
//
// Fails open: if Supabase is unreachable or the RPC errors, we allow the
// request through rather than locking everyone out. The tradeoff is that
// a DB outage disables abuse protection, which beats the alternative of a
// DB outage disabling the whole store.
export async function checkRateLimit(
  supabase: SupabaseClient,
  ip: string,
  bucket: RateLimitBucket
): Promise<boolean> {
  const cfg = CONFIG[bucket];
  const key = `${ip}:${bucket}`;

  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_window_ms: cfg.windowMs,
      p_max: cfg.max,
    });

    if (error) {
      console.error("[rate-limit] RPC error — allowing request", error);
      return true;
    }

    return data === true;
  } catch (e) {
    console.error("[rate-limit] RPC threw — allowing request", e);
    return true;
  }
}
