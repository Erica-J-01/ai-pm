---
name: stakeholder-update
description: Turns project status, sprint reports, or recent artefacts into a concise, audience-appropriate stakeholder update - email, Slack post, or exec summary. Use whenever someone says "write a stakeholder update", "send a status update", "update the sponsor", "weekly comms", or wants to translate delivery detail into a message for a non-delivery audience. Standalone - consumes other artefacts but does not chain into build skills.
version: 1.1.0
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
| Current status | Yes | RAG + headline - sanity-checked against the evidence, see below |
| Budget position | No | Spend vs budget and trajectory (on / over) - from the latest budget-status artefact, or ask once. Never invent it |
| Format | No | Email / Slack / Confluence - default email |
| Asks / decisions needed | No | What you need from them |

**Build from what's already saved.** When the active client/project is known, offer to assemble the update from the latest sprint report, risk scan, budget status, and previous stakeholder update in `clients/CLIENT/PROJECT/project-artefacts/`, and ask the PM to paste only what's missing. Offer first - never read silently. These artefacts also supply the baselines the trend line, budget line, and key dates below depend on.

## Before You Write

- **Check the claimed RAG against the evidence.** Derive the status from the input itself - sprint data, risks, milestones. If the PM's claimed status conflicts with it, flag the mismatch once ("the sprint data reads Amber but you've asked for Green - confirm before I write it"), then write whatever the PM confirms.
- **State the trend, not just the colour.** The status line shows direction against the previous update ("Amber, down from Green") plus one clause on why it changed. Source the previous status from the most recent stakeholder update in the project folder. If none exists, ask once what was reported last time. If the PM doesn't know, write the status without a trend - never invent one.
- **Answer promised vs delivered.** Mirror the previous update's "Coming next" section so "Progress since last update" explicitly says what was promised and what actually landed.
- **When Amber or Red, the headline carries the slip.** The one-sentence headline must state the impact, the recovery plan, and the ask - never bury a slip mid-message.
- **Mark every key date held or moved.** Show each milestone as held or moved ("UAT start: 4 Aug, was 28 Jul"), baselined against the previous update or the charter. If no baseline exists, print the date plain - never fabricate a "was".
- **Close with the next update date.** Derive the cadence from the project's `context.md` or the previous update. Ask only if it can't be recovered, and skip the line rather than block if there is no set cadence.

## Audience guide
- **Sponsor / exec** - outcomes, risks, money, decisions needed. No ticket-level detail. Always include the budget line - if the position is unknown, write "budget position not assessed this period" rather than omitting it silently.
- **Client** - progress against what was promised, what's next, anything you need from them. Include the budget line only where the engagement reports spend to the client, and never internal cost or margin detail.
- **Team** - more detail, blockers, coordination. Omit the budget line.

**Client-safe second cut.** On request, produce a client-facing version from the same week's internal update. Strip internal-only content - team performance issues, unvetted risks, internal cost and margin - then list what was withheld so the PM can verify nothing sensitive leaked before sending.

---

## Output Template

### [Project] - Status Update, [Date]

> **Overall: [GREEN / AMBER / RED], [held / up from / down from] [previous status] - [one clause on why it changed]**
> [One sentence: the single most important thing they should know. When Amber or Red, this is the impact, the recovery plan, and the ask.]

**Progress since last update**
- [Promised vs delivered against the previous update's "Coming next". Outcome, not activity - "Invoicing MVP shipped to staging", not "worked on FIN-441"]

**Coming next**
- [What lands before the next update]

**Budget** *(sponsor / exec always, client only where spend is reported, omit for team)*
- [Spend vs budget and trajectory (on / over) - or "budget position not assessed this period"]

**Risks & issues**
| Item | Impact | What we're doing |
|---|---|---|
| [Risk] | [Plain] | [Action] |

**Decisions / help needed**
- [Specific ask - owner and by-when] *(omit if none)*

**Key dates**
- [Milestone - date, held / was [previous date]]

**Next update:** [date] *(skip if no set cadence)*

---

## Fit the Format

- **Email** - the full template above.
- **Slack** - compress to the headline, 3-4 bullets, and the ask. Risks become bullets, not a table - pipe tables paste into Slack as unreadable soup.
- **Steering packs and anything exported to Word or Confluence** - text RAG ("AMBER") throughout.
- Text RAG ("GREEN / AMBER / RED") is the baseline everywhere. Use emoji traffic lights only where the medium renders them and the user has asked for them.

---

## After Generating

Render the message in chat first. Then follow the **Saving Artefacts** rules in `.claude/claude.md` - offer to draft it as a Gmail message, post to Confluence, or save locally (`clients/CLIENT/project-artefacts/YYYY-MM-DD-stakeholder-update.md`). Honour the **Connection Failsafe**: if Gmail/Confluence isn't connected, render clean copy-ready text instead.
