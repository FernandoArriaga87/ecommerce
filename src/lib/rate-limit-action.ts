import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, type RateLimitBucket } from "@/lib/rate-limit";

// Server-Action-friendly wrapper around checkRateLimit. Middleware only
// covers /api/* routes; Server Action POSTs go to the page URL and miss
// that layer entirely. Call this at the top of any sensitive action.
//
// Returns true when the request is allowed, false when it's rate-limited.
export async function checkActionRateLimit(bucket: RateLimitBucket): Promise<boolean> {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const supabase = await createClient();
  return checkRateLimit(supabase, ip, bucket);
}
