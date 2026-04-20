import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "stripe-signature",
]);
const SENSITIVE_KEYS = /password|token|secret|api[_-]?key|authorization|cookie|email/i;

function redactString(s: string): string {
  return s.replace(EMAIL_RE, "[redacted-email]");
}

function redactValue(v: unknown): unknown {
  if (typeof v === "string") return redactString(v);
  if (v && typeof v === "object") return redactObject(v as Record<string, unknown>);
  return v;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = "[redacted]";
    } else {
      out[k] = redactValue(v);
    }
  }
  return out;
}

export function scrubPII(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }

  if (event.request) {
    if (event.request.headers) {
      const headers = event.request.headers as Record<string, string>;
      for (const key of Object.keys(headers)) {
        if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
          headers[key] = "[redacted]";
        }
      }
    }
    if (typeof event.request.cookies === "string") {
      event.request.cookies = "[redacted]";
    }
    if (event.request.data && typeof event.request.data === "object") {
      event.request.data = redactObject(event.request.data as Record<string, unknown>);
    }
    if (typeof event.request.query_string === "string") {
      event.request.query_string = redactString(event.request.query_string);
    }
  }

  if (event.message) event.message = redactString(event.message);

  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = redactString(ex.value);
    }
  }

  if (event.breadcrumbs) {
    for (const b of event.breadcrumbs) {
      if (b.message) b.message = redactString(b.message);
      if (b.data && typeof b.data === "object") {
        b.data = redactObject(b.data as Record<string, unknown>);
      }
    }
  }

  return event;
}
