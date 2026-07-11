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

## Backend engineering rules (apply to every item below)

These are hard rules. Every per-skill storage design and any backend code must obey them. Planning only for now, no execution.

**Core**
- Zero-trust frontend. The frontend never bypasses backend API routes for critical data changes or permission checks.
- Explicit state machines. Model workflows as named states and transitions, never scattered booleans.
- Atomicity and idempotency. A critical action fully succeeds or fully fails, and a duplicate request returns the same result without re-running side effects (idempotency key on writes).
- API-first. Define data schemas and API endpoints before writing any UI code.
- Strict security. No hardcoded keys, never commit `.env` (verify it is gitignored), parameterized queries or an ORM only.

**Schema and constraints**
- Prefer native PostgreSQL types: UUID primary keys, TIMESTAMPTZ timestamps, JSONB for genuinely unstructured data.
- Never create a column without appropriate constraints (NOT NULL, UNIQUE, CHECK).
- Always use `CREATE TABLE IF NOT EXISTS`.
- Strict PostgreSQL dialect only (RETURNING clauses, not MySQL or SQL Server syntax). Normalize the schema.

**Migrations and state control**
- Never generate DROP TABLE or TRUNCATE without explicit confirmation.
- All schema changes go through planning files before any execution code. Never run an un-reviewed migration in one step.
- Naming is consistent across UI, API, and DB: snake_case DB columns, camelCase API fields, mapped one to one.

**Query and indexing**
- Composite indexes for frequent multi-column WHERE clauses. No indexes on low-cardinality columns like booleans.
- Select explicit columns in production queries, never SELECT *. Use EXPLAIN ANALYZE when asked to check a slow query.

**Security and access control**
- Row-Level Security on every multi-tenant or user-owned table from day one, keyed on org.
- Never pass unsanitized client input into raw SQL. Parameterized queries or ORM sanitization only.
- Config via environment: local sandbox for dev, Neon or Supabase SSL pool for prod. All credentials behind server-side env vars.

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

## Per-skill storage designs

One subsection per skill, added as each skill is worked, plus three app/harness-owned subsections (the foundational tenant tables, orchestration, and the onboarding brief) whose skills were removed but whose storage the app still needs. Each is a planning design only. No migration is executed from here. All DDL below is a proposal that must be reviewed and moved into a numbered migration file before it runs, and no DROP or TRUNCATE appears without explicit confirmation.

### Triage - PostgreSQL storage

Backs `skills/triage` and its frontend touchpoints: the intake form in `src/components/onboarding/steps.ts`, the seeded sample in `src/data/sampleArtifacts.ts`, and the rendered artefact in `DocumentView`. A triage run is one message that may carry several distinct asks, each with its own classification, urgency, impact, and next step, so the model is one request to many asks, and one ask to many missing-information items.

**Entities**
- `intake_requests` - one row per triaged message. Holds the shared requester and source facts, the raw input, and the request lifecycle status.
- `intake_asks` - one row per distinct ask inside a request. Holds that ask's summary, goal, need, urgency, impact, classification, next step, and its simple bullet lists as JSONB.
- `intake_missing_info` - one row per missing-information question, because audience and resolved state are queried (the paste-ready "ask requester" subset) and each item is answered over time.

**Enumerated types** (native enums, so the values are constrained at the column level and match the frontend selects one to one):

```sql
CREATE TYPE triage_classification AS ENUM (
  'ready_for_discovery', 'needs_clarification', 'likely_change_request',
  'needs_technical_review', 'low_priority_unclear_value'
);
CREATE TYPE triage_impact AS ENUM (
  'new_scope', 'change_request_in_flight_sow', 'duplicate_of_existing_scope',
  'standalone', 'not_checked'
);
CREATE TYPE missing_info_audience AS ENUM ('ask_requester', 'check_internally');
CREATE TYPE triage_status AS ENUM ('draft', 'triaged', 'routed', 'archived', 'superseded');
```

**Tables** (UUID keys, TIMESTAMPTZ, constraints on every column, `IF NOT EXISTS`, PostgreSQL dialect):

```sql
CREATE TABLE IF NOT EXISTS intake_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  client_id     UUID REFERENCES clients(id),        -- nullable: triage can precede a client
  project_id    UUID REFERENCES projects(id),        -- nullable: triage can precede a project
  requester_name  TEXT,
  requester_role  TEXT,
  source_channel  TEXT,
  received_date   DATE,
  cited_authority TEXT,                              -- set when the sender relays someone else
  raw_input       TEXT NOT NULL,                     -- original message, stored verbatim, never interpolated into SQL
  status        triage_status NOT NULL DEFAULT 'draft',
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT intake_requests_idem_unique UNIQUE (org_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS intake_asks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES intake_requests(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),   -- denormalized for the RLS predicate
  seq           SMALLINT NOT NULL CHECK (seq > 0),
  summary       TEXT NOT NULL,
  business_goal TEXT,
  stakeholder_need TEXT,
  urgency       TEXT,
  impact_on_current_work triage_impact NOT NULL DEFAULT 'not_checked',
  classification triage_classification NOT NULL,
  recommended_next_step TEXT,
  what_is_clear   JSONB NOT NULL DEFAULT '[]'::jsonb,   -- array of strings, simple bullets
  risks_concerns  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT intake_asks_seq_unique UNIQUE (request_id, seq),
  CONSTRAINT what_is_clear_is_array CHECK (jsonb_typeof(what_is_clear) = 'array'),
  CONSTRAINT risks_concerns_is_array CHECK (jsonb_typeof(risks_concerns) = 'array')
);

CREATE TABLE IF NOT EXISTS intake_missing_info (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ask_id     UUID NOT NULL REFERENCES intake_asks(id) ON DELETE CASCADE,
  org_id     UUID NOT NULL REFERENCES organisations(id),
  question   TEXT NOT NULL,
  audience   missing_info_audience NOT NULL,
  resolved   BOOLEAN NOT NULL DEFAULT false,
  resolved_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes** (composite for the real multi-column filters, none on a low-cardinality column alone):

```sql
-- list a project's intakes by lifecycle state
CREATE INDEX IF NOT EXISTS idx_intake_requests_project_status ON intake_requests (org_id, project_id, status);
-- a client's most recent intakes
CREATE INDEX IF NOT EXISTS idx_intake_requests_client_recent ON intake_requests (org_id, client_id, created_at DESC);
-- route by classification within a tenant (org_id leads, classification is the low-cardinality tail)
CREATE INDEX IF NOT EXISTS idx_intake_asks_classification ON intake_asks (org_id, classification);
-- the paste-ready open-questions subset for one ask (ask_id leads)
CREATE INDEX IF NOT EXISTS idx_missing_info_open ON intake_missing_info (ask_id, audience, resolved);
```

**Row-Level Security** (enabled from day one, org-scoped, set per transaction from the authenticated session):

```sql
ALTER TABLE intake_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_asks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_missing_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY intake_requests_tenant ON intake_requests
  USING (org_id = current_setting('app.current_org_id')::uuid);
-- same policy shape on intake_asks and intake_missing_info
```

**Lifecycle as an explicit state machine** (enforced in the service layer, never by the frontend):
- `draft` to `triaged` once the analysis is written.
- `triaged` to `routed` when the ask is handed on per its classification (needs_technical_review to tech-review, ready_for_discovery to discovery, likely_change_request to decision-log).
- `triaged` to `superseded` when a re-triage of the same message replaces it (the old row is kept, never deleted).
- any state to `archived`.
Any other transition is rejected. Status only changes through the backend.

**API (defined before any UI work, zero-trust, snake_case DB to camelCase API):**
- `POST /orgs/:orgId/intake-requests` - creates the request, its asks, and their missing-info rows in one transaction. Honours an `Idempotency-Key` header via `intake_requests.idempotency_key` so a retried submit returns the same resource rather than duplicating it. Uses parameterized inserts and `RETURNING` to hand back the created rows.
- `GET /orgs/:orgId/intake-requests?projectId=&status=` - list view, selecting explicit columns only.
- `GET /orgs/:orgId/intake-requests/:id` - full detail, joining asks and missing-info.
- `PATCH /orgs/:orgId/intake-requests/:id/status` - a state transition validated against the machine above, server-side.
- `PATCH /orgs/:orgId/intake-requests/:id/missing-info/:itemId` - mark a question resolved with its answer.

**Field mapping (UI to API to DB):** requesterName to `requester_name`, sourceChannel to `source_channel`, impactOnCurrentWork to `impact_on_current_work`, classification to `classification`, and each Missing Information row to an `intake_missing_info` row with its audience. The frontend select values map directly onto the enum labels, so a value the UI cannot produce is also rejected by the column type.

**Atomicity and idempotency:** the create path is a single transaction across all three tables, so a partial triage never persists, and the idempotency key makes a duplicate submit a no-op that returns the first result.

---

### Risk-scan - PostgreSQL storage

Backs `skills/risk-scan` and its frontend: the register form in `src/components/onboarding/steps.ts`, the stub extras in `src/components/onboarding/buildArtifact.ts`, the seeded sample in `src/data/sampleArtifacts.ts`, and the `RiskScanView` visual. The defining requirement is the re-scan behaviour: risk ids (R1, R2 ...) are stable across scans of the same project, and each scan carries a Changes Since Last Scan delta. That is modelled by giving a risk a project-level identity, and snapshotting its scored state per scan, so the delta is a query rather than stored prose.

**Entities**
- `risks` - project-level register entries with a stable `ref` and an open or closed lifecycle. Identity persists across scans.
- `risk_scans` - one row per scan run (the report header, verdict, and the narrative sections).
- `risk_assessments` - one row per (scan, risk): the scored snapshot plus the top-risk detail for that scan. Diffing consecutive assessments produces the Changes Since Last Scan block.
- `risk_assumptions`, `risk_decisions`, `risk_experiments` - per-scan child rows for the analytical sections. Simple bullet lists (conditions, not-assessed) are JSONB on the scan.

**Enumerated types**

```sql
CREATE TYPE risk_depth AS ENUM ('low', 'medium', 'high');
CREATE TYPE rag_status AS ENUM ('red', 'amber', 'green');
CREATE TYPE risk_recommendation AS ENUM ('proceed', 'proceed_with_conditions', 'escalate', 'pause');
CREATE TYPE risk_priority AS ENUM ('act_now', 'monitor', 'contingency', 'log');
CREATE TYPE hml AS ENUM ('H', 'M', 'L');
CREATE TYPE detectability AS ENUM ('easy', 'moderate', 'hard');
CREATE TYPE velocity AS ENUM ('fast', 'medium', 'slow');
CREATE TYPE risk_response AS ENUM ('mitigate', 'transfer', 'avoid', 'accept', 'escalate');
CREATE TYPE risk_proximity AS ENUM ('week_1_2', 'month_1', 'month_2_3', 'later');
CREATE TYPE risk_lifecycle AS ENUM ('open', 'closed');
CREATE TYPE risk_scan_status AS ENUM ('draft', 'final', 'superseded', 'archived');
CREATE TYPE risk_category AS ENUM (
  'product', 'customer', 'adoption', 'delivery', 'technical', 'security',
  'compliance', 'operational', 'dependency', 'stakeholder', 'business'
);
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS risks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  ref          TEXT NOT NULL,                       -- stable per project, e.g. 'R1'
  title        TEXT NOT NULL,                        -- event and consequence, not a topic
  category     risk_category NOT NULL,
  status       risk_lifecycle NOT NULL DEFAULT 'open',
  opened_scan_id UUID,                               -- scan that first raised it
  closed_scan_id UUID,                               -- scan that closed it, null while open
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at    TIMESTAMPTZ,
  CONSTRAINT risks_ref_unique UNIQUE (project_id, ref),
  CONSTRAINT risks_closed_consistency CHECK (
    (status = 'closed') = (closed_scan_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS risk_scans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  client_id    UUID REFERENCES clients(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  prior_scan_id UUID REFERENCES risk_scans(id),      -- the scan this one supersedes, null on first run
  phase        TEXT NOT NULL,
  depth        risk_depth NOT NULL DEFAULT 'medium',
  verdict      rag_status NOT NULL,
  recommendation risk_recommendation,
  conditions   JSONB NOT NULL DEFAULT '[]'::jsonb,    -- string[]
  stakeholder_summary   TEXT,
  prioritisation_reasoning TEXT,
  not_assessed JSONB NOT NULL DEFAULT '{"critical":[],"secondary":[]}'::jsonb,
  next_review  DATE,
  status       risk_scan_status NOT NULL DEFAULT 'draft',
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT risk_scans_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT conditions_is_array CHECK (jsonb_typeof(conditions) = 'array')
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       UUID NOT NULL REFERENCES risk_scans(id) ON DELETE CASCADE,
  risk_id       UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  likelihood    hml NOT NULL,
  impact        hml NOT NULL,
  priority      risk_priority NOT NULL,
  detectability detectability NOT NULL,
  velocity      velocity NOT NULL,
  response      risk_response NOT NULL,
  owner         TEXT NOT NULL,                        -- a name for act_now, a role otherwise
  proximity     risk_proximity,
  trigger_signal TEXT,                                -- required when detectability = 'hard'
  is_top_risk   BOOLEAN NOT NULL DEFAULT false,
  root_cause    TEXT,                                 -- top-risk detail, null for non-top risks
  why_exposed   TEXT,
  exposure      TEXT,
  next_action   TEXT,
  CONSTRAINT risk_assessments_unique UNIQUE (scan_id, risk_id),
  CONSTRAINT trigger_required_when_hard CHECK (detectability <> 'hard' OR trigger_signal IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS risk_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES risk_scans(id) ON DELETE CASCADE,
  org_id  UUID NOT NULL REFERENCES organisations(id),
  assumption TEXT NOT NULL,
  confidence hml NOT NULL,
  risk_if_wrong TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS risk_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES risk_scans(id) ON DELETE CASCADE,
  org_id  UUID NOT NULL REFERENCES organisations(id),
  decision TEXT NOT NULL,
  owner TEXT NOT NULL,
  by_date TEXT,
  impact_if_delayed TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS risk_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES risk_scans(id) ON DELETE CASCADE,
  org_id  UUID NOT NULL REFERENCES organisations(id),
  risk_ref TEXT NOT NULL,
  experiment TEXT NOT NULL,
  testing TEXT NOT NULL,
  learning TEXT NOT NULL,
  by_date TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_risk_scans_latest ON risk_scans (org_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risks_open ON risks (org_id, project_id, status);
CREATE INDEX IF NOT EXISTS idx_assessments_by_scan_priority ON risk_assessments (org_id, scan_id, priority);
CREATE INDEX IF NOT EXISTS idx_assessments_by_risk ON risk_assessments (risk_id);   -- one risk's history across scans
CREATE INDEX IF NOT EXISTS idx_risk_assumptions_scan ON risk_assumptions (scan_id);
CREATE INDEX IF NOT EXISTS idx_risk_decisions_scan ON risk_decisions (scan_id);
CREATE INDEX IF NOT EXISTS idx_risk_experiments_scan ON risk_experiments (scan_id);
```

**Row-Level Security** - enable on all six tables with the org predicate `USING (org_id = current_setting('app.current_org_id')::uuid)`, same pattern as the intake tables.

**Stable ref allocation (in the create transaction, server-side):**
1. Load the project's existing `risks` rows.
2. For each risk in the new scan that matches an open risk (by ref carried in the payload, or by a match rule), reuse its `ref` and `risks.id`.
3. For a genuinely new risk, allocate `ref` = 'R' plus (max ref number ever used on the project, plus one). Never reuse a closed risk's ref.
4. Insert one `risk_assessments` row per risk for this scan. Mark risks absent from this scan as closed (set `status`, `closed_scan_id`, `closed_at`).

**Changes Since Last Scan is derived, not stored.** Given `prior_scan_id`, compute the delta by joining this scan's assessments to the prior scan's on `risk_id`:
- new: risk has an assessment in this scan and none in the prior scan.
- escalated / de-escalated: `priority` moved worse or better between the two assessments.
- closed: risk closed by this scan.
A read endpoint returns the delta alongside the scan. Persist a snapshot only if a fully immutable report copy is later required.

**Lifecycle state machine** (`risk_scan_status`, enforced server-side): `draft` to `final` when the scan is issued, `final` to `superseded` when a later scan sets it as `prior_scan_id`, any state to `archived`. No other transition.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/risk-scans` - creates the scan, upserts risks by ref, inserts assessments and child rows, in one transaction, with an `Idempotency-Key`. Returns the scan with its computed delta via `RETURNING` plus the derived diff.
- `GET /projects/:projectId/risk-scans/latest` and `GET /risk-scans/:id` - the scan with register, top-risk detail, assumptions, decisions, experiments, and the Changes Since Last Scan delta.
- `GET /projects/:projectId/risks?status=open` - the live register across scans.
- `PATCH /risk-scans/:id/status` - a validated state transition.

**Field mapping (UI to API to DB):** register row fields map to `risk_assessments` columns (triggerSignal to `trigger_signal`, nextAction to `next_action`), `topRisksDetail` to the `root_cause` / `why_exposed` / `exposure` / `action` columns on the top-risk assessment rows (`is_top_risk = true`), `mitigationActions` derive from assessments where `response = 'mitigate'` and the risk is not a top risk, `validationExperiments` to `risk_experiments`, and `changesSinceLastScan` is computed, not written.

**Atomicity and idempotency:** the whole scan (ref allocation, risk upserts, assessments, child rows, prior-scan supersede) is one transaction, so a half-written scan never persists, and the idempotency key makes a duplicate submit return the first scan.

---

### Charter - PostgreSQL storage

Backs `skills/charter` and its frontend: the charter form in `src/components/onboarding/steps.ts`, its stub in `TEST_DATA`, the seeded sample in `src/data/sampleArtifacts.ts`, and the generic `DocumentView`. The defining requirement is re-baselining: a charter is a formal agreement that is reissued with the version bumped and a "Changes since vN" note, and it carries sign-off. So a charter has one identity per project and many immutable versions, and the newest approved version is the live one.

**Entities**
- `charters` - one per project, pointing at the current version.
- `charter_versions` - an immutable snapshot of the whole charter body for one version number, with its own approval status.
- Child tables per version for the structured sections. Pure string lists (objectives, constraints) are JSONB on the version.

**Enumerated types** (reuse `hml` from the risk-scan design; do not redefine it):

```sql
CREATE TYPE charter_version_status AS ENUM ('draft', 'approved', 'superseded');
CREATE TYPE charter_scope_kind AS ENUM ('in', 'out');
CREATE TYPE charter_assumption_kind AS ENUM ('assumed', 'proposed');
CREATE TYPE charter_commercial_basis AS ENUM ('fixed_price', 'time_and_materials', 'internal_cost');
```

**Core tables**

```sql
CREATE TABLE IF NOT EXISTS charters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  current_version_id UUID,                            -- newest approved version, set on approval
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT charters_project_unique UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS charter_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charter_id    UUID NOT NULL REFERENCES charters(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  version_number INT NOT NULL CHECK (version_number >= 1),
  status        charter_version_status NOT NULL DEFAULT 'draft',
  project_name  TEXT NOT NULL,
  prepared_by   TEXT,
  charter_date  DATE,
  changes_since TEXT,                                 -- "Changes since vN" note, null on v1
  purpose       TEXT NOT NULL,
  objectives    JSONB NOT NULL DEFAULT '[]'::jsonb,   -- string[]
  constraints   JSONB NOT NULL DEFAULT '[]'::jsonb,   -- string[]
  estimated_cost TEXT,
  contingency   TEXT,
  commercial_basis charter_commercial_basis,
  commercial_basis_assumed BOOLEAN NOT NULL DEFAULT false,
  budget_includes TEXT,
  budget_includes_assumed BOOLEAN NOT NULL DEFAULT false,
  budget_owner  TEXT,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT charter_versions_number_unique UNIQUE (charter_id, version_number),
  CONSTRAINT charter_versions_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT objectives_is_array CHECK (jsonb_typeof(objectives) = 'array'),
  CONSTRAINT constraints_is_array CHECK (jsonb_typeof(constraints) = 'array')
);
```

**Child tables** (all reference `charter_versions(id) ON DELETE CASCADE`, all carry `org_id` for RLS, all have a `sort_order SMALLINT NOT NULL DEFAULT 0`):

```sql
CREATE TABLE IF NOT EXISTS charter_scope_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  kind charter_scope_kind NOT NULL,
  item TEXT NOT NULL,
  proposed BOOLEAN NOT NULL DEFAULT false,            -- true for a derived [proposed - confirm] boundary
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS charter_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL, description TEXT, due TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS charter_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  name_role TEXT NOT NULL, responsibility TEXT NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS charter_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL, detail TEXT NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS charter_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  milestone TEXT NOT NULL, target_date TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS charter_top_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  risk TEXT NOT NULL, likelihood hml NOT NULL, impact hml NOT NULL, response TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS charter_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  kind charter_assumption_kind NOT NULL,              -- assumed vs proposed-confirm, drives the Assumptions Log
  statement TEXT NOT NULL, why TEXT, confirm_by TEXT, confirmed BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS charter_client_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  dependency TEXT NOT NULL, needed_by TEXT, owner TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS charter_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES charter_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  role TEXT NOT NULL, approver_name TEXT, signed_at TIMESTAMPTZ, signature_ref TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_charters_project ON charters (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_charter_versions_charter ON charter_versions (charter_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_charter_versions_status ON charter_versions (org_id, charter_id, status);
-- each child table gets a version_id FK index, e.g.:
CREATE INDEX IF NOT EXISTS idx_charter_scope_version ON charter_scope_items (version_id);
```

**Row-Level Security** - enable on `charters`, `charter_versions`, and every child table with the org predicate `USING (org_id = current_setting('app.current_org_id')::uuid)`.

**Re-baseline logic (the charter-specific behaviour):**
1. On create for a project with no charter, insert `charters`, then `charter_versions` at `version_number = 1`, status `draft`.
2. On re-baseline (a charter already exists), read the latest version, insert a new `charter_versions` at `max(version_number) + 1`, copy forward the child rows, apply the described changes, and set `changes_since` to a one-line note.
3. On approval, set the version `status = 'approved'`, mark the prior approved version `superseded`, and update `charters.current_version_id`. A version is never edited in place once approved, which preserves the signed record.

**Lifecycle state machine** (`charter_version_status`, server-side): `draft` to `approved` on sign-off, `approved` to `superseded` when a later version is approved. No other transition. Sign-off writes `charter_approvals.signed_at` and requires the required approver rows to be present.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/charter` - creates version 1 (or a re-baselined next version if one exists) with all child rows in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/charter` - the current (or latest) version with all sections.
- `GET /projects/:projectId/charter/versions` - the version history.
- `PATCH /charter-versions/:id/status` - approve or supersede, validated against the machine.

**Field mapping (UI to API to DB):** governance rows to `charter_governance`, clientDependencies to `charter_client_dependencies`, constraints/assumptions to `charter_constraints` JSONB and `charter_assumptions` (with `kind` set from the `[assumed]` or `[proposed - confirm]` tag), the budget "Commercial basis" and "Includes / excludes" lines to `commercial_basis` / `budget_includes` with their `_assumed` flags, and the Assumptions Log is a read view over `charter_assumptions` rather than a separate table.

**Atomicity and idempotency:** a version plus all its child rows is one transaction, so a half-written charter never persists, and the idempotency key makes a duplicate submit return the first version.

---

### Discovery - PostgreSQL storage

Backs `skills/discovery` and its frontend: the discovery form in `src/components/onboarding/steps.ts` (Summarise-shaped), its stub, the seeded sample, and `DocumentView`. Discovery has two modes with different outputs, so two artefact tables. The Summarise findings doc is the primary persisted artefact and consolidates one or more sessions, so its sessions are a child table and each finding carries its source.

**Entities**
- `discovery_findings` - the Summarise findings doc (the main artefact), with child tables for its structured sections.
- `discovery_sessions` - the sessions a findings doc consolidates (multi-session support).
- `discovery_plans` - the Plan mode workshop plan, mostly semi-structured, so JSONB-heavy.

**Enumerated types**

```sql
CREATE TYPE discovery_confidence AS ENUM ('high', 'medium', 'low');
CREATE TYPE discovery_readiness AS ENUM ('ready', 'not_ready');
CREATE TYPE discovery_session_type AS ENUM ('workshop', 'interview');
CREATE TYPE discovery_status AS ENUM ('draft', 'final', 'superseded', 'archived');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS discovery_findings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  client_id    UUID REFERENCES clients(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  prepared_by  TEXT,
  real_problem TEXT NOT NULL,
  success_criteria TEXT,
  readiness_status   discovery_readiness,
  readiness_blockers TEXT,                            -- required when readiness_status = 'not_ready'
  status       discovery_status NOT NULL DEFAULT 'draft',
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT discovery_findings_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT readiness_blockers_when_not_ready CHECK (readiness_status <> 'not_ready' OR readiness_blockers IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  findings_id UUID NOT NULL REFERENCES discovery_findings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  session_date DATE, session_type discovery_session_type NOT NULL, label TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discovery_affected (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  findings_id UUID NOT NULL REFERENCES discovery_findings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  stakeholder TEXT NOT NULL, pain TEXT, impact TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discovery_key_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  findings_id UUID NOT NULL REFERENCES discovery_findings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  ref TEXT NOT NULL,                                  -- F1, F2 ...
  finding TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'session notes - unattributed',
  confidence discovery_confidence NOT NULL,
  session_id UUID REFERENCES discovery_sessions(id),  -- which session it came from, for multi-session
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discovery_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  findings_id UUID NOT NULL REFERENCES discovery_findings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  conflict TEXT NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discovery_unknowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  findings_id UUID NOT NULL REFERENCES discovery_findings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  unknown TEXT NOT NULL, why_matters TEXT, how_to_resolve TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discovery_next_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  findings_id UUID NOT NULL REFERENCES discovery_findings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  action TEXT NOT NULL, owner TEXT, by_when TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discovery_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  session_date DATE, duration TEXT, facilitator TEXT,
  session_goal TEXT,
  attendees      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[]
  missing_voices JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[] - roles not in the room
  key_unknowns   JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[]
  before_bring   JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[] pre-read data asks
  agenda         JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{time, block, purpose}]
  question_overrides JSONB NOT NULL DEFAULT '[]'::jsonb, -- any non-default questions incl. the solution-first block
  status       discovery_status NOT NULL DEFAULT 'draft',
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT discovery_plans_idem_unique UNIQUE (org_id, idempotency_key)
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_discovery_findings_latest ON discovery_findings (org_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_plans_latest ON discovery_plans (org_id, project_id, created_at DESC);
-- FK indexes on each findings child, e.g.:
CREATE INDEX IF NOT EXISTS idx_discovery_key_findings_doc ON discovery_key_findings (findings_id);
```

**Row-Level Security** - enable on all nine tables with the org predicate, same pattern as the other skills.

**Multi-session consolidation:** a re-run with more notes updates the same `discovery_findings` row for the project rather than minting a new one. Add the new `discovery_sessions` rows, attach new findings to them via `session_id`, raise a finding's `confidence` where two sessions agree, and route cross-session contradictions into `discovery_conflicts`.

**Internal versus playback visibility:** the stored findings are always the candid internal version, with named `source` values. The playback version is a read-time transform, never a second stored copy: roll `source` up to role level and drop named political comments. It is produced only at the publish or client-facing save endpoint, behind the same confirmation-token guard as every outbound action (see the authorization guard in Area 7). Never auto-publish the candid version to a client destination.

**Lifecycle state machine** (`discovery_status`, server-side): `draft` to `final` when issued, `final` to `superseded` when a later consolidation replaces it, any state to `archived`.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/discovery/findings` - creates or consolidates the findings doc with all child rows and sessions in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/discovery/findings` - the latest findings, with an optional `?view=playback` that applies the role-level transform server-side.
- `POST /projects/:projectId/discovery/plan` and `GET .../plan` - the workshop plan.
- `PATCH /discovery-findings/:id/status` - a validated transition.

**Field mapping (UI to API to DB):** affected rows to `discovery_affected` (stakeholder / pain / impact), findings rows to `discovery_key_findings` (finding / source / confidence, source defaulting to the unattributed marker), unknowns to `discovery_unknowns`, nextSteps to `discovery_next_steps`, and the readiness textarea to `readiness_status` plus `readiness_blockers`.

**Atomicity and idempotency:** the findings doc, its sessions, and all child rows are one transaction, and the idempotency key makes a duplicate submit return the first doc.

---

### PRD - PostgreSQL storage

Backs `skills/prd` and its frontend: the PRD form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, and `DocumentView`. Like charter, the PRD has an explicit update mode (revise an existing PRD, bump the version, record a Scope Change, suggest a decision-log entry), so it is modeled as a PRD with immutable versions.

**Entities**
- `prds` - one per project, pointing at the current version.
- `prd_versions` - an immutable snapshot of one version (PRD or BRD), with its own status. Simple string lists (assumptions, constraints, out-of-scope) are JSONB on the version.
- Child tables per version for the structured sections.

**Enumerated types**

```sql
CREATE TYPE prd_doc_type AS ENUM ('prd', 'brd');
CREATE TYPE prd_version_status AS ENUM ('draft', 'approved', 'superseded');
CREATE TYPE moscow AS ENUM ('must', 'should', 'could', 'wont');
CREATE TYPE prd_dependency_status AS ENUM ('confirmed', 'pending', 'blocked');
CREATE TYPE prd_signoff_status AS ENUM ('pending', 'approved', 'rejected');
```

**Core tables**

```sql
CREATE TABLE IF NOT EXISTS prds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  current_version_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT prds_project_unique UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS prd_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id        UUID NOT NULL REFERENCES prds(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  version_label TEXT NOT NULL,                        -- '1.0', '1.1', matches the doc Version field
  version_seq   INT NOT NULL,                          -- monotonic ordering behind the label
  doc_type      prd_doc_type NOT NULL DEFAULT 'prd',
  status        prd_version_status NOT NULL DEFAULT 'draft',
  project_name  TEXT NOT NULL,
  purpose_background TEXT NOT NULL,
  assumptions   JSONB NOT NULL DEFAULT '[]'::jsonb,   -- string[]
  constraints   JSONB NOT NULL DEFAULT '[]'::jsonb,   -- string[]
  out_of_scope  JSONB NOT NULL DEFAULT '[]'::jsonb,   -- string[]
  approvers     JSONB NOT NULL DEFAULT '[]'::jsonb,   -- string[] roles
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT prd_versions_seq_unique UNIQUE (prd_id, version_seq),
  CONSTRAINT prd_versions_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT prd_assumptions_is_array CHECK (jsonb_typeof(assumptions) = 'array'),
  CONSTRAINT prd_constraints_is_array CHECK (jsonb_typeof(constraints) = 'array'),
  CONSTRAINT prd_out_of_scope_is_array CHECK (jsonb_typeof(out_of_scope) = 'array')
);
```

**Child tables** (all reference `prd_versions(id) ON DELETE CASCADE`, all carry `org_id`, all have `sort_order SMALLINT NOT NULL DEFAULT 0`):

```sql
CREATE TABLE IF NOT EXISTS prd_scope_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  ref TEXT NOT NULL, change TEXT NOT NULL, original TEXT, updated TEXT,
  confirmed_by TEXT, confirmed_on DATE, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS prd_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  goal TEXT NOT NULL, metric TEXT, baseline TEXT, target TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS prd_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  role TEXT NOT NULL, who_they_are TEXT, primary_need TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS prd_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL, steps JSONB NOT NULL DEFAULT '[]'::jsonb, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS prd_functional_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  ref TEXT NOT NULL,                                  -- FR-01 ...
  feature_area TEXT,                                   -- the grouping the FR sits under
  requirement TEXT NOT NULL, priority moscow NOT NULL, notes TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT prd_fr_ref_unique UNIQUE (version_id, ref)
);
CREATE TABLE IF NOT EXISTS prd_nfrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  ref TEXT NOT NULL, category TEXT NOT NULL, requirement TEXT NOT NULL, target TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS prd_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  dependency TEXT NOT NULL, dep_type TEXT, owner TEXT, status prd_dependency_status NOT NULL DEFAULT 'pending',
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS prd_open_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  ref TEXT NOT NULL, question TEXT NOT NULL, owner TEXT, by_when TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS prd_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES prd_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  role TEXT NOT NULL, approver_name TEXT, status prd_signoff_status NOT NULL DEFAULT 'pending',
  signed_at TIMESTAMPTZ, sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_prds_project ON prds (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_prd_versions_prd ON prd_versions (prd_id, version_seq DESC);
CREATE INDEX IF NOT EXISTS idx_prd_versions_status ON prd_versions (org_id, prd_id, status);
CREATE INDEX IF NOT EXISTS idx_prd_fr_version ON prd_functional_requirements (version_id);
-- one FK index per child table, e.g. idx_prd_goals_version on prd_goals (version_id)
```

**Row-Level Security** - enable on `prds`, `prd_versions`, and every child table with the org predicate.

**Update-mode logic (mirrors charter):**
1. First write for a project inserts `prds`, then `prd_versions` at `version_seq = 1`, `version_label = '1.0'`, status `draft`.
2. Update mode: read the latest version, insert a new `prd_versions` at `version_seq + 1` with `version_label` bumped (1.0 to 1.1), copy forward child rows, apply the change, and add a `prd_scope_changes` row with `confirmed_by` and `confirmed_on`. Apply the quality rules to changed FRs only.
3. On approval, set the version `status = 'approved'`, mark the prior approved version `superseded`, update `prds.current_version_id`. Approved versions are never edited in place.
4. Large-scope split (the Step 2 40-to-50 FR check) is represented as separate `prds` rows per phase or epic, not a single oversized version.

**Lifecycle state machine** (`prd_version_status`, server-side): `draft` to `approved` on sign-off, `approved` to `superseded` when a later version is approved. Sign-off writes `prd_signoffs.signed_at` and requires the named approver rows.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/prd` - creates version 1 or a re-baselined next version with all child rows in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/prd` - the current or latest version with all sections.
- `GET /projects/:projectId/prd/versions` - version history.
- `PATCH /prd-versions/:id/status` - approve or supersede, validated.

**Field mapping (UI to API to DB):** goals rows to `prd_goals` (with `baseline`), journeys to `prd_journeys` (steps split into a JSONB array of lines), functional to `prd_functional_requirements` (with `feature_area` and `priority` as the `moscow` enum), dependencies to `prd_dependencies` (status as the `prd_dependency_status` enum), scopeChanges to `prd_scope_changes`, signOff to `prd_signoffs`, and assumptions / constraints / outOfScope to the JSONB columns on `prd_versions`.

**Atomicity and idempotency:** a version plus all its child rows is one transaction, and the idempotency key makes a duplicate submit return the first version.

---

### Stories - PostgreSQL storage

Backs `skills/stories` and its frontend: the epics form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, and the bespoke `StoriesView`. Stories are living backlog items under a project, not a per-run snapshot, so a re-run against a revised PRD dedups and extends rather than duplicating (the skill's covered / partially covered / new diff). Each story traces back to a PRD requirement, carries an indicative size that may be TBD, and may hold a Jira key once pushed.

**Entities**
- `story_epics` - epics under a project, each optionally linked to the PRD version it was derived from.
- `stories` - the stories under an epic, with a MoSCoW priority, an FR traceability link, an indicative estimate, acceptance criteria as JSONB, and a Jira key when pushed.
- Requirement coverage is a derived query (PRD FRs left-joined to their linked stories), never stored prose.

**Enumerated types** (reuse `moscow` from the PRD design; do not redefine it):

```sql
CREATE TYPE story_size AS ENUM ('1', '2', '3', '5', '8', '13', '21');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS story_epics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  source_prd_version_id UUID REFERENCES prd_versions(id),  -- the PRD the epic was derived from
  jira_key     TEXT,                                        -- set once pushed to Jira
  name         TEXT NOT NULL,
  summary      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT story_epics_jira_unique UNIQUE (project_id, jira_key)
);

CREATE TABLE IF NOT EXISTS stories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  epic_id      UUID NOT NULL REFERENCES story_epics(id) ON DELETE CASCADE,
  jira_key     TEXT,
  title        TEXT NOT NULL,
  as_a         TEXT,
  i_want       TEXT,
  so_that      TEXT,
  acceptance_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,   -- string[]
  priority     moscow NOT NULL,
  estimate     story_size,                                  -- indicative PM size, null when pending
  estimate_pending BOOLEAN NOT NULL DEFAULT false,           -- true = "TBD - team to estimate"
  linked_fr_id UUID REFERENCES prd_functional_requirements(id), -- traceability, null for design-only stories
  linked_requirement_ref TEXT,                               -- 'FR-04' or 'None', mirrors the UI value
  status       TEXT,                                         -- Jira statuses are configurable, so free text
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT stories_jira_unique UNIQUE (project_id, jira_key),
  CONSTRAINT ac_is_array CHECK (jsonb_typeof(acceptance_criteria) = 'array'),
  CONSTRAINT estimate_pending_consistency CHECK (NOT (estimate_pending AND estimate IS NOT NULL))
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_story_epics_project ON story_epics (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_stories_epic ON stories (epic_id);
CREATE INDEX IF NOT EXISTS idx_stories_coverage ON stories (org_id, project_id, linked_fr_id);  -- coverage query
```

**Row-Level Security** - enable on both tables with the org predicate.

**Requirement coverage is derived, not stored.** Orphaned requirements are the PRD's functional requirements for the project's current version that have no linked story:

```sql
SELECT fr.ref
FROM prd_functional_requirements fr
JOIN prd_versions v ON v.id = fr.version_id
JOIN prds p ON p.current_version_id = v.id AND p.project_id = $1
LEFT JOIN stories s ON s.linked_fr_id = fr.id
WHERE s.id IS NULL;
```

The one-line coverage note the UI shows is generated from this result.

**Dedup on re-run (the skill's overlap handling):** when generating against a revised PRD, match incoming stories to existing ones within the epic (by `jira_key`, else by a title match), classify each covered / partially covered (update the existing row) / new (insert), and never create a near-duplicate of an in-flight story. When Jira is connected, fetch the epic's child stories first so the diff is against the live board.

**Jira push is a bounded, guarded outbound action** (see Areas 5 and 7): create an epic and its stories sequentially, require an action-scoped confirmation for batches over roughly 10, map `acceptance_criteria` into the Jira description, write the returned keys back to `jira_key`, and never fire an unbounded burst. Sizes are indicative and are not pushed as committed estimates.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/stories` - generate or dedup-merge epics and stories in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/stories` - epics with nested stories and the derived coverage note.
- `GET /projects/:projectId/stories/coverage` - the orphaned-requirement list.
- `POST /projects/:projectId/stories/push-jira` - the bounded, confirmed bulk create.

**Field mapping (UI to API to DB):** epics to `story_epics`, stories to `stories` (priority as the `moscow` enum, points to `estimate` or `estimate_pending` when the UI value is TBD, linkedRequirement to `linked_requirement_ref` plus a resolved `linked_fr_id` where it matches a PRD FR, acceptance criteria split into the JSONB array), and `coverageNote` is computed from the coverage query, not written.

**Atomicity and idempotency:** a generation writes all epics and stories in one transaction, and the idempotency key makes a duplicate submit return the first result rather than re-inserting.

---

### Sprint-SOW - PostgreSQL storage

Backs `skills/sprint-sow` and its frontend: the sprint-sow form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, and the generic `DocumentView`. A sprint SOW is a client-facing agreement that carries a Version, a Draft or Approved status, and an approval line, so it follows the same versioned-agreement shape as the charter: one identity per sprint with many immutable versions, the newest approved one live. One SOW per sprint is a hard rule (skill rule 6), so the identity is unique on `(project_id, sprint_number)`.

**Entities**
- `sprint_sows` - one per project and sprint number, pointing at the current version.
- `sprint_sow_versions` - an immutable snapshot of the whole SOW for one version label, with its own status.
- Child tables per version for the team, the themed deliverables, out-of-scope, the optional dependencies section, the DoD, and approvals.

**Enumerated types**

```sql
CREATE TYPE sprint_sow_status AS ENUM ('draft', 'approved', 'superseded');
CREATE TYPE sprint_sow_estimate_unit AS ENUM ('points', 'days');
```

**Core tables**

```sql
CREATE TABLE IF NOT EXISTS sprint_sows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  sprint_number INT NOT NULL CHECK (sprint_number >= 1),
  current_version_id UUID,                             -- newest approved (or latest) version
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sprint_sows_sprint_unique UNIQUE (project_id, sprint_number)  -- one SOW per sprint (rule 6)
);

CREATE TABLE IF NOT EXISTS sprint_sow_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id        UUID NOT NULL REFERENCES sprint_sows(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  version_label TEXT NOT NULL DEFAULT '1.0',           -- the header Version field
  status        sprint_sow_status NOT NULL DEFAULT 'draft',
  prepared_by   TEXT,
  sow_date      DATE,
  jira_board_url TEXT,                                 -- base for derived /browse/ links, never a literal (url)
  sprint_goal   TEXT NOT NULL,
  overview      TEXT,
  sprint_start  DATE,
  sprint_end    DATE,
  estimate_unit sprint_sow_estimate_unit,              -- null when the SOW carries no estimates
  sprint_total  NUMERIC(6,1),                          -- the "Sprint total" figure, null when no estimates
  changes_since TEXT,                                  -- revision note, null on first issue
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT sprint_sow_versions_label_unique UNIQUE (sow_id, version_label),
  CONSTRAINT sprint_sow_versions_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT sprint_end_after_start CHECK (sprint_end IS NULL OR sprint_start IS NULL OR sprint_end >= sprint_start),
  CONSTRAINT estimate_unit_with_total CHECK (sprint_total IS NULL OR estimate_unit IS NOT NULL)
);
```

**Child tables** (all reference `sprint_sow_versions(id) ON DELETE CASCADE`, all carry `org_id` for RLS, all have a `sort_order SMALLINT NOT NULL DEFAULT 0`):

```sql
CREATE TABLE IF NOT EXISTS sprint_sow_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES sprint_sow_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  member_name TEXT NOT NULL, role TEXT,
  assigned_tickets JSONB NOT NULL DEFAULT '[]'::jsonb, -- string[] of ticket keys
  sort_order SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT sow_team_tickets_is_array CHECK (jsonb_typeof(assigned_tickets) = 'array')
);
CREATE TABLE IF NOT EXISTS sprint_sow_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES sprint_sow_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL, description TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_sow_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES sprint_sow_versions(id) ON DELETE CASCADE,
  theme_id   UUID NOT NULL REFERENCES sprint_sow_themes(id) ON DELETE CASCADE,
  org_id     UUID NOT NULL REFERENCES organisations(id),
  ticket_key TEXT,                                     -- plain Jira key, link derived from jira_board_url
  story_id   UUID REFERENCES stories(id),              -- optional traceability to the backlog story
  deliverable TEXT NOT NULL, description TEXT, assignee TEXT,
  estimate   NUMERIC(4,1),                             -- indicative, null when the SOW omits estimates
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_sow_out_of_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES sprint_sow_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL,
  deferred_to_sprint INT,                              -- parsed from "deferred to Sprint N" when present
  ticket_key TEXT,                                     -- the deferred ticket key when named
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_sow_dependencies (   -- the optional Dependencies & Assumptions section
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES sprint_sow_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL, owed_by TEXT, needed_by TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_sow_dod (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES sprint_sow_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  condition TEXT NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_sow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES sprint_sow_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  approver_name TEXT,                                  -- null renders as "Pending" while status is draft
  signed_at TIMESTAMPTZ, sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_sprint_sows_project ON sprint_sows (org_id, project_id, sprint_number DESC);
CREATE INDEX IF NOT EXISTS idx_sprint_sow_versions_sow ON sprint_sow_versions (sow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sprint_sow_deliverables_version ON sprint_sow_deliverables (version_id);
CREATE INDEX IF NOT EXISTS idx_sprint_sow_deliverables_theme ON sprint_sow_deliverables (theme_id);
-- plus a version_id FK index on each other child table
```

**Row-Level Security** - enable on `sprint_sows`, `sprint_sow_versions`, and every child table with the org predicate.

**Ticket links, never a literal (url):** deliverables and team rows store the plain `ticket_key`, and the app derives `https://<domain>/browse/<KEY>` from the version's `jira_board_url` at render (skill rule 2). When no board URL is known, the key renders as plain text. A literal `(url)` is never stored.

**Estimates are optional and never invented:** when the SOW carries no estimates, `estimate_unit`, `sprint_total`, and every deliverable `estimate` stay null, and the UI omits the Estimate column entirely. The `estimate_unit_with_total` CHECK stops a total being written without a unit.

**Carry-over reconciliation is a derived query (skill rule 7).** Before generating, compare the previous sprint's deferred out-of-scope items to this SOW's ticket list and surface the gaps once, never auto-adding them:

```sql
SELECT oos.item, oos.ticket_key
FROM sprint_sows prev
JOIN sprint_sow_versions prev_v ON prev_v.id = prev.current_version_id
JOIN sprint_sow_out_of_scope oos ON oos.version_id = prev_v.id
WHERE prev.project_id = $1
  AND prev.sprint_number = $2 - 1
  AND oos.deferred_to_sprint = $2
  AND NOT EXISTS (
    SELECT 1 FROM sprint_sow_deliverables d
    WHERE d.version_id = $3 AND d.ticket_key = oos.ticket_key
  );
```

**Versioning and lifecycle** (`sprint_sow_status`, server-side): a material revision bumps `version_label` and inserts a new immutable version (Artefact Versioning rule). `draft` moves to `approved` on sign-off, which writes `sprint_sow_approvals.signed_at`, marks the prior approved version `superseded`, and updates `sprint_sows.current_version_id`. An approved version is never edited in place, which preserves the signed record. No other transition.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/sprint-sows` - create the SOW and version 1, or a bumped next version if the sprint's SOW exists, with all child rows in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/sprint-sows/:sprintNumber` - the current or latest version with all sections.
- `GET /projects/:projectId/sprint-sows/:sprintNumber/carry-over` - the reconciliation result.
- `PATCH /sprint-sow-versions/:id/status` - approve or supersede, validated against the machine.

**Field mapping (UI to API to DB):** the header (preparedBy, version, status, jiraBoard) and sprintGoal, overview, start, and end map to `sprint_sow_versions`, team to `sprint_sow_team` (the assigned-tickets string split into the JSONB array), the deliverables list to `sprint_sow_themes` (distinct theme) plus `sprint_sow_deliverables` (theme resolved to `theme_id`, `estimate` parsed or null, ticket kept as a plain key with an optional `story_id` link), outOfScope to `sprint_sow_out_of_scope` (the "deferred to Sprint N (KEY)" tail parsed into `deferred_to_sprint` and `ticket_key` where present), dependencies to `sprint_sow_dependencies`, dod to `sprint_sow_dod`, and approver to `sprint_sow_approvals` (a blank approver renders as Pending).

**Atomicity and idempotency:** a version plus all its child rows is one transaction, so a half-written SOW never persists, and the idempotency key makes a duplicate submit return the first version rather than a second SOW for the sprint.

---

### Sprint-planning - PostgreSQL storage

Backs `skills/sprint-planning` and its frontend: the planning form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, the bespoke `SprintPlanView`, and the `sprintLoadBreakdown` helper in `src/lib/sprint.ts`. A sprint plan is a working snapshot tied to a sprint, not a signed agreement, so it is a header plus child tables with a re-plan chain rather than immutable versions. The load picture (committed points, per-person load, off-goal points, unestimated count, overcommit) is derived on read from the capacity and backlog rows, exactly as the view computes it, and is never stored.

**Entities**
- `sprint_plans` - the plan header, one live plan per sprint with a re-plan chain.
- Child tables per plan for capacity, backlog, carryover, dependencies, risks, the DoD, and key dates.

**Enumerated types**

```sql
CREATE TYPE backlog_priority AS ENUM ('P0', 'P1', 'P2');
CREATE TYPE sprint_plan_status AS ENUM ('draft', 'committed', 'superseded');
CREATE TYPE sprint_dependency_status AS ENUM ('confirmed', 'unconfirmed');
```

**Core table**

```sql
CREATE TABLE IF NOT EXISTS sprint_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID NOT NULL REFERENCES projects(id),
  sprint_number INT NOT NULL CHECK (sprint_number >= 1),
  sprint_name   TEXT,
  goal          TEXT NOT NULL,
  start_date    DATE,
  end_date      DATE,
  velocity_avg_points NUMERIC(5,1),                     -- null = no baseline, so load % is indicative
  velocity_sprints    SMALLINT,
  dod_proposed  BOOLEAN NOT NULL DEFAULT true,           -- false only when the team supplied its own DoD
  status        sprint_plan_status NOT NULL DEFAULT 'draft',
  prior_plan_id UUID REFERENCES sprint_plans(id),         -- the plan this re-plan supersedes
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT sprint_plans_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT sprint_plan_end_after_start CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT velocity_sprints_needs_avg CHECK (velocity_sprints IS NULL OR velocity_avg_points IS NOT NULL)
);
-- one live (non-superseded) plan per sprint, a re-plan supersedes the prior one
CREATE UNIQUE INDEX IF NOT EXISTS uq_sprint_plans_live ON sprint_plans (project_id, sprint_number) WHERE status <> 'superseded';
```

**Child tables** (all reference `sprint_plans(id) ON DELETE CASCADE`, all carry `org_id` for RLS, all have a `sort_order SMALLINT NOT NULL DEFAULT 0`):

```sql
CREATE TABLE IF NOT EXISTS sprint_plan_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES sprint_plans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  person_name TEXT NOT NULL,
  available_days SMALLINT NOT NULL DEFAULT 0,
  working_days   SMALLINT NOT NULL DEFAULT 0,
  usable_capacity SMALLINT NOT NULL DEFAULT 0,           -- points after the 70-80% haircut, a PM input
  notes TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_plan_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES sprint_plans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  priority backlog_priority NOT NULL,                    -- P2 is stretch, derived not stored
  item TEXT NOT NULL,
  estimate NUMERIC(4,1),                                 -- null when pending
  estimate_pending BOOLEAN NOT NULL DEFAULT false,        -- true = TBD, excluded from the load
  owner TEXT,
  dependencies TEXT,                                     -- inline note, distinct from the dependencies table
  serves_goal BOOLEAN,                                   -- false = does not serve the goal, flagged
  story_id UUID REFERENCES stories(id),                  -- optional traceability to the backlog story
  sort_order SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT backlog_estimate_pending CHECK (NOT (estimate_pending AND estimate IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS sprint_plan_carryover (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES sprint_plans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL, original_sprint TEXT, original_estimate TEXT, remaining_effort TEXT,
  reason TEXT, re_committed BOOLEAN NOT NULL DEFAULT false, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_plan_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES sprint_plans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL, depends_on TEXT, owner TEXT,
  status sprint_dependency_status NOT NULL DEFAULT 'unconfirmed',
  risk_if_blocked TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_plan_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES sprint_plans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  risk TEXT NOT NULL, impact TEXT, mitigation TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_plan_dod (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES sprint_plans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  condition TEXT NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sprint_plan_key_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES sprint_plans(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  event_date DATE, event TEXT NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_sprint_plans_project ON sprint_plans (org_id, project_id, sprint_number DESC);
CREATE INDEX IF NOT EXISTS idx_sprint_plan_capacity_plan ON sprint_plan_capacity (plan_id);
CREATE INDEX IF NOT EXISTS idx_sprint_plan_backlog_plan ON sprint_plan_backlog (plan_id);
CREATE INDEX IF NOT EXISTS idx_sprint_plan_backlog_owner ON sprint_plan_backlog (plan_id, owner);  -- per-person rollup
-- plus a plan_id FK index on each other child table
```

**Row-Level Security** - enable on `sprint_plans` and every child table with the org predicate.

**The load breakdown is derived on read, never stored** (matching `sprintLoadBreakdown`). Committed points, per-owner load, off-goal points, unestimated count, and the overcommit flag come from the rows. Per-owner committed load and load-with-stretch:

```sql
SELECT owner,
       COALESCE(SUM(estimate) FILTER (WHERE priority IN ('P0','P1') AND NOT estimate_pending), 0) AS committed,
       COALESCE(SUM(estimate) FILTER (WHERE NOT estimate_pending), 0)                             AS with_stretch
FROM sprint_plan_backlog
WHERE plan_id = $1
GROUP BY owner;
```

Off-goal points are `SUM(estimate) FILTER (WHERE serves_goal = false AND priority IN ('P0','P1'))` and the unestimated count is `count(*) FILTER (WHERE estimate_pending AND priority IN ('P0','P1'))`, both over the same plan.

**Lifecycle** (`sprint_plan_status`, server-side): `draft` moves to `committed` when the plan is committed, and `committed` moves to `superseded` when a re-plan is created with `prior_plan_id` pointing back. The partial unique index keeps exactly one live plan per sprint. No other transition.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/sprint-plans` - create a plan and all child rows in one transaction, `Idempotency-Key`, `RETURNING`. If a live plan exists for the sprint, supersede it and set `prior_plan_id` (a re-plan).
- `GET /projects/:projectId/sprint-plans/:sprintNumber` - the live plan with all sections and the derived load breakdown.
- `PATCH /sprint-plans/:id/status` - commit or supersede, validated against the machine.

**Field mapping (UI to API to DB):** sprintName, goal, dates, the velocity pair, and the DoD `proposed` flag map to `sprint_plans`, team to `sprint_plan_capacity`, backlog to `sprint_plan_backlog` (a TBD points value to `estimate = null` plus `estimate_pending = true`, serves-goal No to `serves_goal = false`, P2 to stretch derived on read, an optional `story_id` link), and carryover, dependencies, risks, dod, and keyDates to their child tables. planned load, load ratio, per-person load, off-goal points, unestimated count, and the overcommit flag are all computed on read, never written.

**Atomicity and idempotency:** a plan plus all its child rows is one transaction, so a half-written plan never persists, and the idempotency key makes a duplicate submit return the first plan rather than a second live plan for the sprint.

---

### Release-checklist - PostgreSQL storage

Backs `skills/release-checklist` and its frontend: the checklist form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, the bespoke `ReleaseChecklistView`, and `buildRelease`. A go/no-go is run more than once (a NO-GO on Wednesday is re-run on Friday), so a release has many assessments with a delta between them. The recorded verdict is a sign-off and is stored, while the tally, blockers, conditions, chase list, and delta are derived on read from the items.

**Entities**
- `releases` - one per release name or version, pointing at the current assessment.
- `release_assessments` - one go/no-go run, with the recorded verdict and an optional link to the assessment it re-runs.
- `release_checklist_items` - the checklist rows for one assessment.

**Enumerated types**

```sql
CREATE TYPE checklist_status AS ENUM ('pass', 'fail', 'risk', 'unconfirmed', 'na');
CREATE TYPE release_verdict AS ENUM ('go', 'no_go', 'conditional_go');
CREATE TYPE release_type AS ENUM ('planned', 'hotfix', 'phased', 'feature_flag');
CREATE TYPE release_assessment_status AS ENUM ('draft', 'final', 'superseded');
CREATE TYPE release_category AS ENUM (
  'feature_readiness', 'testing', 'operational_readiness', 'communications',
  'dependencies', 'approvals', 'post_release_readiness', 'hotfix'
);
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS releases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  name         TEXT NOT NULL,                            -- release name or version
  current_assessment_id UUID,                            -- newest assessment
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT releases_name_unique UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS release_assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id    UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  release_type  release_type NOT NULL DEFAULT 'planned',
  target_date   TIMESTAMPTZ,
  assessed_by   TEXT,
  verdict       release_verdict NOT NULL,                -- the recorded sign-off decision
  verdict_rationale TEXT,
  verdict_movement  TEXT,                                -- re-assessment note, null on first run
  path_to_go    JSONB,                                   -- decision aid, null on a clean GO
  prior_assessment_id UUID REFERENCES release_assessments(id), -- the run this one re-assesses
  status        release_assessment_status NOT NULL DEFAULT 'draft',
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT release_assessments_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT path_to_go_is_object CHECK (path_to_go IS NULL OR jsonb_typeof(path_to_go) = 'object'),
  CONSTRAINT path_to_go_only_when_not_go CHECK (verdict <> 'go' OR path_to_go IS NULL)
);

CREATE TABLE IF NOT EXISTS release_checklist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES release_assessments(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  category      release_category NOT NULL,
  ref           TEXT NOT NULL,                           -- F1, T2, O8 ...
  label         TEXT NOT NULL,
  status        checklist_status NOT NULL,               -- the assessed status, before acceptance
  note          TEXT,
  owner         TEXT,
  due           TEXT,
  accepted_by   TEXT,                                    -- set only for a FAIL accepted in writing
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT item_ref_unique UNIQUE (assessment_id, ref),
  CONSTRAINT accepted_only_on_fail CHECK (accepted_by IS NULL OR status = 'fail')
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_releases_project ON releases (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_release_assessments_release ON release_assessments (release_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_release_items_assessment ON release_checklist_items (assessment_id);
CREATE INDEX IF NOT EXISTS idx_release_items_status ON release_checklist_items (assessment_id, status);  -- tally / chase list
```

**Row-Level Security** - enable on `releases`, `release_assessments`, and `release_checklist_items` with the org predicate.

**Accepted FAIL is stored raw, converted on read.** An accepted FAIL keeps `status = 'fail'` with `accepted_by` set, so the audit trail records that it was a FAIL the PM accepted. The effective status is `CASE WHEN status = 'fail' AND accepted_by IS NOT NULL THEN 'risk' ELSE status END`, and every derived read (tally, verdict, blockers, conditions) uses the effective status. The `accepted_only_on_fail` CHECK stops acceptance being recorded against a non-FAIL.

**Tally, blockers, conditions, and the chase list are derived on read** (matching `buildRelease`), never stored:
- Tally counts items by effective status.
- Blockers are the effective FAIL and UNCONFIRMED items, conditions are the effective RISK items (which include accepted FAILs).
- The chase list is the UNCONFIRMED items grouped by owner, with a lead-time flag the app derives from the label:

```sql
SELECT owner, ref, label
FROM release_checklist_items
WHERE assessment_id = $1 AND status = 'unconfirmed'
ORDER BY owner, sort_order;
```

**The re-assessment delta is a derived comparison** to `prior_assessment_id`, never stored:

```sql
SELECT cur.ref, cur.label, prior.status AS was, cur.status AS now
FROM release_checklist_items cur
LEFT JOIN release_checklist_items prior
  ON prior.assessment_id = $2 AND prior.ref = cur.ref
WHERE cur.assessment_id = $1
  AND prior.status IS DISTINCT FROM cur.status;
```

**Lifecycle** (`release_assessment_status`, server-side): `draft` to `final` when the go/no-go is signed off, and `final` to `superseded` when a re-assessment is created with `prior_assessment_id` pointing back. Creating a re-assessment sets `releases.current_assessment_id` to the new run. No other transition.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/releases/:name/assessments` - create an assessment and its items in one transaction, linking `prior_assessment_id` when a prior run exists, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/releases/:name/assessments/current` - the current assessment with items and the derived tally, blockers, conditions, chase list, and delta.
- `PATCH /release-assessments/:id/status` - sign off or supersede, validated against the machine.
- The Jira pull uses a validated JQL query (project key `[A-Za-z0-9_]+`, sprint name quoted and rejected if it contains a quote or newline) and scores Feature Readiness against the confirmed release scope only, so rolled-over tickets do not create false FAILs.

**Field mapping (UI to API to DB):** release name, type, and target date map to `releases` and `release_assessments`, each check row to `release_checklist_items` (category to the `release_category` enum, status to `checklist_status`, owner, due, and `accepted_by` carried through), the verdict, its rationale, the movement note, and the `pathToGo` object to `release_assessments`. The tally, blockers, conditions, chase list, and delta are computed on read.

**Atomicity and idempotency:** an assessment plus all its items is one transaction, so a half-written checklist never persists, and the idempotency key makes a duplicate submit return the first assessment rather than a second run.

---

### Sprint-report - PostgreSQL storage

Backs `skills/sprint-report` and its frontend: the report form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, the bespoke `SprintReportView`, and the `assessVelocity` helper in `src/lib/sprint.ts`. A report is a point-in-time snapshot run several times per sprint (Day 3, Day 7, close-out), so reports are append-only rows chained by `prior_report_id` for the movement line. Each report's lists and chart series are snapshot data displayed as a unit, so they are JSONB on the row rather than child tables. The velocity assessment is derived at write time from the committed points and the trailing average.

**Entities**
- `sprint_reports` - one row per report run, chained to the prior report on the same sprint.

**Enumerated types** (reuse `rag_status` from the risk-scan design, do not redefine it):

```sql
CREATE TYPE sprint_goal_status AS ENUM ('on_track', 'at_risk', 'missed', 'not_stated');
CREATE TYPE velocity_assessment AS ENUM ('on_trend', 'over_committed', 'under_committed');
CREATE TYPE report_risk_level AS ENUM ('low', 'medium', 'high');
```

**Table**

```sql
CREATE TABLE IF NOT EXISTS sprint_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID NOT NULL REFERENCES projects(id),
  sprint_name   TEXT NOT NULL,
  day           SMALLINT,
  total_days    SMALLINT,
  closed        BOOLEAN NOT NULL DEFAULT false,
  status        rag_status NOT NULL,
  confidence    SMALLINT,                               -- null = not assessable
  risk_level    report_risk_level,
  forecast      TEXT,                                   -- reads as actuals when closed
  committed     SMALLINT NOT NULL DEFAULT 0,
  completed     SMALLINT NOT NULL DEFAULT 0,
  goal          TEXT,
  goal_status   sprint_goal_status NOT NULL DEFAULT 'not_stated',
  trailing_average NUMERIC(5,1),
  velocity_assessment velocity_assessment,
  velocity_trend JSONB NOT NULL DEFAULT '[]'::jsonb,    -- {sprint,points}[]
  burndown      JSONB NOT NULL DEFAULT '[]'::jsonb,     -- {day,remaining,ideal}[]
  summary       TEXT,
  movement      TEXT,                                   -- delta since the prior report
  priorities    JSONB NOT NULL DEFAULT '[]'::jsonb,     -- string[]
  top_risks     JSONB NOT NULL DEFAULT '[]'::jsonb,     -- string[]
  actions_today JSONB NOT NULL DEFAULT '[]'::jsonb,     -- string[], in-flight only
  standup_questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- string[], in-flight only
  carryover     JSONB NOT NULL DEFAULT '[]'::jsonb,     -- string[], close-out only
  next_sprint_implications TEXT,
  leadership_update TEXT,
  prior_report_id UUID REFERENCES sprint_reports(id),   -- the report this one follows
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT sprint_reports_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT confidence_range CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 100),
  -- the skill forbids a confidence % when days remaining are unknown
  CONSTRAINT confidence_needs_days CHECK (confidence IS NULL OR (day IS NOT NULL AND total_days IS NOT NULL)),
  CONSTRAINT velocity_needs_average CHECK (velocity_assessment IS NULL OR trailing_average IS NOT NULL),
  CONSTRAINT goal_status_without_goal CHECK (goal IS NOT NULL OR goal_status = 'not_stated'),
  -- close-out swaps actions/standup for carry-over
  CONSTRAINT closed_has_no_live_actions CHECK (NOT closed OR (jsonb_array_length(actions_today) = 0 AND jsonb_array_length(standup_questions) = 0)),
  CONSTRAINT carryover_only_when_closed CHECK (closed OR jsonb_array_length(carryover) = 0),
  CONSTRAINT arrays_are_arrays CHECK (
    jsonb_typeof(velocity_trend) = 'array' AND jsonb_typeof(burndown) = 'array'
    AND jsonb_typeof(priorities) = 'array' AND jsonb_typeof(top_risks) = 'array'
    AND jsonb_typeof(actions_today) = 'array' AND jsonb_typeof(standup_questions) = 'array'
    AND jsonb_typeof(carryover) = 'array'
  )
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_sprint_reports_project ON sprint_reports (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_sprint_reports_sprint ON sprint_reports (project_id, sprint_name, created_at DESC);  -- latest / prior
```

**Row-Level Security** - enable on `sprint_reports` with the org predicate.

**The velocity assessment is derived at write time** (matching `assessVelocity`): compare committed points to the trailing average within a 10% band, writing `over_committed`, `under_committed`, or `on_trend`, and leave it null when no velocity history was given. Storing it keeps the signed report reproducible even if the band heuristic changes later.

**The movement line uses the prior report.** On create, link `prior_report_id` to the most recent report on the same sprint (`ORDER BY created_at DESC LIMIT 1`, same project and sprint_name). The stored `movement` is the PM-facing narrative, and a numeric confidence delta can be derived by joining to the prior row when needed. Never search across projects.

**Reports are append-only snapshots** - each run is a new row, and the current report is the latest by `created_at`. There is no in-place edit and no status machine, which preserves each day's report as a record.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/sprint-reports` - insert one report row, resolving `prior_report_id` from the latest prior report on the sprint, `Idempotency-Key`, `RETURNING`. The Jira pull validates the project key against `[A-Za-z0-9_]+` and asks the user for the commitment figure and sprint day rather than inferring them from the current backlog.
- `GET /projects/:projectId/sprint-reports?sprint=<name>` - the latest report for the sprint plus the run history.

**Field mapping (UI to API to DB):** the scalar fields map directly, `status`/`goalStatus`/`velocityAssessment`/`riskLevel` to their enums, a blank confidence to `NULL`, and `velocityTrend`, `burndown`, `priorities`, `topRisks`, `actionsToday`, `standupQuestions`, and `carryover` to their JSONB columns. `velocityAssessment` and `trailingAverage` are computed from the velocity history at write time.

**Atomicity and idempotency:** a report is a single row, so the write is atomic, and the idempotency key makes a duplicate submit return the first report rather than a second snapshot for the same moment.

---

### Decision-log - PostgreSQL storage

Backs `skills/decision-log` and its frontend: the register form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, and the bespoke `DecisionLogView`. The defining requirement is that the log is one living, append-only register per project, never a new file per decision - fragmenting the audit trail is the one failure a decision log exists to prevent. Entries are immutable once written, with a single allowed change: a later decision can flip an earlier one to Superseded. The index, the sign-off nudge, and the detail view are all derived on read.

**Entities**
- `decision_logs` - one register per project, versioned, bumped on each append.
- `decision_entries` - the append-only decisions, sequenced D-001, D-002, and so on.
- `decision_discussed` - floated ideas noted but not decided (never logged as decisions).

**Enumerated types**

```sql
CREATE TYPE decision_area AS ENUM ('scope', 'timeline', 'budget', 'architecture', 'team', 'process', 'other');
CREATE TYPE change_status AS ENUM ('proposed', 'under_review', 'approved', 'rejected', 'superseded');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS decision_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  prepared_by  TEXT,
  version      TEXT NOT NULL DEFAULT '1.0',             -- bumped on each append
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT decision_logs_project_unique UNIQUE (project_id)  -- one register per project
);

CREATE TABLE IF NOT EXISTS decision_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id        UUID NOT NULL REFERENCES decision_logs(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  decision_ref  TEXT NOT NULL,                           -- D-001, D-002 ...
  decided_on    DATE,                                    -- date decided, null = [TBC]
  title         TEXT NOT NULL,
  area          decision_area NOT NULL,
  original_plan TEXT,
  revised_plan  TEXT NOT NULL,
  reason        TEXT,                                    -- includes any explicitly rejected options
  proposed_by   TEXT,
  delivery_impact TEXT,
  technical_impact TEXT,
  product_owner_impact TEXT,
  cost_impact   TEXT,
  status        change_status NOT NULL DEFAULT 'proposed',
  approved_by   TEXT,                                    -- null = [TBC]
  supersedes_id UUID REFERENCES decision_entries(id),    -- the earlier entry this reverses
  follow_ups    TEXT,                                    -- SOW vs CR, stale artefacts, comms owed
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT decision_ref_unique UNIQUE (log_id, decision_ref),
  CONSTRAINT decision_entries_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT no_self_supersede CHECK (supersedes_id IS NULL OR supersedes_id <> id)
);

CREATE TABLE IF NOT EXISTS decision_discussed (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id  UUID NOT NULL REFERENCES decision_logs(id) ON DELETE CASCADE,
  org_id  UUID NOT NULL REFERENCES organisations(id),
  item    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_decision_logs_project ON decision_logs (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_decision_entries_log ON decision_entries (log_id, created_at);
CREATE INDEX IF NOT EXISTS idx_decision_discussed_log ON decision_discussed (log_id);
```

**Row-Level Security** - enable on all three tables with the org predicate.

**Append-only with one allowed mutation.** Entries are never deleted or rewritten - the trail is the point. The only permitted update is flipping an earlier entry's `status` to `superseded` when a new entry's `supersedes_id` points at it. Any DROP or destructive migration needs explicit confirmation per the engineering rules.

**The Decision ID is server-assigned.** On append, the next `decision_ref` is `D-` plus the zero-padded successor of the current max for that log, computed inside the transaction so concurrent appends cannot collide (the `decision_ref_unique` constraint is the backstop).

**The sign-off nudge and the index are derived on read**, never stored. A decision needs sign-off when its status is `proposed` or `under_review`, or when it is `approved` with `approved_by` null:

```sql
SELECT decision_ref
FROM decision_entries
WHERE log_id = $1
  AND (status IN ('proposed', 'under_review') OR (status = 'approved' AND approved_by IS NULL))
ORDER BY decision_ref;
```

The index table is a projection of the same rows, and the detail blocks are the full rows.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/decision-log/entries` - append one or more entries to the project's register in one transaction, creating the register if none exists, assigning the next `decision_ref`, resolving `supersedes_id` from a `D-00X` reference and flipping that entry to `superseded`, bumping the register `version`, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/decision-log` - the register, all entries in sequence, the discussed items, and the derived sign-off nudge.
- No delete or rewrite endpoint for an entry (append-only).

**Field mapping (UI to API to DB):** register-level project, preparedBy, and version map to `decision_logs`, each entry to `decision_entries` (area and status to their enums, `date` to `decided_on` with null for `[TBC]`, `supersedes` resolved to `supersedes_id`, `approvedBy` `[TBC]` stored as null), and the discussed items to `decision_discussed`. The `id` sequence, `signOffNudge`, and the index projection are computed on read.

**Atomicity and idempotency:** an append plus the version bump plus any supersede flip is one transaction, so the register never lands half-updated, and the idempotency key makes a duplicate submit return the first entries rather than double-logging a decision.

---

### Meeting-notes - PostgreSQL storage

Backs `skills/meeting-notes` and its frontend: the minutes form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, and the generic `DocumentView`. Minutes are one artefact per meeting, keyed by title and date so the same-title-same-date Confluence overwrite guard maps to a uniqueness rule. Action items may be Unassigned (owner null) rather than dropped or guessed, attribution uncertainty is recorded rather than papered over, and a material decision can link to a decision-log entry.

**Entities**
- `meetings` - the header for one meeting, with attendees as a JSONB list.
- Child tables for discussion points, decisions, action items, open questions, and follow-up questions.

**Enumerated types**

```sql
CREATE TYPE meeting_source AS ENUM ('teams', 'zoom', 'meet', 'manual', 'other');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS meetings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID REFERENCES projects(id),           -- nullable: minutes can precede a project
  title         TEXT NOT NULL,
  meeting_date  DATE,
  duration      TEXT,
  source        meeting_source NOT NULL DEFAULT 'manual',
  summary       TEXT,
  attendees     JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[]
  internal_only BOOLEAN NOT NULL DEFAULT true,           -- gates the external-circulation audience check
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT meetings_idem_unique UNIQUE (org_id, idempotency_key),
  -- NULLS NOT DISTINCT (PG 15+) so undated or pre-project minutes with the same title still collide
  CONSTRAINT meetings_title_date_unique UNIQUE NULLS NOT DISTINCT (project_id, title, meeting_date),
  CONSTRAINT attendees_is_array CHECK (jsonb_typeof(attendees) = 'array')
);

CREATE TABLE IF NOT EXISTS meeting_discussion_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  agenda_heading TEXT,                                   -- set when a long meeting groups points under agenda headings
  topic TEXT, detail TEXT NOT NULL,
  attribution_unclear BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meeting_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  decision TEXT NOT NULL,
  decision_entry_id UUID REFERENCES decision_entries(id), -- link when logged via /decision-log
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meeting_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  owner TEXT,                                            -- null = Unassigned, surfaced under open questions
  task TEXT NOT NULL,
  due TEXT,
  attribution_unclear BOOLEAN NOT NULL DEFAULT false,    -- true when the owner was a guessed transcript label
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meeting_open_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  question TEXT NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meeting_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  question TEXT NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_meetings_project ON meetings (org_id, project_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_actions_meeting ON meeting_actions (meeting_id);
-- plus a meeting_id FK index on each other child table
```

**Row-Level Security** - enable on `meetings` and every child table with the org predicate.

**Unassigned actions and unclear attribution are recorded, never guessed.** An action with no stated owner stores `owner = NULL` (rendered as Unassigned) and is surfaced under open questions rather than dropped. When a transcript label was doubtful, `attribution_unclear` is set and the item is never used to assign a decision or action to a named person.

**The audience check is a server gate, not stored prose.** `internal_only` defaults true. Circulating to an external destination (a Gmail draft outside the delivery team, or a client-visible Confluence or Notion space) flips the check: the API returns the candid remarks and commercial detail to redact and the caller confirms a redacted copy, while the full minutes stay as the internal record. Internal saves skip the check.

**Same title and date is the same meeting.** The `meetings_title_date_unique` constraint encodes the Confluence overwrite guard - a page with the same date but a different title is a different meeting and is never overwritten. It is declared `NULLS NOT DISTINCT` so the guard still holds for the design's allowed NULL states: undated minutes (`meeting_date` null) or minutes captured before the project exists (`project_id` null) with the same title collide rather than silently duplicating. The skill still asks for the real date before saving, so a null date is the exception, not the norm.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/meetings` - create the meeting and all child rows in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/meetings/:id` - the minutes with all sections.
- `POST /meeting-decisions/:id/log` - create a `decision_entries` row from a decision and link it back (the /decision-log offer).

**Field mapping (UI to API to DB):** title, date, duration, summary, and attendees map to `meetings` (attendees to the JSONB array), the key discussion points to `meeting_discussion_points`, decisions to `meeting_decisions`, action items to `meeting_actions` (an owner of "Unassigned" or blank stored as `NULL`), open questions to `meeting_open_questions`, and the follow-up questions to `meeting_follow_ups`.

**Atomicity and idempotency:** a meeting plus all its child rows is one transaction, so half-written minutes never persist, and the idempotency key makes a duplicate submit return the first meeting rather than duplicating it.

---

### Tech-review - PostgreSQL storage

Backs `skills/tech-review` and its frontend: the review form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, and the generic `DocumentView`. A review is one artefact per reviewed document. The defining requirement is a constrained Feasibility Verdict (exactly four values) and a Cannot-assess path that must state what is missing, so thin input cannot produce a confident verdict. Risks carry a likelihood and impact, and an omission flag when they came from the not-stated watch-list.

**Entities**
- `tech_reviews` - the review header, with the string lists (implications, dependencies, questions) as JSONB.
- `tech_review_risks` - the structured risks, with likelihood, impact, and an omission flag.

**Enumerated types** (reuse `hml` from the risk-scan design, do not redefine it):

```sql
CREATE TYPE feasibility_verdict AS ENUM ('feasible', 'feasible_with_conditions', 'not_feasible', 'cannot_assess');
CREATE TYPE tech_document_type AS ENUM ('architecture_proposal', 'integration_spec', 'data_model', 'tech_stack_decision', 'spike_output', 'mixed');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS tech_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID REFERENCES projects(id),            -- nullable: a review can precede a project
  document_type tech_document_type,
  document_reviewed TEXT,                                 -- title or description of the reviewed doc
  verdict       feasibility_verdict NOT NULL,
  summary       TEXT,
  estimate_assessment TEXT,                               -- what the SA figure includes/excludes and its basis
  cost_commercial TEXT,
  top_risk      TEXT,
  scope_implications TEXT,
  missing_info  TEXT,                                     -- required when verdict = cannot_assess
  implications  JSONB NOT NULL DEFAULT '[]'::jsonb,       -- string[]
  dependencies  JSONB NOT NULL DEFAULT '[]'::jsonb,       -- string[]
  questions     JSONB NOT NULL DEFAULT '[]'::jsonb,       -- string[]
  reviewed_on   DATE,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT tech_reviews_idem_unique UNIQUE (org_id, idempotency_key),
  -- thin input cannot hide behind a confident verdict
  CONSTRAINT cannot_assess_needs_missing_info CHECK (verdict <> 'cannot_assess' OR missing_info IS NOT NULL),
  CONSTRAINT tech_review_arrays CHECK (
    jsonb_typeof(implications) = 'array' AND jsonb_typeof(dependencies) = 'array' AND jsonb_typeof(questions) = 'array'
  )
);

CREATE TABLE IF NOT EXISTS tech_review_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES tech_reviews(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  ref TEXT NOT NULL,                                      -- R1, R2 ...
  risk TEXT NOT NULL,
  likelihood hml NOT NULL,
  impact hml NOT NULL,
  note TEXT,
  is_omission BOOLEAN NOT NULL DEFAULT false,             -- true when raised from the not-stated watch-list
  sort_order SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT tech_review_risk_ref_unique UNIQUE (review_id, ref)
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_tech_reviews_project ON tech_reviews (org_id, project_id, reviewed_on DESC);
CREATE INDEX IF NOT EXISTS idx_tech_review_risks_review ON tech_review_risks (review_id);
```

**Row-Level Security** - enable on `tech_reviews` and `tech_review_risks` with the org predicate.

**The verdict is constrained and Cannot-assess is honest.** The four `feasibility_verdict` values are the only allowed verdicts, and the `cannot_assess_needs_missing_info` CHECK forces a review that cannot judge to state what is needed rather than emit a confident verdict on thin input.

**The watch-list is applied at write time, not stored as a checklist.** The skill checks for common SA-doc omissions (security review, data residency, testing environments, migration and rollback, monitoring, lock-in) and surfaces only the relevant absences as risks with `is_omission = true` or as questions. There is no table of every possible omission - only the ones that mattered for this delivery are persisted.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/tech-reviews` - create the review and its risks in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/tech-reviews/:id` - the review with its risks.

**Field mapping (UI to API to DB):** project, documentType, verdict, summary, estimate, cost, topRisk, and scopeImplications map to `tech_reviews` (verdict to the `feasibility_verdict` enum, documentType to `tech_document_type`), implications, dependencies, and questions to their JSONB columns, and the risks list to `tech_review_risks` (likelihood and impact to `hml`, a "checked omission" note setting `is_omission`). `missing_info` is populated only on a Cannot-assess verdict.

**Atomicity and idempotency:** a review plus all its risks is one transaction, so a half-written review never persists, and the idempotency key makes a duplicate submit return the first review rather than duplicating it.

---

### Retrospective - PostgreSQL storage

Backs `skills/retrospective` (Synthesise mode) and its frontend: the retro form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, and the generic `DocumentView`. A retro is one artefact per sprint, chained to the prior retro so recurring themes can be detected. Themes are depersonalised process statements, never attributed to a named individual. Actions cap at three, overflow goes to a parked list, and an action outside the team's control is an escalation defaulting to the PM.

**Entities**
- `retros` - the retro header, with went-well, parked, and attendees (roles) as JSONB.
- `retro_prior_actions` - the Prior Actions Review rows.
- `retro_themes` - the What-Didn't themes, with a recurring flag.
- `retro_actions` - the owned actions, with an escalation flag and the theme they address.

**Enumerated types**

```sql
CREATE TYPE retro_action_done AS ENUM ('yes', 'no', 'partial');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS retros (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  sprint_name  TEXT NOT NULL,
  retro_date   DATE,
  outcome      TEXT,                                    -- Met / Partially met / Missed goal
  sprint_facts TEXT,                                    -- committed vs done, carryover, incidents
  went_well    JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[]
  parked       JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[]
  sentiment    TEXT,
  attendees    JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[] of roles, not names
  prior_retro_id UUID REFERENCES retros(id),            -- previous retro on this project, for recurring detection
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT retros_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT retro_arrays CHECK (
    jsonb_typeof(went_well) = 'array' AND jsonb_typeof(parked) = 'array' AND jsonb_typeof(attendees) = 'array'
  )
);

CREATE TABLE IF NOT EXISTS retro_prior_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retro_id UUID NOT NULL REFERENCES retros(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  action TEXT NOT NULL, owner TEXT,
  done retro_action_done NOT NULL DEFAULT 'no',
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS retro_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retro_id UUID NOT NULL REFERENCES retros(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  ref TEXT NOT NULL,                                    -- 1, 2, 3 ...
  theme TEXT NOT NULL,                                  -- depersonalised process statement
  what_happened TEXT, impact TEXT,
  recurring BOOLEAN NOT NULL DEFAULT false,             -- set when the theme appeared in the prior retro
  sort_order SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT retro_theme_ref_unique UNIQUE (retro_id, ref)
);

CREATE TABLE IF NOT EXISTS retro_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retro_id UUID NOT NULL REFERENCES retros(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  action TEXT NOT NULL, owner TEXT, due TEXT,
  addresses_theme_ref TEXT,                             -- the What-Didn't theme this action addresses
  is_escalation BOOLEAN NOT NULL DEFAULT false,         -- outside the team's control, owner defaults to the PM
  sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_retros_project ON retros (org_id, project_id, retro_date DESC);
CREATE INDEX IF NOT EXISTS idx_retro_themes_retro ON retro_themes (retro_id);
CREATE INDEX IF NOT EXISTS idx_retro_actions_retro ON retro_actions (retro_id);
-- plus a retro_id FK index on retro_prior_actions
```

**Row-Level Security** - enable on `retros` and every child table with the org predicate.

**Depersonalisation is enforced in content, not schema.** Themes store process statements, never a named individual, and a conduct issue is excluded from the artefact and flagged to the PM to handle privately. There is no attribution column by design.

**Recurring detection is set at write time from the prior retro.** On create, `prior_retro_id` links to the most recent retro on the project. A theme whose text matches one in that prior retro sets `recurring = true`. A recurring theme paired with a prior action still marked `no` is systemic, and the app suggests /risk-scan or /decision-log. This comparison is a derived read, not stored beyond the flag.

**Actions cap and escalations.** The skill caps owned actions at three (up to five with a stated reason), and the overflow candidates go to the `parked` JSONB rather than being dropped. An action outside the team's control sets `is_escalation = true`, defaults `owner` to the PM, and points to /stakeholder-update or /risk-scan as the follow-on.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/retros` - create the retro and all child rows in one transaction, resolving `prior_retro_id` and setting the recurring flags, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/retros/:id` - the retro with all sections.
- `GET /projects/:projectId/retros/:id/recurring` - the themes that recur against the prior retro.

**Field mapping (UI to API to DB):** sprint, outcome, sprintFacts, sentiment, and attendees map to `retros` (wentWell and parked to their JSONB columns), priorActions to `retro_prior_actions` (done to the `retro_action_done` enum), the what-didn't rows to `retro_themes` (a "(Recurring)" tag setting `recurring`), and the action rows to `retro_actions` (an "Escalation" flag setting `is_escalation`, the addresses value to `addresses_theme_ref`).

**Atomicity and idempotency:** a retro plus all its child rows is one transaction, so a half-written retro never persists, and the idempotency key makes a duplicate submit return the first retro rather than duplicating it.

---

### Stakeholder-update - PostgreSQL storage

Backs `skills/stakeholder-update` and its frontend: the update form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, the generic `DocumentView`, and the RAG banner from `deriveStatus`. An update is one artefact per reporting period, chained to the prior update so the status trend ("AMBER, down from GREEN") is real. The budget line is mandatory for sponsor and exec audiences, key dates are baselined against the prior update, and a client-safe second cut strips internal-only content.

**Entities**
- `stakeholder_updates` - the update header, with progress and coming-next as JSONB.
- Child tables for risks, asks, and key dates.

**Enumerated types** (reuse `rag_status` from the risk-scan design, do not redefine it):

```sql
CREATE TYPE update_audience AS ENUM ('sponsor', 'exec', 'client', 'team');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS stakeholder_updates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID NOT NULL REFERENCES projects(id),
  audience      update_audience NOT NULL,
  update_date   DATE,
  rag           rag_status NOT NULL,                     -- On track/At risk/Off track map to green/amber/red
  previous_rag  rag_status,                              -- manually recalled prior status, used for the trend when prior_update_id is null
  headline      TEXT NOT NULL,                           -- carries impact, recovery, ask when amber or red
  budget_line   TEXT,                                    -- "not assessed this period" is a valid value
  next_update_date DATE,                                 -- null when there is no set cadence
  internal_only BOOLEAN NOT NULL DEFAULT true,           -- gates the client-safe second cut
  progress      JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[], promised vs delivered
  coming_next   JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[]
  prior_update_id UUID REFERENCES stakeholder_updates(id), -- previous update, source of the trend baseline
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT stakeholder_updates_idem_unique UNIQUE (org_id, idempotency_key),
  -- sponsor and exec updates must carry a budget line (even "not assessed this period")
  CONSTRAINT budget_required_for_money_audiences CHECK (audience NOT IN ('sponsor', 'exec') OR budget_line IS NOT NULL),
  CONSTRAINT update_arrays CHECK (jsonb_typeof(progress) = 'array' AND jsonb_typeof(coming_next) = 'array')
);

CREATE TABLE IF NOT EXISTS stakeholder_update_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES stakeholder_updates(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL, impact TEXT, action TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stakeholder_update_asks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES stakeholder_updates(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  ask TEXT NOT NULL, owner TEXT, due TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stakeholder_update_key_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES stakeholder_updates(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  milestone TEXT NOT NULL,
  date_value TEXT,                                       -- kept as text, dates are often approximate here
  was TEXT,                                              -- prior baseline date, null = held or no baseline
  sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_stakeholder_updates_project ON stakeholder_updates (org_id, project_id, update_date DESC);
CREATE INDEX IF NOT EXISTS idx_stakeholder_update_risks_update ON stakeholder_update_risks (update_id);
-- plus an update_id FK index on the asks and key-dates tables
```

**Row-Level Security** - enable on `stakeholder_updates` and every child table with the org predicate.

**The trend is derived from the prior update, not invented.** On create, `prior_update_id` links to the most recent update on the project, and the previous RAG is `prior.rag`. The banner reads "AMBER, down from GREEN" by comparing the two. When no prior update exists, the previous RAG falls back to the manually recalled `previous_rag` (the skill asks what was reported last time), and the status is shown without a trend only when neither a prior update nor a `previous_rag` is given. A "was" baseline for a key date is printed only when the prior update or charter supplies one, never fabricated.

**The claimed RAG is checked against the evidence.** The status is derived from the input (sprint data, risks, milestones) and a conflict with the PM's claimed status is flagged once before writing, then the confirmed value is stored. This check is a server-side step, not a stored field.

**The budget line is mandatory for money audiences.** The `budget_required_for_money_audiences` CHECK enforces that sponsor and exec updates carry a budget line, so it is never silently omitted. The value "budget position not assessed this period" satisfies the rule.

**The client-safe cut is generated, not a separate stored artefact.** `internal_only` defaults true. A client version is produced on request by stripping internal-only content (team performance, unvetted risks, internal cost and margin) and returning the list of what was withheld so the PM can verify before sending.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/stakeholder-updates` - create the update and its child rows in one transaction, resolving `prior_update_id`, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/stakeholder-updates/latest` - the latest update plus the trend against its prior.
- `POST /stakeholder-updates/:id/client-safe` - the redacted client cut with the withheld list.

**Field mapping (UI to API to DB):** audience to the `update_audience` enum, status (On track/At risk/Off track) to `rag` (green/amber/red), previousStatus to `previous_rag` (used for the trend when no `prior_update_id` exists), headline, budget, and nextUpdate to `stakeholder_updates`, progress and comingNext to their JSONB columns, and risks, asks, and keyDates to their child tables (a key date's `was` to the `was` column, null when held).

**Atomicity and idempotency:** an update plus all its child rows is one transaction, so a half-written update never persists, and the idempotency key makes a duplicate submit return the first update rather than duplicating it.

---

### Roadmap - PostgreSQL storage

Backs `skills/roadmap` and its frontend: the roadmap form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, and the bespoke `RoadmapView`. A roadmap is a living artefact that is built once and then updated, so it has one identity per project and immutable versions, and the "Changes since" section is a derived diff between the newest two versions. Buckets are Now/Next/Later or quarterly, per-initiative confidence and an optional size travel with each item, hard commitments carry only dates stated in the input, and the Now-vs-capacity flag is set only when capacity is known and exceeded.

**Entities**
- `roadmaps` - one per project, pointing at the current version.
- `roadmap_versions` - an immutable snapshot, with dependencies, not-now, and assumptions as JSONB.
- `roadmap_items` - the initiatives in each bucket.
- `roadmap_commitments` - the hard, date-fixed commitments.

**Enumerated types**

```sql
CREATE TYPE roadmap_confidence AS ENUM ('high', 'medium', 'low');
CREATE TYPE roadmap_size AS ENUM ('s', 'm', 'l');
CREATE TYPE roadmap_format AS ENUM ('now_next_later', 'quarterly');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS roadmaps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  current_version_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT roadmaps_project_unique UNIQUE (project_id)  -- one roadmap per project
);

CREATE TABLE IF NOT EXISTS roadmap_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id    UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  version_number INT NOT NULL CHECK (version_number >= 1),
  goal          TEXT NOT NULL,
  horizon       TEXT,
  confidence_note TEXT,                                  -- "Near-term firm, later directional"
  next_review   TEXT,                                    -- date or trigger
  format        roadmap_format NOT NULL DEFAULT 'now_next_later',
  capacity_flag TEXT,                                    -- set only when Now exceeds known capacity
  dependencies  JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[]
  not_now       JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[]
  assumptions   JSONB NOT NULL DEFAULT '[]'::jsonb,      -- string[]
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT roadmap_versions_number_unique UNIQUE (roadmap_id, version_number),
  CONSTRAINT roadmap_versions_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT roadmap_arrays CHECK (
    jsonb_typeof(dependencies) = 'array' AND jsonb_typeof(not_now) = 'array' AND jsonb_typeof(assumptions) = 'array'
  )
);

CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES roadmap_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  bucket TEXT NOT NULL,                                  -- Now/Next/Later or Q1/Q2/Q3
  initiative TEXT NOT NULL,
  theme TEXT,
  note TEXT,                                             -- why now / depends on / open question
  confidence roadmap_confidence NOT NULL,
  size roadmap_size,                                     -- null when the input carries no effort signal
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roadmap_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES roadmap_versions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  commitment TEXT NOT NULL,
  fixed_date TEXT NOT NULL,                              -- a date stated in the input, never inferred
  sits_in TEXT,                                          -- the bucket it lands in
  sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_roadmaps_project ON roadmaps (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_versions_roadmap ON roadmap_versions (roadmap_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_version ON roadmap_items (version_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_commitments_version ON roadmap_commitments (version_id);
```

**Row-Level Security** - enable on all four tables with the org predicate.

**Build vs update, with a derived changes-since.** On a first run, insert `roadmaps`, then `roadmap_versions` at `version_number = 1`. On an update (a roadmap already exists), insert the next version and copy forward. The "Changes since" section is a derived diff between the newest two versions, matched by initiative - moved bucket, added, or parked, never stored:

```sql
SELECT cur.initiative, prior.bucket AS from_bucket, cur.bucket AS to_bucket
FROM roadmap_items cur
JOIN roadmap_items prior ON prior.version_id = $2 AND prior.initiative = cur.initiative
WHERE cur.version_id = $1 AND cur.bucket <> prior.bucket;
```

Added initiatives are those in the current version with no match in the prior, parked ones are the reverse.

**Hard commitments and capacity are never invented.** `roadmap_commitments.fixed_date` holds only a date stated in the input. `capacity_flag` is set only when team capacity is known and the Now bucket exceeds it, and it carries no per-person arithmetic (that belongs to sprint-planning). `size` stays null unless the input carries an effort signal.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/roadmap` - create version 1, or the next version on an update, with all items and commitments in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/roadmap` - the current version, its buckets, and the derived changes-since against the prior version.
- `GET /projects/:projectId/roadmap/versions` - the version history.

**Field mapping (UI to API to DB):** goal, horizon, confidence, and nextReview map to `roadmap_versions`, the initiative rows to `roadmap_items` (bucket kept as text, confidence and size to their enums, size omitted when blank), hardCommitments to `roadmap_commitments`, and dependencies, notNow, and assumptions to the JSONB columns. The changes-since diff and the optional timeline are derived or presentational, not stored as roadmap truth.

**Atomicity and idempotency:** a version plus all its items and commitments is one transaction, so a half-written roadmap never persists, and the idempotency key makes a duplicate submit return the first version.

---

### Budget-tracker - PostgreSQL storage

Backs `skills/budget-tracker` and its frontend: the budget form in `src/components/onboarding/steps.ts`, its stub, the seeded sample, the bespoke `BudgetTrackerView`, and the `budgetVerdict` helper in `src/lib/budget.ts`. The budget has a slow-moving baseline (original budget plus approved change orders) and a stream of point-in-time reports chained for the trend. The current baseline is derived from the change orders, the forecast is computed two ways, and the RAG verdict is recorded per report with the rule that fired.

**Entities**
- `budgets` - one per project: the original budget, commercial model, and planned dates.
- `budget_change_orders` - approved changes that move the baseline, each linked to a decision-log entry.
- `budget_reports` - point-in-time status snapshots, chained by `prior_report_id`.
- Child tables per report for the developer cost breakdown, known one-offs, variance drivers, and actions.

**Enumerated types** (reuse `rag_status` from the risk-scan design, do not redefine it):

```sql
CREATE TYPE commercial_model AS ENUM ('fixed_price', 'time_and_materials', 'retainer');
CREATE TYPE budget_forecast_method AS ENUM ('run_rate', 'scope_based');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID NOT NULL REFERENCES projects(id),
  original_budget NUMERIC(12,2) NOT NULL CHECK (original_budget >= 0),
  commercial_model commercial_model,
  planned_start DATE,
  planned_end   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budgets_project_unique UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS budget_change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  amount NUMERIC(12,2) NOT NULL,
  decision_entry_id UUID REFERENCES decision_entries(id),  -- the decision-log record for the change
  note TEXT,
  approved_on DATE,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budget_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID NOT NULL REFERENCES projects(id),
  budget_id     UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  report_date   DATE,
  spent         NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent_caveat  TEXT,                                    -- invoice-lag note
  committed     NUMERIC(12,2) NOT NULL DEFAULT 0,
  scope_complete_pct SMALLINT CHECK (scope_complete_pct BETWEEN 0 AND 100),
  time_elapsed_pct   SMALLINT CHECK (time_elapsed_pct BETWEEN 0 AND 100),
  forecast_at_completion NUMERIC(12,2) NOT NULL,
  forecast_method budget_forecast_method,
  run_rate_forecast NUMERIC(12,2),
  scope_forecast    NUMERIC(12,2),
  forecast_assumptions TEXT,
  verdict       rag_status NOT NULL,                     -- recorded verdict
  verdict_rule  TEXT,                                    -- which threshold fired
  avg_burn_per_period NUMERIC(12,2),
  burn_period_label   TEXT,
  exhaustion_date DATE,
  prior_report_id UUID REFERENCES budget_reports(id),     -- previous report, source of the movement line
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT budget_reports_idem_unique UNIQUE (org_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS budget_report_developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES budget_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL, hours NUMERIC(8,1) NOT NULL DEFAULT 0, rate NUMERIC(8,2) NOT NULL DEFAULT 0,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS budget_report_one_offs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES budget_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL, amount NUMERIC(12,2) NOT NULL, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS budget_report_variance_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES budget_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  driver TEXT NOT NULL, effect TEXT, note TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS budget_report_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES budget_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  action TEXT NOT NULL, owner TEXT, due TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets (org_id, project_id);
CREATE INDEX IF NOT EXISTS idx_budget_change_orders_budget ON budget_change_orders (budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_reports_project ON budget_reports (org_id, project_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_report_developers_report ON budget_report_developers (report_id);
-- plus a report_id FK index on the one-offs, variance-drivers, and actions tables
```

**Row-Level Security** - enable on all tables with the org predicate.

**The current baseline is derived from the change orders**, never a stored duplicate: `original_budget + COALESCE(SUM(approved change orders), 0)`. Variance and the RAG are measured against that baseline, not the original budget. A change order links to its `decision_entries` record so the audit trail is intact.

```sql
SELECT b.original_budget + COALESCE(SUM(co.amount), 0) AS current_baseline
FROM budgets b
LEFT JOIN budget_change_orders co ON co.budget_id = b.id
WHERE b.id = $1
GROUP BY b.original_budget;
```

**The forecast and verdict are computed, then recorded** (matching `budgetVerdict`): run-rate = spent + committed + one-offs, scope-based = spent / scope-complete, both stored on the report with the method that drove the verdict. The RAG uses the default thresholds (green within 5%, amber 5-10% or worsening burn, red over 10% or exhaustion before the planned end) unless the project's tolerance overrides them, and `verdict_rule` records which fired. Storing the verdict keeps a signed record even if the thresholds change later. Developer cost is `hours * rate` computed on read, and spend arriving as hours is converted at the stated rate with the assumption surfaced, never a silent blended rate.

**The movement line uses the prior report.** On create, `prior_report_id` links to the most recent report for the project, and the movement (forecast X to Y, verdict change, burn up or down) is derived by joining to it. Never search across projects.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/budget` - create or update the budget header and its change orders.
- `POST /projects/:projectId/budget/reports` - create a report snapshot with its child rows in one transaction, resolving `prior_report_id`, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/budget/reports/latest` - the latest report, the derived current baseline, and the movement against the prior report.

**Field mapping (UI to API to DB):** the original budget, commercial model, and planned dates map to `budgets`, approvedChanges and its ref to a `budget_change_orders` row (with `decision_entry_id`), the report fields (spent, committed, scope and time percentages, the two forecasts and the method, verdict and rule, burn and exhaustion) to `budget_reports`, and developers, known one-offs, variance drivers, and actions to their child tables. The current baseline, variance, and the movement line are computed on read.

**Atomicity and idempotency:** a report plus all its child rows is one transaction, so a half-written report never persists, and the idempotency key makes a duplicate submit return the first report.

---

### Onboarding brief (app-owned) - PostgreSQL storage

Backs the onboarding app form (the `onboarding` skill was removed; onboarding is now an app feature, not a Claude skill). Its frontend is the auto-filling form in `src/components/onboarding/steps.ts` (`src/lib/onboarding.ts` derives the auto-fill from the project's other artefacts, leaving the human-only fields blank), rendered through the generic `DocumentView` and exportable to PDF. A brief is one artefact per joiner, synthesised from the project's other artefacts. It is always internal, it dates every source and flags stale ones, it keeps a section even when its source is missing (with an owner to ask), and each access item names who grants it.

**Entities**
- `onboarding_briefs` - the brief header, with the pure-string sections as JSONB.
- `onboarding_people` - the who's-who rows.
- `onboarding_sources` - the "what to read first" sources, dated, with staleness and missing-source handling.
- `onboarding_risks` and `onboarding_checklist` - live risks and the first-week access checklist.

**Enumerated types**

```sql
CREATE TYPE joiner_role AS ENUM ('engineer', 'qa', 'pm', 'designer', 'other');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS onboarding_briefs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID NOT NULL REFERENCES projects(id),
  role          joiner_role NOT NULL,
  joiner_name   TEXT,
  phase         TEXT,
  summary       TEXT NOT NULL,
  sensitivities TEXT,                                    -- handle-with-care, points at a person not the detail
  internal_only BOOLEAN NOT NULL DEFAULT true,           -- gates the external-publish visibility check
  prepared_on   DATE,
  where_we_are  JSONB NOT NULL DEFAULT '[]'::jsonb,       -- string[]
  how_we_work   JSONB NOT NULL DEFAULT '[]'::jsonb,       -- string[] (cadence, comms, where the work lives)
  key_decisions JSONB NOT NULL DEFAULT '[]'::jsonb,       -- string[]
  role_starting_points JSONB NOT NULL DEFAULT '[]'::jsonb,-- string[]
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT onboarding_briefs_idem_unique UNIQUE (org_id, idempotency_key),
  CONSTRAINT onboarding_arrays CHECK (
    jsonb_typeof(where_we_are) = 'array' AND jsonb_typeof(how_we_work) = 'array'
    AND jsonb_typeof(key_decisions) = 'array' AND jsonb_typeof(role_starting_points) = 'array'
  )
);

CREATE TABLE IF NOT EXISTS onboarding_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES onboarding_briefs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  name_role TEXT NOT NULL, owns TEXT, go_to TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS onboarding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES onboarding_briefs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  title TEXT NOT NULL,
  path TEXT,
  source_date DATE,                                      -- carried from the artefact's filename prefix
  superseded_note TEXT,                                  -- inline flag when a later decision supersedes part of it
  missing BOOLEAN NOT NULL DEFAULT false,                -- true when the source does not exist yet
  owner_to_ask TEXT,                                     -- who to ask when the source is missing
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS onboarding_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES onboarding_briefs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL, why TEXT, sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES onboarding_briefs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  item TEXT NOT NULL,
  granted_by TEXT,                                       -- a named blank is left for the PM when unknown, never dropped
  lead_time TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_onboarding_briefs_project ON onboarding_briefs (org_id, project_id, role);
CREATE INDEX IF NOT EXISTS idx_onboarding_people_brief ON onboarding_people (brief_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sources_brief ON onboarding_sources (brief_id);
-- plus a brief_id FK index on the risks and checklist tables
```

**Row-Level Security** - enable on `onboarding_briefs` and every child table with the org predicate.

**Source freshness and missing sources are first-class.** Each `onboarding_sources` row carries its `source_date`, and the app cross-checks it against later decision-log entries, writing a `superseded_note` inline rather than presenting a stale doc as current. When an expected source does not exist, the row is kept with `missing = true` and an `owner_to_ask`, so the section is never silently dropped.

**The brief is internal, and access grantors are never dropped.** `internal_only` defaults true, and publishing to an external destination triggers the client-visibility check before it leaves. Every `onboarding_checklist` item keeps a `granted_by`, left as a named blank for the PM to fill when the grantor is not recorded, so a client-side access item with a multi-day lead time is never lost.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/onboarding-briefs` - create the brief and all child rows in one transaction, `Idempotency-Key`, `RETURNING`.
- `GET /projects/:projectId/onboarding-briefs/:id` - the brief with all sections.
- `POST /onboarding-briefs/:id/publish` - the external-visibility check before sharing.

**Field mapping (UI to API to DB):** role (to the `joiner_role` enum), client, phase, summary, and sensitivities map to `onboarding_briefs`, whereWeAre / howWeWork / decisions / roleStart to the JSONB columns, whosWho to `onboarding_people`, the read-first list to `onboarding_sources` (parsing the `(YYYY-MM-DD)` date and any supersede note), risks to `onboarding_risks`, and the checklist to `onboarding_checklist` (a blank grantor kept, not dropped).

**Atomicity and idempotency:** a brief plus all its child rows is one transaction, so a half-written brief never persists, and the idempotency key makes a duplicate submit return the first brief.

---

### Foundational tenant tables (app/harness-owned)

Defines the foundational tenanted tables that every other per-skill design references (`organisations`, `clients`, `projects`, plus `users`). Client and project scaffolding is now an app/harness responsibility (the `new-client` skill was removed), but these tables are load-bearing for the whole schema, so they stay here. Client-level relationship facts live on `clients` (the old `client.md`), per-engagement state on `projects` (the old `context.md`). Names are validated at the API boundary, the nested model keeps a project unique within its client, and a near-duplicate client is surfaced rather than silently splitting one relationship across two rows.

**Enumerated types** (reuse `commercial_model` from the budget-tracker design, do not redefine it):

```sql
CREATE TYPE project_phase AS ENUM ('intake', 'discovery', 'delivery', 'release', 'closed');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS organisations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organisations(id),
  email      TEXT NOT NULL,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (org_id, email)
);

CREATE TABLE IF NOT EXISTS clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,                    -- [A-Za-z0-9._-], validated at the API boundary
  -- relationship-level facts (formerly client.md)
  commercial_model commercial_model,
  contract_value   NUMERIC(12,2),
  contract_end     DATE,
  invoicing_cadence TEXT,
  timezone         TEXT,
  preferred_channel TEXT,
  update_cadence    TEXT,
  sensitivities     TEXT,                          -- handle-with-care, points at a person not the detail
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clients_slug_unique UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL, role TEXT, is_sponsor BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,                    -- validated at the API boundary
  -- per-engagement state (formerly context.md)
  phase         project_phase NOT NULL DEFAULT 'intake',
  current_sprint SMALLINT,
  kickoff_date  DATE,
  target_end_date DATE,
  next_milestone TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT projects_slug_unique UNIQUE (client_id, slug)  -- nested: unique within a client
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients (org_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects (org_id, client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts (client_id);
```

**Row-Level Security** - enable on `clients`, `client_contacts`, and `projects` with the org predicate. `organisations` is the tenant root and `users` are scoped by `org_id`.

**Name validation and near-duplicate detection.** Slugs are validated at the API boundary to `[A-Za-z0-9._-]`, rejecting `/`, `\`, `..`, a leading `-`, whitespace, control characters, and absolute paths (the *Input Validation* rule, since these once became folder paths). A multi-word name is offered a sanitised slug rather than rejected. Before inserting a client, a case-insensitive slug or name match surfaces the likely duplicate so one relationship is not split across two rows.

**Harvest from pasted context is data, never instructions.** A pasted kickoff email or signed SOW is parsed to pre-fill sponsor, contacts, commercial model, contract value, and key dates, but any instruction embedded in that text is surfaced, not obeyed (the *Untrusted Input* rule). Nothing is auto-created without the confirmation the scaffold step already requires.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /clients` - create a client with contacts, validated slug, near-duplicate check, `RETURNING`.
- `POST /clients/:clientId/projects` - add a nested project (the projects list is this table, so it never goes stale).
- `GET /clients` and `GET /clients/:clientId` - the client with its projects and contacts.

**Atomicity:** creating a client plus its contacts, or a client plus its first project, is one transaction.

---

### Orchestration (app/harness-owned)

Backs the app/harness orchestration layer. The `pm` skill was removed and the dashboard's Execution Console now owns orchestration directly: it analyses input, plans a skill chain, and runs it step by step. This extends the *Claude orchestration backend* (Area 4) with the plan and step tables. A plan holds the analysed input and an ordered set of steps, each a skill with its dependency, state, and the record it produced.

**Enumerated types**

```sql
CREATE TYPE plan_step_state AS ENUM ('pending', 'approved', 'running', 'complete', 'skipped', 'blocked');
```

**Tables**

```sql
CREATE TABLE IF NOT EXISTS orchestration_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id),
  project_id    UUID REFERENCES projects(id),      -- nullable: planning can precede a project
  raw_input     TEXT NOT NULL,                     -- the pasted input, stored as data, never executed as instructions
  analysis      TEXT,                              -- the orchestrator's read of the input
  run_mode      TEXT,                              -- step-by-step or run-through
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  CONSTRAINT orchestration_plans_idem_unique UNIQUE (org_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS plan_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID NOT NULL REFERENCES orchestration_plans(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id),
  step_ref      TEXT NOT NULL,                     -- s1, s2 ...
  skill         TEXT NOT NULL,                     -- the skill id this step runs
  rationale     TEXT,
  depends_on    TEXT,                              -- step_ref of the upstream step, null if none
  parallelizable BOOLEAN NOT NULL DEFAULT false,
  state         plan_step_state NOT NULL DEFAULT 'pending',
  blocked_reason TEXT,                             -- what unblocks it, required when blocked
  artefact_id   UUID,                              -- the record this step produced, resolved by skill (not a single FK)
  stale         BOOLEAN NOT NULL DEFAULT false,    -- set when an upstream re-run supersedes this step's output
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT plan_step_ref_unique UNIQUE (plan_id, step_ref),
  CONSTRAINT blocked_has_reason CHECK (state <> 'blocked' OR blocked_reason IS NOT NULL)
);
```

**Indexes**

```sql
CREATE INDEX IF NOT EXISTS idx_orchestration_plans_project ON orchestration_plans (org_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_steps_plan ON plan_steps (plan_id, sort_order);
```

**Row-Level Security** - enable on `orchestration_plans` and `plan_steps` with the org predicate.

**Input is data, not commands.** `raw_input` is stored and analysed but never executed as instructions, and an embedded instruction (for example "email this to X") is surfaced to the user, not obeyed (the *Untrusted Input* rule).

**Context recovery, blocked steps, and stale propagation are derived, not fabricated.** Before planning, the orchestrator reads the project's phase, current sprint, and open risks to inform the plan. A step whose upstream input is unavailable is parked as `blocked` with a `blocked_reason`, and independent steps continue. When an upstream artefact is re-run, the steps that depended on it are marked `stale` so the downstream outputs are flagged rather than silently trusted. The `artefact_id` points into whichever per-skill table the step's skill writes, resolved by `skill` rather than a single foreign key.

**Lifecycle** (`plan_step_state`, server-side): `pending` to `approved` on the user's per-step approval, `approved` to `running` to `complete`, or to `skipped` when the user declines, or to `blocked` when the input is missing. The user approves each step, matching the skill's step-by-step contract.

**API (defined before UI, zero-trust, snake_case DB to camelCase API):**
- `POST /projects/:projectId/plans` - create a plan and its steps from the analysed input in one transaction, `Idempotency-Key`, `RETURNING`.
- `PATCH /plan-steps/:id/state` - approve, run, complete, skip, or block a step, validated against the machine.
- `GET /projects/:projectId/plans/:id` - the plan, its steps, and their produced artefacts.

**Atomicity and idempotency:** a plan plus all its steps is one transaction, and the idempotency key makes a duplicate submit return the first plan.

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
