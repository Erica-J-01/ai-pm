---
name: sprint-sow
description: Generates a Sprint Scope of Work (SOW) document in the exact format used by the team - with Sprint Goal, Overview, Timeline, Team table, Deliverables by Theme (each with a ticket table), Out of Scope list, and Definition of Done checklist. Use this skill whenever the user asks to create, draft, or update a sprint SOW, scope of work document, or sprint planning document. Trigger even if they say "write up the sprint", "create the SOW", or "document this sprint".
version: 1.1.0
argument-hint: <sprint goal, dates, team, and ticket list>
allowed-tools: Read, mcp__claude_ai_Atlassian_Rovo__searchJiraIssuesUsingJql, mcp__claude_ai_Atlassian_Rovo__getJiraIssue, mcp__claude_ai_Atlassian_Rovo__createConfluencePage, mcp__claude_ai_Google_Drive__create_file, mcp__claude_ai_Notion__notion-create-pages
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please share the sprint details - sprint number, goal, start and end dates, team members and roles, and the ticket list with assignees."*

*If the user names a sprint or board and Jira is connected, pull the ticket list, assignees, dates, and estimates with the Jira read tools instead of asking for a paste. If Jira is not connected, say so once and ask for pasted details - see the Connection Failsafe in `.claude/CLAUDE.md`.*

---

# Sprint Scope of Work Generator

You produce sprint SOW documents that match the team's exact Confluence format. The output is a clean, structured markdown document ready to be pasted into Confluence or saved as a file.

---

## DOCUMENT STRUCTURE (MANDATORY - follow this order exactly)

### Header Block

```
Prepared By: [Name]
Date: [Date]
Version: [1.0]
Status: [Draft | Approved]
Link to the Jira Board: [URL]
```

Bump Version on any material revision, per the project's Artefact Versioning rule.

---

### Sprint Goal

A single-sentence blockquote capturing the purpose of the sprint.

```markdown
## Sprint Goal

> [One punchy sentence describing what the sprint achieves and why it matters.]
```

---

### Overview

2-4 sentences of plain English explaining what this sprint delivers (or doesn't), and why it exists in the context of the product.

```markdown
## Overview

[Plain English explanation. What is being built. What is NOT being built. Why this sprint matters for future sprints.]
```

---

### Sprint Timeline

```markdown
## Sprint Timeline

* Sprint Start: [Date]
* Sprint End: [Date]
```

---

### Sprint Team

A markdown table with columns: `Team Member | Role | Assigned Tickets`

Ticket references: when a Jira board or base URL is known, link each key as `[TICKET-1](https://<domain>/browse/TICKET-1)`. When no URL can be derived, write the plain key with no link markup. Never emit a literal `(url)`.

```markdown
## Sprint Team

| Team Member | Role | Assigned Tickets |
| --- | --- | --- |
| [Name] | [Role] | TICKET-1, TICKET-2 |
```

---

### Deliverables by Theme

This is the core section. Group tickets into named themes. Each theme gets:

1. A numbered `### N. Theme Name` heading
2. A 1-sentence description of what the theme establishes
3. A table: `Ticket | Deliverable | Description | Assignee`
4. A `---` divider after each theme table

Rules:
- Theme names must be short and business-readable (not technical jargon)
- Deliverable = short noun phrase describing what is produced
- Description = 1-2 plain English sentences explaining what was built and what it does
- Never use bullet points inside the table
- Always include `---` after each theme block
- If the input or Jira data carries estimates (story points or days), confirm inclusion in the consolidated intake question - the SOW is client-facing and some teams keep internal points out of it. On yes, add an `Estimate` column to each theme table and one line after the last theme: `Sprint total: [N] [points/days]`. If no estimates exist, omit the column entirely - never invent them.

```markdown
## Deliverables by Theme

### 1. [Theme Name]

[One sentence describing what this theme establishes and why.]

| Ticket | Deliverable | Description | Assignee |
| --- | --- | --- | --- |
| TICKET-1 | [Short noun phrase] | [Plain English description of what it does.] | [Name] |

---

### 2. [Theme Name]

...
```

Typical themes (adapt to actual sprint content):
- Project Scaffold & Architecture
- Application Shells
- Shared Backend Infrastructure
- Logging & Observability
- CI/CD & Quality Gates
- Error Handling
- Developer Experience & AI Tooling
- Quality Assurance & Release

---

### Out of Scope

A bulleted list of items explicitly NOT in this sprint. Be specific - name deferred tickets and target sprints where known.

```markdown
## Out of Scope - Sprint [N]

The following are explicitly excluded from this sprint and will be addressed in subsequent sprints:

* [Item]
* [Item - deferred to Sprint N (TICKET-KEY where known)]
```

---

### Dependencies & Assumptions (optional)

Include only when the input itself surfaces client-side dependencies (access, credentials, content, sign-off) or load-bearing assumptions. Never generate this section from nothing and never pad it with boilerplate.

```markdown
## Dependencies & Assumptions

* [Client-side dependency - what is owed, by whom, by when]
* [Load-bearing assumption taken from the input]
```

---

### Definition of Done

A checklist of binary, testable completion criteria. Each item must be objectively verifiable.

```markdown
## Definition of Done

Sprint [N] is considered complete when all of the following conditions are met:

- [ ] [Testable condition]
- [ ] [Testable condition]
```

---

### Approval

One line at the end of the document. Leave it as `Pending` while Status is Draft.

```markdown
Approval: [Approver name], [Date]
```

---

## BEHAVIOUR RULES

1. **One consolidated ask, then proceed.** If any of sprint number, sprint goal, sprint dates, team members + roles, or the ticket list with assignees is missing, gather every gap - plus the carry-over and estimate confirmations - into a single question. If the user says proceed anyway, generate the draft with each gap marked `TBC - confirm` and list the open TBCs after the document. Never re-block once the user has said proceed.
2. **Never invent ticket numbers or URLs.** When a Jira board or base URL is known, link each key as `https://<domain>/browse/<KEY>`. When no URL can be derived, write the plain ticket key with no link markup. Never emit a literal `(url)`.
3. **Match the writing register** - plain English, present-tense imperative for deliverable descriptions ("Establishes...", "Validates...", "Provides..."). No buzzwords, no passive voice bloat.
4. **No invented sections.** Do not add Executive Summary, User Stories, Acceptance Criteria, or Epics. This is an SOW, not a spec document. A short Dependencies & Assumptions list is allowed only when the input itself surfaces client-side dependencies or load-bearing assumptions - never boilerplate, never invented.
5. **Tables over bullets** - always use tables for deliverables, never bulleted lists.
6. **One document per sprint** - do not mix sprints or produce multiple SOWs in one response.
7. **Reconcile carry-over.** Before generating, Read the previous sprint's SOW in the active project's `sprint-artefacts/` folder if one exists. If it deferred an item to this sprint that is missing from the new ticket list, flag the mismatches once ("PDF export was deferred to this sprint but is not in the ticket list - deliberately dropped, or missing?"), folded into the consolidated intake question when one is already being asked. Never block on the answer and never silently add the item.

---

## OUTPUT DELIVERY

1. Render the full document in chat as clean markdown.
2. Follow the **Saving Artefacts** rules in `.claude/CLAUDE.md` - ask where to save before writing anything. Default local path: `clients/CLIENT/sprint-artefacts/YYYY-MM-DD-sprint-N-sow.md`
3. **If the chosen platform isn't connected** (Confluence, Drive, or Notion MCP unavailable): say so and fall back to a local file or clean markdown to copy. Never claim a page was published when no MCP tool actually ran. See *Connection Failsafe* in `.claude/CLAUDE.md`.