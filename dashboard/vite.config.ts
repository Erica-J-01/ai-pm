import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { ALLOWED_PROXY_METHODS, isBlockedTarget } from "./src/lib/proxyGuard";

/**
 * Proxies POST /api/claude/v1/messages -> https://api.anthropic.com/v1/messages.
 * The API key is read from the x-claude-api-key request header (set by the
 * browser from localStorage) and forwarded as x-api-key. The target is always
 * the Anthropic API - no SSRF surface.
 */
function claudeProxyPlugin() {
  return {
    name: "claude-proxy",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configureServer(server: any) {
      server.middlewares.use(
        "/api/claude",
        async (req: any, res: any) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }

          const apiKey = req.headers["x-claude-api-key"] as string | undefined;
          if (!apiKey || !apiKey.startsWith("sk-ant-")) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing or invalid Anthropic API key (must start with sk-ant-)" }));
            return;
          }

          // Strip /api/claude prefix to get the Anthropic path (e.g. /v1/messages)
          const subpath = (req.url as string) || "/v1/messages";

          const chunks: Uint8Array[] = [];
          await new Promise<void>((resolve) => {
            req.on("data", (chunk: Uint8Array) => chunks.push(chunk));
            req.on("end", resolve);
          });
          const body = chunks.length > 0 ? Buffer.concat(chunks).toString("utf8") : undefined;

          try {
            const upstream = await fetch(`https://api.anthropic.com${subpath}`, {
              method: "POST",
              headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              ...(body ? { body } : {}),
            });

            res.statusCode = upstream.status;
            res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
            res.end(await upstream.text());
          } catch (err) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Upstream fetch failed", message: String(err) }));
          }
        },
      );
    },
  };
}

function confluenceProxyPlugin() {
  return {
    name: "confluence-proxy",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configureServer(server: any) {
      server.middlewares.use(
        "/api/confluence-proxy",
        async (req: any, res: any) => {
          const targetUrl = req.headers["x-confluence-target-url"] as string | undefined;
          const rawMethod = (req.headers["x-confluence-method"] as string | undefined) ?? "GET";
          const auth = req.headers["x-confluence-auth"] as string | undefined;

          // ── Require both headers ──
          if (!targetUrl || !auth) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing X-Confluence-Target-URL or X-Confluence-Auth header" }));
            return;
          }

          // ── Block private/internal targets (SSRF protection) ──
          if (isBlockedTarget(targetUrl)) {
            res.statusCode = 403;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Target URL not permitted - must be an HTTPS external host" }));
            return;
          }

          // ── Method allowlist ──
          const method = rawMethod.toUpperCase();
          if (!ALLOWED_PROXY_METHODS.has(method)) {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: `Method not allowed: ${method}` }));
            return;
          }

          // Read request body (present for POST/PUT)
          const chunks: Uint8Array[] = [];
          await new Promise<void>((resolve) => {
            req.on("data", (chunk: Uint8Array) => chunks.push(chunk));
            req.on("end", resolve);
          });
          const rawBody = chunks.length > 0 ? Buffer.concat(chunks).toString("utf8") : undefined;

          try {
            const upstream = await fetch(targetUrl, {
              method,
              headers: {
                Authorization: auth,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              ...(rawBody ? { body: rawBody } : {}),
            });

            res.statusCode = upstream.status;
            res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
            res.end(await upstream.text());
          } catch (err) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Upstream fetch failed", message: String(err) }));
          }
        },
      );
    },
  };
}

/**
 * Inject a Content-Security-Policy meta tag into the PRODUCTION build only.
 * Applied at build time (not in dev) because the Vite dev server relies on
 * inline scripts, eval, and a websocket for HMR, which a strict CSP would break.
 * The built app loads only same-origin hashed assets, so 'self' is sufficient.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",   // runtime-injected style tags / inline styles
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.anthropic.com",
  "worker-src 'self' blob:",            // pdfjs-dist web worker
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

function cspPlugin() {
  return {
    name: "csp-meta",
    apply: "build" as const,
    transformIndexHtml(html: string) {
      return html.replace(
        "</title>",
        `</title>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), claudeProxyPlugin(), confluenceProxyPlugin(), cspPlugin()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, open: true },
});
