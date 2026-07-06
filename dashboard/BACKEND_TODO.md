# Backend Tasks To Do

This dashboard is a client-only React app with no backend, no user accounts, and no shared state. Everything lives in browser React state and resets on reload. Live Claude calls run through a Vite dev-server proxy that does not exist on the deployed GitHub Pages build, and most publishing connectors are stubs.

This document is the full backend backlog needed to turn the app into a real multi-user product. It was produced from an architecture pass over seven areas, each grounded in the current code. Every item names the frontend file or state it backs so the work is traceable.

## How to read this

Each item is tagged `[priority / effort]` and lists the frontend touchpoint it replaces or backs.

- **foundational** - nothing else works without it. Build these first.
- **core** - needed for a real multi-user product.
- **enhancement** - valuable but not blocking.
- **later** - future or enterprise-tier.

Effort is a rough size (small, medium, large).

---

## 1. Identity, authentication and authorization

Accounts, sessions, org tenancy, RBAC, and the central guard every read and write passes through.

- **Identity and credential store** `[foundational / medium]` - Users table plus a separate credentials/identities table so one user can hold a password (Argon2id or bcrypt) and federated logins. Replaces the hardcoded `CurrentUser` in `src/layouts/DashboardLayout.tsx` with a real record resolved from the session.
- **Organisation, membership and org-level roles** `[foundational / medium]` - `organisations` table plus an `org_memberships` join (owner, admin, member) as the top of the tenancy model (org to clients to projects to artefacts). Every client and project gains an `org_id`, so the demo-seeded `DEMO_CLIENTS` in `src/store/workspace.tsx` become org-scoped rows. This is the boundary the "never mix clients" rule rests on.
- **Session and token management** `[foundational / medium]` - Issue sessions as httpOnly, Secure, SameSite cookies with short-lived access and rotating refresh, replacing the XSS-readable sessionStorage token pattern in `loadPersistedApis`/`persistApis` and `getClaudeApiKey`. A `/auth/session` route hydrates the SPA with the current user, org, and role. CSRF-protect state-changing routes.
- **Email/password and magic-link auth endpoints** `[foundational / medium]` - Signup, login (constant-time verify), magic-link request/consume, logout, and password reset. The SPA must be wrapped in an auth gate that redirects unauthenticated users before `WorkspaceProvider` mounts. Rate-limit to blunt credential stuffing.
- **SSO / OAuth (Google and Microsoft) with domain mapping** `[core / medium]` - OIDC login for Google Workspace and Microsoft Entra. On first login, map the verified email domain to an existing organisation so agency staff land in the right org. Reuses the identities table so one account can link password and SSO.
- **Per-client and per-project role assignments (RBAC)** `[foundational / large]` - `client_members` and `project_members` tables granting a role (viewer, editor, publisher, manager) at each level, with project access narrowing the client grant. Today `selectClient`/`selectProject` and every mutator (`addProject`, `deleteClient`, `saveArtifactValues`, `completeOrchestration`) run with zero access checks. Models access so a manager on Client A cannot even see Client B.
- **Central authorization middleware (resource guard)** `[foundational / medium]` - One `can(user, action, resource)` layer invoked on every client, project, artefact, and skill route, so access is decided server-side rather than in React state. Deny by default. An unknown resource or missing grant returns an opaque 404, not 403, to avoid leaking cross-tenant existence.
- **Invite flow (org, client, project)** `[core / medium]` - Invitations with a hashed single-use token, scope, granted role, and expiry, plus accept, revoke, and resend. An invite to a client or project creates the member row directly. Pending invites to unknown emails resolve on first sign-up.
- **User profile and effective-permissions API** `[enhancement / small]` - `GET /me` returns the profile plus a resolved capability set, so the SPA renders the real identity and disables actions the user cannot perform. Treated as a UX hint only. The middleware stays the real gate.

## 2. Data model and persistence

The datastore and every durable table that replaces the volatile React state graph, plus migrations, isolation, and backups.

- **Provision a managed Postgres datastore** `[foundational / medium]` - Adopt a single managed PostgreSQL as the source of truth. The app is already relational (org to client to project to artefact to version). Use JSONB for the schema-loose parts (`StepValues`, `intakeAnswers`, the `SkillExecution.payload` union). This is the container every other persistence item lives in.
- **Model orgs, clients and projects as tenanted tables** `[foundational / medium]` - Tables mirroring `ClientContext`/`ProjectContext` with `org_id` and `client_id` FKs, a stakeholders child table, and project phase/status/current-sprint fields. Replace client-side `c-slug-N`/`p-slug-N` id minting with server-generated UUIDs so ids are stable and unguessable. Enforce slug validation at the API boundary.
- **Artefact and version tables** `[foundational / large]` - Split into `artifacts` (project, skill, kind, current version) and `artifact_versions` (version number, status, source, `values` JSONB, markdown, `payload` JSONB, execution ref, content hash). This unifies today's two divergent stores (`artifactValues[project][skill]` and `claudeExecMap['project::skill']`). Every save inserts a new version and marks the prior superseded, never overwriting, enforcing the versioning rules that are only documented today. The content hash is the shared version signal the seen-dot and stale-cascade read.
- **Persist per-project orchestration and intake state** `[core / medium]` - A `project_skill_state` table (decision, generated, stale) plus a `project_state` row for scalars (orchestrated, risk-viz-approved, risk-scan-level, orchestration-input) and an `intake_answers` table. Backs the skill-nav indicators and lets the brief and intake answers survive reload so `regenerate()` reuses the answers the artefact was built with.
- **Model multi-record artefact collections** `[core / medium]` - Skills like meeting-notes and sprint-report hold `ArtifactRecord[]` per project. Persist as `artifact_records`, replacing the ephemeral `RecordsMap` and the module-global `recSeq` counter. Each record versions through the same mechanism so an edited note keeps history.
- **Persist live Claude execution records** `[core / medium]` - Live orchestration output (`SkillExecution`) is held in `claudeExecMap` and lost on reload. Persist as `skill_executions` (request, status, markdown, payload, timings, error). The row is the join point between a version and the exact Claude request/response that produced it, giving generation provenance.
- **Schema migrations and stored schema version with upcasting** `[foundational / medium]` - A migration tool with ordered, reversible, checked-in migrations, plus a `schema_version` stored alongside every JSONB blob. On read, upcast old blobs to the current shape (a pre-depth risk-scan defaults to low, a pre-intake artefact gets empty answers) rather than crashing the typed renderers. Without this, a deploy that changes types silently breaks older stored artefacts.
- **Enforce client-data isolation at the storage layer** `[foundational / medium]` - Guarantee a query can never return another org's rows. Use Postgres Row-Level Security with a per-connection `org_id` predicate, or a mandatory query wrapper that injects the predicate and fails closed if absent. This is the structural backbone of the product's data-separation promise, a last line even if an app-layer filter is forgotten.
- **Org-scoped cascade deletion and GDPR erasure** `[core / medium]` - Server-side deletion of a client or project and all descendants within the caller's org, plus a per-client full-erasure endpoint. Today `deleteClient`/`deleteProject` are in-memory array splices only. Consider soft-delete with a hard-purge job so accidental deletes are recoverable, plus retention policies and a subject-access export.
- **Encrypted backups, point-in-time restore, per-artefact rollback** `[enhancement / medium]` - Automated daily backups and PITR on the managed Postgres, with per-tenant partitioning so a restore never bleeds one client's data into another. Use the version history as application-level rollback so a user can restore a superseded version without a DBA. Document RTO/RPO.
- **Seed demo data through the datastore** `[enhancement / small]` - An idempotent seed migration inserting the demo clients, projects, skill states, and record seeds so a fresh account opens populated, and so the static build can fall back to a read-only seeded dataset when no server is present.

## 3. Multi-tenancy and isolation

Tenant-boundary controls beyond the base schema. The "never mix clients" rule enforced in code, not folder convention.

- **Scope chain-context assembly to one project, server-side** `[foundational / medium]` - Move the upstream-artefact concatenation that feeds Claude prompts to the server so it can only ever gather dependencies from the same org and project. This is the highest-risk leakage path today: `buildChainContext` in `src/api/artifactDigest.ts` stitches upstream markdown into the prompt, and `regenerate()` looks dependencies up from the global `claudeExecMap` by a string key where collision avoidance is only a convention.
- **Org-scoped file attachment storage with signed access** `[core / medium]` - Back the declared-but-unused `FileAttachment.storageKey` with an object store where every key is prefixed by org and project, and downloads are short-lived signed URLs issued only after an ownership check. Bucket policies deny cross-prefix reads as a second layer.
- **Per-tenant encryption key separation** `[enhancement / large]` - For orgs handling sensitive commercials, envelope-encrypt artefact bodies and connector secrets with a per-org key wrapped by a KMS master key. A leaked DB dump does not expose all tenants, and an org's data can be cryptographically shredded by destroying its key. Enterprise-tier. Lower tiers share a key behind RLS.
- **Data residency region pinning per org** `[later / large]` - Provision an org in a chosen region (EU or US) so its data is stored and processed only there, routing its API and Claude-proxy traffic to region-local infra. Matters for agencies whose contracts forbid data leaving a region.

## 4. Claude orchestration backend

The hosted proxy that replaces the dev-only Vite proxy, plus resilience, metering, caching, and plan state.

- **Server-side Claude orchestration proxy** `[foundational / large]` - A hosted service that authenticates the session, resolves the caller's Anthropic key from the vault (the browser never sees it), verifies project authorization before spending tokens, calls Anthropic, and streams over SSE. `claudeProxyPlugin` is dev-only, so live orchestration is broken on GitHub Pages, and `callClaude` today awaits the full JSON and never streams. The `realOrchestrator` SSE contract already defines the frame shape to forward.
- **Retries, timeouts, truncation and cancellation** `[core / medium]` - On the proxy: exponential backoff with jitter for 429/529/5xx honouring Retry-After, a per-request timeout, and binding the client's disconnect to the Anthropic request so cancelling a step stops upstream spend. Inspect `stop_reason` and handle `max_tokens` (the truncation bug) rather than treating a cut-off document as complete. Return structured retryable/timeout/truncated errors.
- **Token accounting, rate limiting and cost governance** `[core / medium]` - Record token usage per step keyed to user, client, and project, aggregate per tenant, and add token-bucket rate limiting. Enforce budgets with a pre-flight count-tokens estimate and a hard-stop at the cap. Once the key is server-held, one runaway session can burn the shared credential uncapped.
- **Server-side prompt cache, model config, and hosted SKILL.md library** `[core / medium]` - Move the 186 KB `SKILL_PROMPTS` map server-side so the proprietary prompt library stops shipping in every browser bundle. Freeze each `SKILL.md` as a byte-stable cached prefix and log cache-read tokens to confirm hits. Centralize model ids in server config and route by task (cheap model for planning and signal detection, stronger model for full artefacts) so upgrades are a config change.
- **Server-side plan store keyed to user and project** `[enhancement / small]` - Persist orchestration plans by plan id, user, and project instead of the module-level `activePlans` Map that clears on every new plan (so only the latest plan in one tab is runnable today). Enables resuming a multi-step run, surviving reload, and enforcing that a plan is only runnable by its creator.

## 5. Connectors and integrations

Real OAuth connections and production publish/read endpoints replacing the pasted-token model and the "coming soon" stubs, all behind an SSRF-guarded, rate-limited egress.

- **Per-user/org OAuth connection service** `[foundational / large]` - A server owning the OAuth flows for Atlassian (Jira and Confluence), Google (Drive and Gmail), and Notion, with authorize and callback routes. Replaces the manual endpoint and token paste in `ConnectorsDialog.tsx`. Users click Connect and complete a redirect. Connections keyed per user and org.
- **Production Confluence publish endpoint** `[foundational / medium]` - Do in production what `confluenceProxyPlugin` does in dev: resolve the org's stored token, run the markdown-to-storage conversion and create/update logic from `confluencePublish.ts`, and return the page URL. Removes the `IS_DEV` block that disables Publish on GitHub Pages.
- **Live Jira read endpoint** `[core / medium]` - Sprint velocity and burndown are entirely seeded stubs today. Add endpoints calling the Jira Agile and Search APIs via the stored token, returning committed vs completed points and statuses for sprint-report and sprint-planning. Build JQL server-side with the validation rules (safe project keys, quoted and escaped string values).
- **Jira write endpoint with bounded bulk creation** `[core / medium]` - Replace the Jira stub in `ArtifactViewer.tsx` with an endpoint creating an epic and child stories from a `StoriesPayload`, mapping acceptance criteria into the description. Create sequentially, require confirmation for batches over ~10, report per-item progress, and never fire an unbounded burst.
- **Google Drive export endpoint** `[core / medium]` - Convert artefact markdown to a Google Doc into a caller-specified folder, returning the Doc URL. Request only `drive.file` scope (files this app creates), per least privilege.
- **Gmail draft-only endpoint** `[core / small]` - Create a draft (never send) with the artefact as the body plus a covering note, using `gmail.compose` scope only. The never-auto-send rule is enforced at the endpoint level: there is no send route at all.
- **Notion publish endpoint** `[enhancement / medium]` - Create a page under a caller-selected parent using the org's token. Convert markdown to Notion block objects server-side, since the API takes structured blocks, not markdown. Lower priority as fewer skills target it.
- **Server-side artefact export/download service** `[core / medium]` - "Save locally" is a toast that writes nothing today, and Word/PDF export is a client-only Blob/print hack. Add an export route rendering a real .docx and true PDF server-side and streaming it as a download, optionally persisting to object storage. Gives "Save locally" a real artefact and gives connector exports one canonical rendering path.
- **SSRF-guarded, rate-limit-aware outbound HTTP client** `[core / small]` - Port `isBlockedTarget` from `src/lib/proxyGuard.ts` into the production connector service so every outbound call is validated (HTTPS only, block loopback/RFC-1918/link-local/IMDS/IPv6-ULA), combined with a positive egress allowlist of provider hosts. Wrap all provider calls in a shared client honouring Retry-After with backoff and per-org concurrency limits.
- **Connector status and disconnect/revoke API** `[enhancement / small]` - Status is inferred purely from whether a token exists in sessionStorage today. Replace with a real per-connector status, scopes, and expiry from the vault (never returning the token), plus a disconnect route that calls the provider revoke endpoint. Makes the green/red dots reflect actual connection health.

## 6. Real-time collaboration and shared seen-state

Turning the per-browser seen-dot and stale-cascade into real multi-user signals via a per-project push channel, presence, and concurrency guards. This completes the "unseen dot" work started client-side (see the note at the end).

- **Per-user last-seen version and seen-state sync API** `[core / medium]` - A `section_seen` table upserted on `markSeen`, plus a route returning each section's current version and this user's seen version so `unseenSkills` is computed at load instead of starting empty. The dot derives server-side as current version greater than seen version, and clears on open. This is the missing server half of the original unseen-dot note.
- **Optimistic-concurrency guard on save** `[core / medium]` - `ArtifactEditor` saves the entire `StepValues` at once, so two PMs editing the same PRD silently last-write-wins today. Require the client to send the base version it opened. The server rejects with 409 and the current content if the section moved underneath. This makes "do not overwrite silently" true for concurrent users.
- **Real-time push channel per project room** `[core / large]` - A per-project subscription so a section bump by PM A immediately re-flags the dot for PM B without a refresh. Rooms are authorized by membership so one client's data never reaches another client's session. SSE suffices for the one-way dot/stale/presence fan-out. Give each stream a sequence id so a reconnecting client replays only the gap.
- **Server-side downstream-stale cascade for all users** `[core / medium]` - The stale cascade (edit upstream, mark downstream stale) is computed client-side and only affects the editing browser today. Move it server-side using the same `SKILL_DEPS` graph, persist a per-section stale flag, and broadcast it. Respect the rule that the cascade only wipes downstream while orchestration is incomplete. After completion it flags stale but never deletes.
- **Presence and advisory section edit-lock** `[enhancement / medium]` - Ephemeral presence (viewing/editing) with a heartbeat TTL, broadcast to back "PM X is editing the PRD" indicators. On `beginEdit`, acquire a soft advisory lock with a TTL. A second PM sees the notice and can wait or take over. Because the editor is a whole-artefact form, the lock turns the 409 guard into a mostly-avoided edge case. Stored ephemerally (for example Redis).

## 7. Observability, security and ops

The cross-cutting spine: the credential vault, audit, logging, error tracking, security headers, and the CI/CD and environment separation needed to run everything above safely.

- **Server-side credential vault** `[foundational / medium]` - Store all connector secrets and the Anthropic key encrypted at rest via KMS-backed envelope encryption, keyed by org, connector, and user, never returned to the browser and never echoed into artefacts or backups. Today `ConnectorsDialog` writes the raw Anthropic key and Confluence token into sessionStorage and forwards them as headers, unshareable across a team and readable by any script on the page. The OAuth service writes into this vault, and the Claude proxy and every publish endpoint read from it by opaque handle. Run a refresh loop renewing tokens before expiry.
- **Append-only tenant-scoped audit log** `[core / medium]` - An uneditable, org-partitioned table written on login, role change, client/project access, artefact edit, each Claude generation (logging which artefact ids fed the prompt, for cross-client-leak detection), and every publish, export, and delete. This is the accountability half of the isolation promise and satisfies the requirement to surface security-relevant events.
- **Authorization and confirmation-token guard for outbound actions** `[core / medium]` - Every publish, export, and delete endpoint requires a short-lived, action-scoped confirmation token minted when the user clicks the button, so an injected instruction inside artefact text can never trigger a write. Confirm the artefact's org matches the connector's org before any outbound call. Wrap all server-boundary prompt assembly so ingested content is data-delimited and never executed as instructions, and log detected injection attempts.
- **Server-enforced CSP and security headers** `[core / small]` - The CSP exists only as a build-time meta tag today, with no HSTS, X-Content-Type-Options, or Referrer-Policy. Serve the full security header set as real HTTP response headers from the proxy host or CDN edge, and point `connect-src` at the new proxy origin instead of Anthropic direct (which risks a browser-direct key leak on the static build).
- **Structured server logging with request tracing** `[core / medium]` - Neither proxy emits a structured log line today, so a failing orchestration or publish is invisible server-side. Add JSON logging with a per-request correlation id propagated from client to proxy to upstream, capturing tenant, skill id, latency, token counts, and stop_reason. This is the raw material the metrics, error-tracking, and analytics items aggregate.
- **Error tracking for SPA and backend** `[core / small]` - No error tracking today, so the boot-crash path (ThemeProvider localStorage SecurityError) and swallowed failures (`regenerate`'s silent catch) are invisible in production. Wire Sentry or equivalent into the SPA ErrorBoundary and the proxy, with release tagging and source maps, scrubbing PII and secrets before send.
- **Healthchecks, uptime metrics, dependency monitoring** `[enhancement / small]` - `getOrchestratorApi` silently picks mock/real/claude and the proxy returns a bare 502 when Anthropic is unreachable, so degradation is invisible. Add liveness and readiness endpoints, synthetic checks against Anthropic and Confluence, and latency/error/saturation metrics with alerts so degradation is caught before users hit the silent demo-mode fallback.
- **Product and usage analytics with a client-data-safe schema** `[enhancement / medium]` - Which skills are run, approved, skipped, or where orchestration fails all live in ephemeral state today. Add a server-ingested analytics pipeline keyed on skill id, plan-step outcome, and funnel stage, deliberately excluding artefact bodies and client names.
- **CI/CD gates and staging/prod separation** `[foundational / medium]` - `deploy-pages.yml` ships straight to production with `npx vite build`, bypassing `tsc -b` and the vitest suite, and there is no staging environment. Add CI gates running typecheck, tests, lint, and a security scan before publish, and introduce separate staging and prod environments for the new proxy with promotion-based deploys and rollback. This is a prerequisite for safely operating every server-side item above.

---

## Recommended build order

Dependencies collapse to a clear spine. Build the foundational layer first, in this order, because almost everything else sits on it:

1. Managed Postgres datastore
2. CI/CD gates and staging/prod separation (so the backend can ship safely from day one)
3. Identity and credential store, then organisation/membership, then sessions, then the auth endpoints
4. Tenanted org/client/project tables, then the artefact and version tables, then migrations with upcasting
5. Per-client and per-project RBAC, then the central authorization middleware
6. Storage-layer isolation (RLS), then server-side chain-context scoping
7. The credential vault, then the server-side Claude orchestration proxy

Once that spine exists, the **core** items parallelize into three tracks: orchestration hardening (retries, cost governance, prompt cache), connectors (Confluence publish first, then Jira read/write, Drive, Gmail, export service), and collaboration (seen-state, concurrency guard, real-time channel, stale cascade). Layer in the **enhancement** items (presence, analytics, backups, connector status, plan store) as each track matures, and defer the **later** items (per-tenant key separation, data residency).

---

## Not yet scoped

Real gaps a commercial multi-user product needs that the seven areas above did not cover:

1. **Billing and subscriptions** - plans, seats, per-org metered usage, invoicing, and trial/paid tier gating. The token-accounting ledger is the substrate, but the cost caps are not yet tied to a paid entitlement.
2. **Transactional email and notifications** - magic links, invites, resets, and the "a teammate changed this section" signal all imply an email provider, templating, deliverability, and a notification centre. The real-time channel covers in-session only, not offline or digest notifications.
3. **Admin / back-office tooling** - an internal console for support staff to inspect an org, impersonate for debugging, suspend an org, reset a stuck orchestration, or manage the demo workspace. The defined roles are for self-service org management, not platform operators.
4. **Frontend API contract and versioning** - `getOrchestratorApi` becomes a real HTTP API, but there is no `/v1` versioning, typed client or OpenAPI schema, backward-compatibility policy, or version-skew handling during rolling deploys.
5. **Feature flags and gradual rollout** - no flag system to dark-launch the backend behind the current mock/seeded mode, gate connectors per org or plan, or A/B new skills. Demo vs live currently forks only on the presence of an API key.
6. **Legal and compliance surface** - terms of service, privacy policy, DPA, cookie consent, and a data-processing record. The product ingests third-party PII, so GDPR erasure alone is not the whole picture. No consent capture or sub-processor disclosure (Anthropic, Atlassian, Google) exists.
7. **Explicit demo / anonymous mode contract** - the static build ships seeded demo data with no server. There is no defined boundary for how that read-only mode coexists with the authenticated product (a clear "demo, sign up to save" line, and preventing demo edits from looking persistent).
8. **User onboarding and org provisioning** - the first-run experience, self-serve org creation, and seeding a new org with an empty state or starter template are not defined, only SSO domain mapping and invites.
9. **Search and retrieval across artefacts** - once artefacts are durable and multi-project, there is no full-text or semantic search over a client's accumulated charters, PRDs, and notes, which a PM co-pilot with history needs.
10. **Background job / queue infrastructure** - token-refresh loops, bulk Jira creation, export rendering, GDPR hard-purge, and stale-cascade fan-out all imply an async worker/queue tier that the items above assume exists but none owns.

---

## Original note: the multi-user unseen dot (now folded into Area 6)

For reference, the original gap this file started with. The green dot tracks, per browser, which generated or changed sections this user has not viewed. The per-user "seen" half is implemented client-side in `src/store/workspace.tsx` (`unseenSkills`, `markUnseen`, `markSeen`). The server half is now specified in Area 6 above: store each section's shared content version, store each user's last-seen version, and sync in real time or at least on refresh. The dot then shows for any user whose last-seen version is behind the latest, and the editor is marked seen on save.
