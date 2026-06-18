import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  publishToConfluence,
  updateConfluencePage,
  testConfluenceConnection,
  ConfluenceDuplicateError,
} from "@/lib/confluencePublish";

/* ── fetch mock helpers ──────────────────────────────────────────────── */

function mockFetch(responses: { status: number; body: unknown }[]) {
  let call = 0;
  return vi.fn().mockImplementation(() => {
    const r = responses[call++] ?? responses[responses.length - 1];
    return Promise.resolve({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      statusText: r.status === 200 ? "OK" : "Error",
      text: () => Promise.resolve(JSON.stringify(r.body)),
      json: () => Promise.resolve(r.body),
      headers: { get: () => "application/json" },
    });
  });
}

function captureTarget(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map((args) => {
    const headers = (args[1] as RequestInit)?.headers as Record<string, string>;
    return {
      targetUrl: headers?.["X-Confluence-Target-URL"] ?? "",
      method: headers?.["X-Confluence-Method"] ?? "",
      auth: headers?.["X-Confluence-Auth"] ?? "",
    };
  });
}

const PAGE_RESPONSE = {
  id: "123456",
  title: "Risk Scan",
  _links: { base: "https://myorg.atlassian.net", webui: "/wiki/spaces/PM/pages/123456/Risk+Scan" },
};

const SPACE_RESPONSE = { size: 3, results: [{}, {}, {}] };

const BASE_PARAMS = {
  baseUrl: "https://myorg.atlassian.net",
  token: "user@example.com:myapitoken",
  title: "Risk Scan",
  spaceKey: "PM",
  markdown: "## Risk Scan\n\n- Risk 1\n",
};

/* ═══════════════════════════════════════════════════════════════════════
   URL NORMALISATION (apiBase)  - tested indirectly via the proxy call
   ═══════════════════════════════════════════════════════════════════════ */

describe("URL normalisation (apiBase)", () => {
  beforeEach(() => { vi.stubGlobal("fetch", mockFetch([{ status: 200, body: PAGE_RESPONSE }])); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("adds /wiki for Confluence Cloud (atlassian.net)", async () => {
    await publishToConfluence(BASE_PARAMS);
    const [call] = captureTarget(fetch as ReturnType<typeof vi.fn>);
    expect(call.targetUrl).toBe("https://myorg.atlassian.net/wiki/rest/api/content");
  });

  it("strips a trailing slash from the base URL", async () => {
    await publishToConfluence({ ...BASE_PARAMS, baseUrl: "https://myorg.atlassian.net/" });
    const [call] = captureTarget(fetch as ReturnType<typeof vi.fn>);
    expect(call.targetUrl).toBe("https://myorg.atlassian.net/wiki/rest/api/content");
  });

  it("normalises a URL that already contains /wiki/rest/api (no double prefix)", async () => {
    await publishToConfluence({ ...BASE_PARAMS, baseUrl: "https://myorg.atlassian.net/wiki/rest/api" });
    const [call] = captureTarget(fetch as ReturnType<typeof vi.fn>);
    expect(call.targetUrl).toBe("https://myorg.atlassian.net/wiki/rest/api/content");
    expect(call.targetUrl).not.toContain("/wiki/rest/api/wiki");
  });

  it("does NOT add /wiki for Server / Data Center URLs", async () => {
    await publishToConfluence({ ...BASE_PARAMS, baseUrl: "https://confluence.company.com" });
    const [call] = captureTarget(fetch as ReturnType<typeof vi.fn>);
    expect(call.targetUrl).toBe("https://confluence.company.com/rest/api/content");
    expect(call.targetUrl).not.toContain("/wiki");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   AUTH HEADER CONSTRUCTION
   ═══════════════════════════════════════════════════════════════════════ */

describe("auth header construction", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("uses Basic auth for email:token format (Cloud)", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: PAGE_RESPONSE }]));
    await publishToConfluence({ ...BASE_PARAMS, token: "user@example.com:myapitoken" });
    const [call] = captureTarget(fetch as ReturnType<typeof vi.fn>);
    expect(call.auth).toBe(`Basic ${btoa("user@example.com:myapitoken")}`);
  });

  it("uses Bearer auth for a bare PAT (Server / DC)", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: PAGE_RESPONSE }]));
    await publishToConfluence({ ...BASE_PARAMS, token: "mypersonalaccesstoken" });
    const [call] = captureTarget(fetch as ReturnType<typeof vi.fn>);
    expect(call.auth).toBe("Bearer mypersonalaccesstoken");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   publishToConfluence - happy path & error paths
   ═══════════════════════════════════════════════════════════════════════ */

describe("publishToConfluence", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns pageId, url, and title on success", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: PAGE_RESPONSE }]));
    const result = await publishToConfluence(BASE_PARAMS);
    expect(result.pageId).toBe("123456");
    expect(result.title).toBe("Risk Scan");
    expect(result.url).toBe("https://myorg.atlassian.net/wiki/spaces/PM/pages/123456/Risk+Scan");
  });

  it("builds the page URL from _links.base + _links.webui (not the user-supplied base URL)", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: {
      ...PAGE_RESPONSE,
      _links: { base: "https://canonical.atlassian.net", webui: "/wiki/spaces/PM/pages/123456/Risk+Scan" },
    }}]));
    const result = await publishToConfluence({ ...BASE_PARAMS, baseUrl: "https://myorg.atlassian.net" });
    expect(result.url).toContain("https://canonical.atlassian.net");
  });

  it("includes ancestors when parentPageId is provided", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: PAGE_RESPONSE }]));
    await publishToConfluence({ ...BASE_PARAMS, parentPageId: "999" });
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.ancestors).toEqual([{ id: "999" }]);
  });

  it("does not include ancestors when parentPageId is absent", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: PAGE_RESPONSE }]));
    await publishToConfluence(BASE_PARAMS);
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.ancestors).toBeUndefined();
  });

  it("throws ConfluenceDuplicateError on 400 'already exists'", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 400, body: { message: "A page with this title already exists: 'Risk Scan'" } }]));
    await expect(publishToConfluence(BASE_PARAMS)).rejects.toBeInstanceOf(ConfluenceDuplicateError);
  });

  it("ConfluenceDuplicateError carries the page title", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 400, body: { message: "A page with this title already exists: 'Risk Scan'" } }]));
    const err = await publishToConfluence(BASE_PARAMS).catch((e) => e);
    expect((err as ConfluenceDuplicateError).pageTitle).toBe("Risk Scan");
  });

  it("throws a plain Error on 401 (not a duplicate error)", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 401, body: { message: "Unauthorized" } }]));
    const err = await publishToConfluence(BASE_PARAMS).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(ConfluenceDuplicateError);
  });

  it("throws a plain Error on non-duplicate 400", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 400, body: { message: "Bad space key" } }]));
    await expect(publishToConfluence(BASE_PARAMS)).rejects.toThrow("Bad space key");
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   updateConfluencePage
   ═══════════════════════════════════════════════════════════════════════ */

describe("updateConfluencePage", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  const SEARCH_HIT = {
    results: [{ id: "777", version: { number: 4 }, _links: { webui: "/wiki/spaces/PM/pages/777", base: "https://myorg.atlassian.net" } }],
  };
  const UPDATE_RESPONSE = {
    id: "777", title: "Risk Scan",
    _links: { base: "https://myorg.atlassian.net", webui: "/wiki/spaces/PM/pages/777/Risk+Scan" },
  };

  it("fetches the existing page then PUTs with version + 1", async () => {
    vi.stubGlobal("fetch", mockFetch([
      { status: 200, body: SEARCH_HIT },
      { status: 200, body: UPDATE_RESPONSE },
    ]));
    await updateConfluencePage(BASE_PARAMS);
    const calls = captureTarget(fetch as ReturnType<typeof vi.fn>);
    // First call: search
    expect(calls[0].method).toBe("GET");
    expect(calls[0].targetUrl).toContain("title=Risk%20Scan");
    // Second call: update
    expect(calls[1].method).toBe("PUT");
    const putBody = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body as string);
    expect(putBody.version.number).toBe(5); // 4 + 1
  });

  it("returns the updated page URL on success", async () => {
    vi.stubGlobal("fetch", mockFetch([
      { status: 200, body: SEARCH_HIT },
      { status: 200, body: UPDATE_RESPONSE },
    ]));
    const result = await updateConfluencePage(BASE_PARAMS);
    expect(result.url).toBe("https://myorg.atlassian.net/wiki/spaces/PM/pages/777/Risk+Scan");
  });

  it("throws when no matching page is found", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: { results: [] } }]));
    await expect(updateConfluencePage(BASE_PARAMS)).rejects.toThrow(/No page titled/);
  });

  it("throws when the search request fails", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 500, body: {} }]));
    await expect(updateConfluencePage(BASE_PARAMS)).rejects.toThrow(/Could not find existing page/);
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   testConfluenceConnection
   ═══════════════════════════════════════════════════════════════════════ */

describe("testConfluenceConnection", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns space count on success", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: SPACE_RESPONSE }]));
    const result = await testConfluenceConnection({ baseUrl: "https://myorg.atlassian.net", token: "user@example.com:tok" });
    expect(result.spacesCount).toBe(3);
    expect(result.detail).toContain("3 spaces");
  });

  it("uses /wiki/rest/api/space for Cloud (atlassian.net)", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 200, body: SPACE_RESPONSE }]));
    await testConfluenceConnection({ baseUrl: "https://myorg.atlassian.net", token: "user:tok" });
    const [call] = captureTarget(fetch as ReturnType<typeof vi.fn>);
    expect(call.targetUrl).toContain("/wiki/rest/api/space");
  });

  it("throws an auth error message on 401", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 401, body: {} }]));
    await expect(
      testConfluenceConnection({ baseUrl: "https://myorg.atlassian.net", token: "bad:token" }),
    ).rejects.toThrow(/Invalid credentials/);
  });

  it("throws an auth error message on 403", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 403, body: {} }]));
    await expect(
      testConfluenceConnection({ baseUrl: "https://myorg.atlassian.net", token: "bad:token" }),
    ).rejects.toThrow(/Invalid credentials/);
  });

  it("throws a status error on unexpected non-OK response", async () => {
    vi.stubGlobal("fetch", mockFetch([{ status: 404, body: {} }]));
    await expect(
      testConfluenceConnection({ baseUrl: "https://myorg.atlassian.net", token: "user:tok" }),
    ).rejects.toThrow(/404/);
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   ConfluenceDuplicateError class
   ═══════════════════════════════════════════════════════════════════════ */

describe("ConfluenceDuplicateError", () => {
  it("is an instance of Error", () => {
    expect(new ConfluenceDuplicateError("My Page")).toBeInstanceOf(Error);
  });
  it("has name ConfluenceDuplicateError", () => {
    expect(new ConfluenceDuplicateError("My Page").name).toBe("ConfluenceDuplicateError");
  });
  it("carries the page title", () => {
    expect(new ConfluenceDuplicateError("My Page").pageTitle).toBe("My Page");
  });
  it("message includes the title", () => {
    expect(new ConfluenceDuplicateError("My Page").message).toContain("My Page");
  });
});
