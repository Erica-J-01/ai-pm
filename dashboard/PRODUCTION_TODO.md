# Production Readiness To-Do

Prioritized backlog from a scalability and production-deploy audit of the dashboard. Every item below was confirmed by an adversarial verifier that read the cited file and tried to refute it. Findings that did not survive that check are not listed.

Scope: seven dimensions were audited - TypeScript strictness, bundle size, React render performance, state persistence, runtime resilience, dead code and dependencies, and deployment hygiene. Blind spots not covered by this pass are noted at the bottom.

Note on JavaScript to TypeScript: the application is already fully TypeScript with `strict` on. The only non-TS files are `postcss.config.js` and `scripts/generateSkillPrompts.mjs` (a dev-only build script). Converting the generator was checked and rejected as near-zero value, so there is no meaningful JS-to-TS conversion left to do.

Severity is the verifier-adjusted call. Effort is a rough size.

---

## P0 - Breaks the public GitHub Pages deployment

These are wired features that fail silently on the deployed site, which is the mass-use surface.

- [x] **PDF upload is dead on the deployed build.** `GlobalWorkerOptions.workerSrc` points at unpkg, but the production CSP allows only `'self'`, so the worker never loads. The catch only logs and still adds the file chip, so users believe the PDF was ingested when the input is empty. Fix: bundle the worker via `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`. `src/components/OrchestratorConsole.tsx:95` (HIGH, small) - DONE: worker now loads as a same-origin `?url` asset (CSP-compatible), and extraction failure surfaces a visible error instead of a false success chip.
- [x] **Live Claude mode is broken on Pages and leaks the API key.** `/api/claude` is dev-server-only middleware. On Pages the request hits github.io, sending the user's key before a 404, while the dialog claims it never leaves the machine. The Confluence path is already gated on `import.meta.env.DEV`, the Claude path is not. Fix: gate it the same way, or add a direct-to-Anthropic production path (the CSP already allows api.anthropic.com). `src/api/claudeOrchestrator.ts:42`, `src/components/ConnectorsDialog.tsx:60` (HIGH, small) - DONE: new `liveClaudeAvailable()` = DEV-and-key gates every live path (getOrchestratorApi, run-all, intake detection, regenerate). In a prod build `import.meta.env.DEV` compiles to false so the path is dead-code-eliminated. ClaudeRow shows a deployed-build notice and hides the key entry.
- [x] **CI deploys without typecheck or tests.** `deploy-pages.yml` runs `npx vite build`, bypassing `tsc -b && vite build` and the 74-test vitest suite. Type-broken code ships straight to production. Fix: add `tsc -b` and `vitest run` gates before publish. `.github/workflows/deploy-pages.yml` (MEDIUM, small) - DONE: `npx tsc -b` and `npx vitest run` steps run before the build.

## P1 - Silent correctness bugs

- [x] **Truncated artefacts marked complete.** `callClaude` never checks `stop_reason` and caps `max_tokens` at 4096, so a full PRD or stories set is cut mid-document but rendered and publishable as done. Fix: detect `stop_reason === 'max_tokens'` and raise the cap or warn. `src/api/claudeOrchestrator.ts:65` (HIGH, small) - DONE: cap raised to 8192, `callClaude` returns a `truncated` flag, and ArtifactViewer shows a warning banner with a Regenerate action.
- [x] **Save locally shows a fake success toast and saves nothing.** The handler fires a success notification and returns without writing. It trains users to trust work a reload then wipes. Fix: real Blob download of the markdown. `src/components/artifacts/ArtifactViewer.tsx:87` (MEDIUM, small) - DONE: triggers a real `YYYY-MM-DD-slug.md` Blob download.
- [x] **Run-all keeps going after a step fails,** reports completion, and seeds the failed steps with stub TEST_DATA, so a failed triage yields plausible-looking canned downstream artefacts. Fix: stop or mark-blocked on a dependency failure. `src/components/OrchestratorConsole.tsx:364` (MEDIUM, medium) - DONE: chain stops on first failure, error accumulated in a local var, no false completion and no stub-seeding of failed steps.
- [x] **Plan JSON validated by type assertion only.** A wrong-shape model reply throws a raw TypeError outside the try/catch, and an unknown skill id passes `as SkillId` and runs the generic fallback prompt. Fix: runtime-validate the shape and filter unknown ids. `src/api/claudeOrchestrator.ts:122` (MEDIUM, small) - DONE: validates `steps` is an array and filters to a known-skill allowlist, with friendly errors.
- [x] **Live regenerate failures are swallowed** with `catch { return }`, so the primary step-by-step Generate button can silently do nothing. Fix: rethrow or toast. `src/store/workspace.tsx:548` (MEDIUM, small) - DONE: `regenerate` rethrows (skill not marked generated on failure); ArtifactViewer toasts the error.
- [x] **ThemeProvider can crash the whole app at boot.** Unguarded `localStorage` access throws SecurityError in privacy-hardened browsers and sandboxed iframes, tripping the root ErrorBoundary into an unrecoverable loop. Every other storage access is guarded, this is the one gap. Fix: try/catch with a light-theme fallback. `src/store/theme.tsx:12,18` (MEDIUM, small) - DONE: both accesses wrapped in try/catch with a light-theme fallback.

## P2 - Scalability and performance

- [x] **No code-splitting - one 1.43 MB entry chunk** (428 kB gzip), three times Vite's warning. The pattern is already proven since pdfjs is split. Add `React.lazy` and `manualChunks`. Sub-wins, biggest first: - DONE: entry chunk now ~315 kB (97 kB gzip), well under the size warning. A later hardening pass removed @tanstack/react-query from the critical path and lazy-loaded all artifact views.
  - [x] recharts and its d3/lodash tail (396 kB, about 28 percent of the entry) is statically imported for just three chart views. Lazy-load them. Single largest win. `src/components/artifacts/RiskScanView.tsx:5` (small) - DONE: RiskScan/SprintReport/BudgetTracker views are `React.lazy`, recharts now a deferred 372 kB chunk.
  - [x] `skillPrompts.ts` (177 kB, only used in live mode, dead on Pages) - dynamic import. `src/api/skillPrompts.ts` (small) - DONE: loaded via `await import` inside the live-call path only.
  - [x] react-markdown stack (about 150 kB) - lazy-load. `src/components/artifacts/MarkdownArtifact.tsx` (small) - DONE: `MarkdownArtifact` is `React.lazy` behind a Suspense boundary.
- [x] **Editor lags on large artefacts.** `ArtifactEditor` rebuilds the full artifact and pushes it into the global store on every keystroke with no debounce. Fix: debounce about 200 ms, or preview from local state. `src/components/ArtifactEditor.tsx:33` (MEDIUM, small) - DONE: preview debounced 200 ms.
- [x] **No timeout, cancel, or 429/529 backoff on Claude calls.** A hung proxy leaves the spinner running forever with a dead Cancel button. Fix: `AbortSignal.timeout`, bounded backoff, and wire the cancel control. `src/api/claudeOrchestrator.ts:42` (MEDIUM, medium) - DONE: 90s per-attempt timeout, exponential backoff with Retry-After on 429/529/5xx, and in-flight runs aborted on project switch/unmount. Note: an interactive Cancel button during run-all is not yet wired (timeout bounds the hang).
- [x] **ArtifactViewer re-serializes the full publish markdown on every render,** even with the dialog closed. Fix: `useMemo` keyed on execution. `src/components/artifacts/ArtifactViewer.tsx:159` (LOW, small) - DONE: memoized with `useMemo` keyed on execution.

## P3 - Hardening and cleanup

- [x] **Turn on `noUncheckedIndexedAccess`.** Core state is string-indexed Records guarded only by convention today. Measured impact: a bounded 33 errors across 6 files, a finite and worthwhile hardening pass. `tsconfig.json` (MEDIUM, medium) - DONE: flag enabled and all 33 resulting errors fixed across adapter, artifactDigest, RiskScanView, StructuredFields, buildArtifact, recordSeeds.
- [x] **Remove three unused @tiptap packages** and the two stale comments that reference them. `package.json` (LOW, small) - DONE: removed from package.json and lockfile, and the pm.ts / adapter.ts comments corrected.
- [x] **Dead `src/lib/sprint.ts`.** Its single-source overcommit math is duplicated inline in `buildArtifact.ts`, so the test green-lights code the app never runs. Fix: wire `buildArtifact` to it, or delete both. `src/lib/sprint.ts` (LOW, small) - DONE: `buildArtifact` now calls `loadStatus`, making it the real single source.

---

## Not covered by this audit

This pass covered the seven dimensions above, which are the highest-value areas for the current client-only architecture. It did not cover:

- Accessibility (keyboard navigation, ARIA, contrast)
- True multi-user scalability (concurrent users, data isolation, auth, server-side rate limiting, cost governance on the Claude key, and durable persistence of in-session work) - these are backend concerns tracked in BACKEND_TODO.md
- Observability: the frontend half is DONE (client-side error capture, React fault reporting, secret-scrubbed structured logging, and a PII-safe event tracker in src/lib/telemetry.ts). The server half (Sentry, structured server logs, an analytics pipeline) is in BACKEND_TODO.md.
- A full security review (a separate pass was done for v3.1)
- Internationalization, browser and device matrix, offline behaviour
- Test coverage breadth, and empirical load testing with large real datasets
