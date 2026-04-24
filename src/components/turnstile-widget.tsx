"use client";

// Cloudflare Turnstile widget placeholder. The actual <script> tag is emitted
// by <TurnstileScript /> (server component) so it carries the CSP nonce; here
// we only drop a target div. Turnstile auto-discovers `.cf-turnstile` elements
// on load and injects its iframe + a hidden `cf-turnstile-response` input that
// ships with the enclosing <form> submit.
//
// When NEXT_PUBLIC_TURNSTILE_SITE_KEY is absent the component renders nothing
// (no-op in dev/staging). Server verification mirrors the same check.
export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <div
      className="cf-turnstile flex justify-center"
      data-sitekey={siteKey}
      data-theme="light"
      data-size="flexible"
    />
  );
}
