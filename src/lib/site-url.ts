// Resolves the canonical site URL for building absolute redirect targets
// (Supabase email links, OAuth redirectTo, etc.). Email-based PKCE links
// must point at the *exact* origin registered in the Supabase dashboard,
// so we cannot rely on window.location.origin (breaks on apex vs. www) or
// per-request headers (preview deploys would leak through).
//
// Priority:
//   1. NEXT_PUBLIC_SITE_URL — set this in Vercel for prod + previews.
//   2. https://www.aurasportmx.com — production fallback.
//
// Always returns a value with no trailing slash so callers can just append paths.
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aurasportmx.com";
  return raw.replace(/\/$/, "");
}
