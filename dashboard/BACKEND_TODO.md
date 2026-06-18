# Backend tasks to do

This dashboard is a client-only React app with no backend, no user accounts, and
no shared state. The features below work for a single user in one browser but
need a server to be complete. They are recorded here so they are not lost.

## Multi-user "unseen" dot (green dot in the skill nav)

Today the green dot tracks, per browser, which generated or changed sections this
user has not viewed yet. It appears when a section is generated and clears when
the user opens it. The per-user "seen" half is implemented client-side in
`src/store/workspace.tsx` (`unseenSkills`, `markUnseen`, `markSeen`).

To make it work across multiple users on the same project, a backend needs to:

1. Store each section's content version (shared across users), bumped whenever
   the section is generated or edited.
2. Store each user's last-seen version per section.
3. Sync both in real time, or at least on refresh.

Then the dot shows for any user whose last-seen version is behind the latest, and
clears when they open the section. The editor is marked seen automatically on
save (already done client-side in `saveArtifactValues`).

## Other backend-dependent gaps found so far

- Live orchestration runs through the dev-server proxy only. The static GitHub
  Pages build has no proxy, so live Claude calls do not run there and it serves
  seeded demo data. Production needs a server-side proxy or API.
- "Save locally" is a stub (a toast only). A browser cannot write files silently.
  Real local save needs a download or the File System Access API, and
  server/Drive saves need the connectors below.
- Publishing connectors: Confluence publish works through the dev proxy. Jira,
  Google Drive, Notion, and Gmail are stubs ("coming soon") and need their
  MCP or API integrations.
- All orchestration state (plans, generated artefacts, intake answers, seen
  state) lives in browser memory and resets on reload. Persistence needs a
  backend.
