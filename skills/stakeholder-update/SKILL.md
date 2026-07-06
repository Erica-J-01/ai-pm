---
name: stakeholder-update
description: Turns project status, sprint reports, or recent artefacts into a concise, audience-appropriate stakeholder update - email, Slack post, or exec summary. Use whenever someone says "write a stakeholder update", "send a status update", "update the sponsor", "weekly comms", or wants to translate delivery detail into a message for a non-delivery audience. Standalone - consumes other artefacts but does not chain into build skills.
version: 1.0.0
argument-hint: <status, sprint report, or recent artefacts + audience>
allowed-tools: Read, mcp__claude_ai_Gmail__create_draft, mcp__claude_ai_Atlassian_Rovo__createConfluencePage
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Who's the audience (sponsor / exec / client / whole team), and what's the latest - paste a sprint report, status notes, or recent artefacts?"*

---

# Stakeholder Update

Translate delivery detail into what the audience actually needs to decide or know. Lead with status and asks, not activity logs.

## What to Gather First

| Input | Required? | Notes |
|---|---|---|
| Audience | Yes | Sponsor, exec, client, or team - sets tone and depth |
| Current status | Yes | RAG + headline |
| Format | No | Email / Slack / Confluence - default email |
| Asks / decisions needed | No | What you need from them |

## Audience guide
- **Sponsor / exec** - outcomes, risks, money, decisions needed. No ticket-level detail.
- **Client** - progress against what was promised, what's next, anything you need from them.
- **Team** - more detail, blockers, coordination.

---

## Output Template

### [Project] - Status Update, [Date]

> **Overall: 🟢 On track / 🟡 At risk / 🔴 Off track**
> [One sentence: the single most important thing they should know.]

**Progress since last update**
- [Outcome, not activity - "Invoicing MVP shipped to staging", not "worked on FIN-441"]

**Coming next**
- [What lands before the next update]

**Risks & issues**
| Item | Impact | What we're doing |
|---|---|---|
| [Risk] | [Plain] | [Action] |

**Decisions / help needed**
- [Specific ask - owner and by-when] *(omit if none)*

**Key dates**
- [Milestone - date]

---

## After Generating

Render the message in chat first. Then follow the **Saving Artefacts** rules in `.claude/claude.md` - offer to draft it as a Gmail message, post to Confluence, or save locally (`clients/CLIENT/project-artefacts/YYYY-MM-DD-stakeholder-update.md`). Honour the **Connection Failsafe**: if Gmail/Confluence isn't connected, render clean copy-ready text instead.
