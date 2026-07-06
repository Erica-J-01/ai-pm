---
name: sprint-sow
description: Generates a Sprint Scope of Work (SOW) document in the exact format used by the team - with Sprint Goal, Overview, Timeline, Team table, Deliverables by Theme (each with a ticket table), Out of Scope list, and Definition of Done checklist. Use this skill whenever the user asks to create, draft, or update a sprint SOW, scope of work document, or sprint planning document. Trigger even if they say "write up the sprint", "create the SOW", or "document this sprint".
version: 1.0.0
argument-hint: <sprint goal, dates, team, and ticket list>
allowed-tools: Read, mcp__claude_ai_Atlassian_Rovo__createConfluencePage, mcp__claude_ai_Google_Drive__create_file, mcp__claude_ai_Notion__notion-create-pages
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please share the sprint details - sprint number, goal, start and end dates, team members and roles, and the ticket list with assignees."*

---

# Sprint Scope of Work Generator

You produce sprint SOW documents that match the team's exact Confluence format. The output is a clean, structured markdown document ready to be pasted into Confluence or saved as a file.

---

## DOCUMENT STRUCTURE (MANDATORY - follow this order exactly)

### Header Block

```
Prepared By: [Name]
Date: [Date]
Link to the Jira Board: [URL]
```

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

Ticket references use Jira-style links: `[TICKET-1](url)`

```markdown
## Sprint Team

| Team Member | Role | Assigned Tickets |
| --- | --- | --- |
| [Name] | [Role] | [TICKET-1](url), [TICKET-2](url) |
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

```markdown
## Deliverables by Theme

### 1. [Theme Name]

[One sentence describing what this theme establishes and why.]

| Ticket | Deliverable | Description | Assignee |
| --- | --- | --- | --- |
| [TICKET](url) | [Short noun phrase] | [Plain English description of what it does.] | [Name] |

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
* [Item - deferred to Sprint N ([TICKET](url))]
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

## BEHAVIOUR RULES

1. **Ask before generating** if you are missing any of: sprint number, sprint goal, team members + roles, ticket list with assignees, sprint dates. Do not invent placeholders silently - ask the user to confirm.
2. **Never invent ticket numbers or URLs.** Use `[TICKET-?](url)` as a placeholder if not provided.
3. **Match the writing register** - plain English, present-tense imperative for deliverable descriptions ("Establishes...", "Validates...", "Provides..."). No buzzwords, no passive voice bloat.
4. **No extra sections.** Do not add Executive Summary, User Stories, Acceptance Criteria, Assumptions, or Epics. This is an SOW, not a spec document.
5. **Tables over bullets** - always use tables for deliverables, never bulleted lists.
6. **One document per sprint** - do not mix sprints or produce multiple SOWs in one response.

---

## OUTPUT DELIVERY

1. Render the full document in chat as clean markdown.
2. Follow the **Saving Artefacts** rules in `.claude/CLAUDE.md` - ask where to save before writing anything. Default local path: `clients/CLIENT/sprint-artefacts/YYYY-MM-DD-sprint-N-sow.md`
3. **If the chosen platform isn't connected** (Confluence, Drive, or Notion MCP unavailable): say so and fall back to a local file or clean markdown to copy. Never claim a page was published when no MCP tool actually ran. See *Connection Failsafe* in `.claude/CLAUDE.md`.