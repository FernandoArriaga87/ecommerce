"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile widget. The <script> tag is emitted by <TurnstileScript />
// (server component) so it carries the CSP nonce required by 'strict-dynamic'.
//
// Why explicit render instead of the data-attribute auto-scan:
//   api.js runs its DOM scan ONCE on initial load. Under Next.js client-side
//   navigation between auth pages, there is no second load — the script is
//   already there, sees no new elements to scan, and the newly-mounted
//   .cf-turnstile div stays empty. Submitting that form returns
//   "Verificación de seguridad fallida" because no `cf-turnstile-response`
//   hidden input was ever injected.
//
// Calling window.turnstile.render() from useEffect guarantees that every
// remount produces a real widget — cold load OR SPA nav.

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: string | HTMLElement,
        opts: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
        }
      ) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
  }
}

export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    // api.js may still be loading on cold-load. Poll briefly until it appears,
    // then render exactly once. Bounded by `cancelled` + clearInterval to avoid
    // double-rendering on hot reload / strict mode double effects.
    const tryRender = () => {
      if (cancelled) return true;
      if (widgetIdRef.current) return true;
      if (!window.turnstile || !containerRef.current) return false;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        size: "flexible",
      });
      return true;
    };

    if (tryRender()) {
      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // remove() throws if the widget was already torn down
          }
          widgetIdRef.current = null;
        }
      };
    }

    const interval = window.setInterval(() => {
      if (tryRender()) window.clearInterval(interval);
    }, 100);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // remove() throws if the widget was already torn down
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
