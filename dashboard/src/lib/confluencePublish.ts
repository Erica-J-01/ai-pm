/** Minimal markdown → Confluence storage (XHTML) converter. */
function markdownToStorage(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inList = false;
  let listTag = "ul";
  let table: string[][] = [];

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");

  const flushList = () => {
    if (inList) { out.push(`</${listTag}>`); inList = false; }
  };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => !r.every((c) => /^-+$/.test(c.trim())));
    out.push("<table><tbody>");
    rows.forEach((cells, i) => {
      const tag = i === 0 ? "th" : "td";
      out.push("<tr>" + cells.map((c) => `<${tag}><p>${inline(c.trim())}</p></${tag}>`).join("") + "</tr>");
    });
    out.push("</tbody></table>");
    table = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\|.*\|$/.test(line.trim())) {
      table.push(line.trim().replace(/^\||\|$/g, "").split("|"));
      continue;
    }
    flushTable();

    if (/^###\s+/.test(line)) {
      flushList();
      out.push(`<h3>${inline(line.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      flushList();
      out.push(`<h2>${inline(line.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      flushList();
      out.push(`<h1>${inline(line.replace(/^#\s+/, ""))}</h1>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList || listTag !== "ul") { flushList(); out.push("<ul>"); inList = true; listTag = "ul"; }
      out.push(`<li><p>${inline(line.replace(/^[-*]\s+/, ""))}</p></li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList || listTag !== "ol") { flushList(); out.push("<ol>"); inList = true; listTag = "ol"; }
      out.push(`<li><p>${inline(line.replace(/^\d+\.\s+/, ""))}</p></li>`);
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  flushTable();
  return out.join("\n");
}

/**
 * Normalise whatever URL the user entered down to just the origin
 * (https://hostname), then add the correct API path prefix:
 *   Confluence Cloud  → /wiki/rest/api/...
 *   Server / DC       → /rest/api/...
 *
 * Using URL.origin means it handles inputs like:
 *   https://myorg.atlassian.net/          → https://myorg.atlassian.net/wiki
 *   https://myorg.atlassian.net/wiki/rest → https://myorg.atlassian.net/wiki
 *   https://confluence.company.com/       → https://confluence.company.com
 */
function apiBase(baseUrl: string): string {
  let origin: string;
  try {
    origin = new URL(baseUrl.trim()).origin; // strips any path the user typed
  } catch {
    origin = baseUrl.replace(/\/+$/, "");
  }
  return /atlassian\.net/i.test(origin) ? `${origin}/wiki` : origin;
}

/**
 * All Confluence API requests route through the Vite dev-server proxy at
 * /api/confluence-proxy so the browser never talks to Atlassian directly
 * (which would fail with a CORS error).
 */
async function confluenceFetch(
  targetUrl: string,
  method: string,
  authHeader: string,
  bodyJson?: string,
): Promise<Response> {
  return fetch("/api/confluence-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Confluence-Target-URL": targetUrl,
      "X-Confluence-Method": method,
      "X-Confluence-Auth": authHeader,
    },
    ...(bodyJson ? { body: bodyJson } : {}),
  });
}

export interface ConfluencePublishParams {
  /** Confluence base URL, e.g. https://myorg.atlassian.net */
  baseUrl: string;
  /**
   * API token.
   * - If it contains ":" it is treated as "email:token" and sent as Basic auth
   *   (required for Confluence Cloud).
   * - Otherwise sent as Bearer (Confluence Data Center PAT).
   */
  token: string;
  title: string;
  spaceKey: string;
  /** Numeric Confluence page ID of the desired parent page. */
  parentPageId?: string;
  markdown: string;
}

export interface ConfluencePublishResult {
  pageId: string;
  url: string;
  title: string;
}

/** Thrown when a page with the same title already exists in the target space. */
export class ConfluenceDuplicateError extends Error {
  constructor(public readonly pageTitle: string) {
    super(`A page titled "${pageTitle}" already exists in this space.`);
    this.name = "ConfluenceDuplicateError";
  }
}

export interface ConfluenceTestResult {
  spacesCount: number;
  detail: string;
}

/**
 * Verify credentials by fetching the space list.
 * Throws a descriptive Error on auth failure or unexpected status.
 * A network/CORS failure surfaces as a "Failed to fetch" Error - callers
 * should detect that string and show a proxy-needed message.
 */
export async function testConfluenceConnection(params: {
  baseUrl: string;
  token: string; // "email:api_token" → Basic | bare PAT → Bearer
}): Promise<ConfluenceTestResult> {
  const { baseUrl, token } = params;
  const authHeader = token.includes(":")
    ? `Basic ${btoa(token)}`
    : `Bearer ${token}`;

  const res = await confluenceFetch(
    `${apiBase(baseUrl)}/rest/api/space?limit=5`,
    "GET",
    authHeader,
  );

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Invalid credentials - 401 Unauthorised. " +
      "For Confluence Cloud check your email address and API token. " +
      "For Server / DC check your Personal Access Token.",
    );
  }
  if (!res.ok) {
    throw new Error(`Confluence responded ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as { size?: number; results?: unknown[] };
  const count = data.size ?? data.results?.length ?? 0;
  return { spacesCount: count, detail: `${count} space${count !== 1 ? "s" : ""} accessible` };
}

export async function publishToConfluence(
  params: ConfluencePublishParams,
): Promise<ConfluencePublishResult> {
  const { baseUrl, token, title, spaceKey, parentPageId, markdown } = params;

  const storageValue = markdownToStorage(markdown);

  const authHeader = token.includes(":")
    ? `Basic ${btoa(token)}`
    : `Bearer ${token}`;

  const body: Record<string, unknown> = {
    type: "page",
    title,
    space: { key: spaceKey },
    body: {
      storage: { value: storageValue, representation: "storage" },
    },
  };

  if (parentPageId?.trim()) {
    body.ancestors = [{ id: parentPageId.trim() }];
  }

  const endpoint = `${apiBase(baseUrl)}/rest/api/content`;
  const res = await confluenceFetch(endpoint, "POST", authHeader, JSON.stringify(body));

  if (!res.ok) {
    let msg = `Confluence responded ${res.status}`;
    try {
      const err = await res.json() as Record<string, unknown>;
      msg = (err.message ?? err.statusMessage ?? msg) as string;
    } catch { /* keep default */ }
    // Confluence returns 400 with "already exists" when the title is a duplicate.
    if (res.status === 400 && /already exists/i.test(msg)) {
      throw new ConfluenceDuplicateError(title);
    }
    throw new Error(msg);
  }

  const data = await res.json() as {
    id: string;
    title: string;
    _links?: { webui?: string; base?: string };
  };

  // Prefer the base URL from the API response (_links.base) - it is always the
  // correct Confluence origin. Fall back to the user-supplied baseUrl.
  const origin = (data._links?.base ?? baseUrl).replace(/\/$/, "");
  const webuiPath = data._links?.webui ?? `/wiki/spaces/${spaceKey}/pages/${data.id}`;
  const pageUrl = `${origin}${webuiPath}`;

  return { pageId: data.id, url: pageUrl, title: data.title ?? title };
}

/**
 * Find an existing page by title + space key, then overwrite its content.
 * Used when the user chooses "Update existing" after a duplicate-title error.
 */
export async function updateConfluencePage(
  params: ConfluencePublishParams,
): Promise<ConfluencePublishResult> {
  const { baseUrl, token, title, spaceKey, markdown } = params;
  const storageValue = markdownToStorage(markdown);
  const authHeader = token.includes(":") ? `Basic ${btoa(token)}` : `Bearer ${token}`;

  // 1. Find the existing page to get its ID and current version number.
  const searchUrl =
    `${apiBase(baseUrl)}/rest/api/content` +
    `?spaceKey=${encodeURIComponent(spaceKey)}` +
    `&title=${encodeURIComponent(title)}` +
    `&expand=version`;

  const searchRes = await confluenceFetch(searchUrl, "GET", authHeader);
  if (!searchRes.ok) {
    throw new Error(`Could not find existing page - Confluence responded ${searchRes.status}`);
  }

  const searchData = await searchRes.json() as {
    results?: { id: string; version?: { number: number }; _links?: { webui?: string; base?: string } }[];
  };

  const existing = searchData.results?.[0];
  if (!existing) {
    throw new Error(`No page titled "${title}" found in space ${spaceKey}. Try publishing as a new page.`);
  }

  const currentVersion = existing.version?.number ?? 1;

  // 2. PUT the updated content with version incremented by 1.
  const updateRes = await confluenceFetch(
    `${apiBase(baseUrl)}/rest/api/content/${existing.id}`,
    "PUT",
    authHeader,
    JSON.stringify({
      version: { number: currentVersion + 1 },
      title,
      type: "page",
      body: { storage: { value: storageValue, representation: "storage" } },
    }),
  );

  if (!updateRes.ok) {
    let msg = `Confluence responded ${updateRes.status}`;
    try {
      const err = await updateRes.json() as Record<string, unknown>;
      msg = (err.message ?? err.statusMessage ?? msg) as string;
    } catch { /* keep default */ }
    throw new Error(msg);
  }

  const data = await updateRes.json() as {
    id: string;
    title: string;
    _links?: { webui?: string; base?: string };
  };

  const origin = (data._links?.base ?? baseUrl).replace(/\/$/, "");
  const webuiPath = data._links?.webui ?? `/wiki/spaces/${spaceKey}/pages/${data.id}`;
  return { pageId: data.id, url: `${origin}${webuiPath}`, title: data.title ?? title };
}
