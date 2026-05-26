---
description: "Scaffold a new client folder locally"
agent: "agent"
---

Scaffold a new client folder structure for the client name provided in the user's latest request.

Create the following directory and file structure under `clients/`:

```text
clients/CLIENT_NAME/
  project-artefacts/     ← intake summaries, charters, risk scans, PRDs
  sprint-artefacts/      ← sprint SOWs, sprint reports
  meeting-notes/         ← meeting minutes
  user-stories/          ← epics and story files
  README.md              ← one-liner: client name, project name, current phase
```

Replace `CLIENT_NAME` with the name provided. Use uppercase for the folder name (for example `ACME`, `GLOBEX`).

If the user has not provided the client name yet, ask for it first.

After creating the structure, confirm the folders were created and remind the user that `clients/` is excluded from version control, so client data stays local only.