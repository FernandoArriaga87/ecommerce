// Cloudflare Turnstile server-side verification.
//
// Privacy-friendly captcha alternative to reCAPTCHA. See:
//   https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
//
// Env vars (both required for Turnstile to activate):
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY  → widget (public)
//   TURNSTILE_SECRET_KEY            → verify endpoint (secret)
//
// Matches the Sentry convention: when env vars are absent, verification is a
// no-op so local dev / staging works without signing up for Cloudflare. In
// production you MUST set both or the captcha is silently disabled.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );
}

/**
 * Verifies a Turnstile token with Cloudflare. Returns:
 *   true  → token valid (or captcha disabled by config)
 *   false → token missing, invalid, reused, or verify endpoint unreachable
 *
 * Fails CLOSED (unlike rate-limit, which fails open). An auth endpoint with
 * broken captcha should reject rather than let a bot through.
 */
export async function verifyTurnstileToken(
  token: string | null,
  ip: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return true;
  }
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch (e) {
    console.error("[turnstile] verification error:", e);
    return false;
  }
}
