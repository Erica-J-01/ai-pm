/**
 * Frontend observability - client-only. Captures uncaught errors, unhandled
 * promise rejections, React render faults, and lightweight product events,
 * scrubs anything secret, and emits a structured record to a sink.
 *
 * There is no backend, so the always-on sink is structured console output
 * (visible in devtools and to any browser-level RUM agent). A remote sink can be
 * enabled by setting VITE_TELEMETRY_URL at build time - it POSTs best-effort via
 * sendBeacon. The remote host must also be added to the CSP connect-src in
 * vite.config.ts, or the browser will block the request. The server-side half of
 * observability (Sentry, structured server logs, an analytics pipeline) is
 * tracked separately in BACKEND_TODO.md.
 */

const RELEASE = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? import.meta.env.MODE;
const REMOTE_URL = import.meta.env.VITE_TELEMETRY_URL as string | undefined;

type Severity = "error" | "warning" | "info";

interface TelemetryRecord {
  kind: "error" | "event";
  name: string;
  severity: Severity;
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
  release: string;
  url: string;
  ts: string;
  userAgent: string;
}

// Redact secret-looking substrings so a stack or message can never carry a
// secret into the console or a remote sink: Anthropic keys, and the token part
// of a Bearer/Basic Authorization value (Confluence PAT or email:token).
const SECRET_PATTERNS: [RegExp, string][] = [
  [/sk-ant-[A-Za-z0-9_-]+/g, "sk-ant-[redacted]"],
  // Only redact a credential-like token (>=16 chars of the auth charset) after
  // Bearer/Basic, so real Authorization values are caught but prose like
  // "Basic understanding" is not.
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._:~+/=-]{16,}/gi, "$1 [redacted]"],
];

/** Redact secret-looking substrings. Exported for testing. */
export function scrubSecrets(s: string | undefined): string | undefined {
  if (s === undefined) return undefined;
  return SECRET_PATTERNS.reduce((acc, [re, rep]) => acc.replace(re, rep), s);
}

function scrubContext(ctx?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!ctx) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) out[k] = typeof v === "string" ? scrubSecrets(v) : v;
  return out;
}

function emit(rec: TelemetryRecord): void {
  // Telemetry must never throw into the app it is observing.
  try {
    if (rec.kind === "error") {
      // eslint-disable-next-line no-console
      console.error(`[telemetry] ${rec.name}`, rec);
    } else {
      // eslint-disable-next-line no-console
      console.debug(`[telemetry] ${rec.name}`, rec);
    }
    if (REMOTE_URL) {
      const body = JSON.stringify(rec);
      if (typeof navigator !== "undefined" && navigator.sendBeacon) navigator.sendBeacon(REMOTE_URL, body);
      else void fetch(REMOTE_URL, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  } catch { /* swallow - observability failures are never fatal */ }
}

function base(): Pick<TelemetryRecord, "release" | "url" | "ts" | "userAgent"> {
  return {
    release: RELEASE,
    url: typeof location !== "undefined" ? location.href : "",
    ts: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}

/** Report an error (from a catch, an error boundary, or a global handler). */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");
  emit({
    kind: "error",
    name: err.name || "Error",
    severity: "error",
    message: scrubSecrets(err.message),
    stack: scrubSecrets(err.stack),
    context: scrubContext(context),
    ...base(),
  });
}

/**
 * Track a product event. Pass only non-sensitive props (skill ids, counts,
 * outcomes) - never client names, artefact bodies, or pasted input.
 */
export function trackEvent(name: string, props?: Record<string, unknown>): void {
  emit({ kind: "event", name, severity: "info", context: scrubContext(props), ...base() });
}

let initialised = false;

/** Register global error handlers once. Call at app bootstrap. */
export function initTelemetry(): void {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  window.addEventListener("error", (e: ErrorEvent) => {
    reportError(e.error ?? e.message, { source: "window.onerror", filename: e.filename, line: e.lineno, col: e.colno });
  });
  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    reportError(e.reason, { source: "unhandledrejection" });
  });
}
