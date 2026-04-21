-- Distributed rate limiter backed by Postgres.
--
-- The table `rate_limit_bucket` is created via `prisma db push` (see
-- schema.prisma → model RateLimitBucket). This file only installs the
-- atomic RPC that the Next.js middleware calls on every /api/* request,
-- plus the RLS + grants that keep the table locked down.
--
-- Run once (and again whenever you touch this file):
--   psql "$DIRECT_URL" -f prisma/migrations/rate_limit_fn.sql
-- Or paste into the Supabase SQL editor.

-- Lock the table: only the SECURITY DEFINER function below should read/write it.
ALTER TABLE public.rate_limit_bucket ENABLE ROW LEVEL SECURITY;

-- Atomic "check and increment". Returns true when the request is under the
-- limit, false when it should be denied.
--
--   p_key        e.g. "1.2.3.4:checkout"
--   p_window_ms  sliding-window length in ms
--   p_max        max requests allowed inside the window
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_window_ms INTEGER,
  p_max INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now   TIMESTAMPTZ := now();
  v_count INT;
BEGIN
  INSERT INTO public.rate_limit_bucket (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_ms || ' ms')::interval)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN public.rate_limit_bucket.reset_at < v_now THEN 1
      ELSE public.rate_limit_bucket.count + 1
    END,
    reset_at = CASE
      WHEN public.rate_limit_bucket.reset_at < v_now
        THEN v_now + (p_window_ms || ' ms')::interval
      ELSE public.rate_limit_bucket.reset_at
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

-- Only the roles used by the Supabase SDK can call this; no one can touch
-- the table directly.
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER)
  TO anon, authenticated, service_role;

-- Optional janitor: drops expired rows. Call from pg_cron (if enabled) or
-- on a schedule of your choice. Not strictly required — the number of
-- active buckets is bounded by (unique IP × buckets), and expired rows are
-- overwritten in place by the RPC on the next hit.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  WITH deleted AS (
    DELETE FROM public.rate_limit_bucket
    WHERE reset_at < now() - interval '1 hour'
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM deleted;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_rate_limit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit() TO service_role;
