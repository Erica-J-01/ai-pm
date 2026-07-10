---
name: onboarding
description: Brings a new team member up to speed on a client project by synthesising the existing artefacts and context into a single starter brief. Use whenever someone says "onboard a new joiner", "bring someone up to speed", "starter pack for the new dev/PM", or a new person is joining an in-flight project and needs the essentials fast. Reads the project's context and artefacts and produces a one-page orientation - not a charter.
version: 1.1.0
argument-hint: <client/project + the joiner's role>
allowed-tools: Read, Bash(ls:*), Bash(find:*), Bash(cat:clients/*)
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Which client/project is the new person joining, and what's their role (dev, QA, PM, designer)? I'll pull together a starter brief from the existing artefacts."*

---

# Onboarding Brief

Get a new joiner productive fast. Pull from what already exists - `client.md`, `context.md`, and the project's artefacts - rather than inventing. Tailor depth to the role.

## What to Gather First

1. Identify the active client/project. If `clients/CLIENT/PROJECT/` exists, read `client.md`, `context.md`, and scan the artefact folders for the latest charter, PRD, risk scan, and sprint docs. Note any relationship sensitivities in `client.md` for the header line below.
2. **Source coverage and freshness pass.** If no context files exist at all, ask the user to paste the key artefacts (charter, PRD, current sprint) - honour the **Connection Failsafe** approach: work from whatever is provided. The common case is partial (charter yes, PRD no, decision log empty). For each template section whose source is missing, keep the section and state the gap with a named owner to ask - e.g. "No decision log - nothing is documented as settled. Check with [PM] before treating anything as decided." Never silently drop a section. For sources that do exist, carry each file's `YYYY-MM-DD` filename prefix as an inline date, and cross-check the charter and PRD dates against later decision-log entries. Flag anything superseded inline (e.g. "PRD 2026-03-10 - note: 2026-05-02 decision cut feature X"). Never present a stale doc as current truth.
3. Confirm the joiner's role to set emphasis. Engineers → tech + stories. PMs → stakeholders + risks + status. QA → test environments and test data, definition of done, known quality debt from sprint reports and retros. Designers → design system / Figma location, brand and accessibility constraints. If `context.md` does not record cadence and logistics (ceremony times, sprint length, comms channels, Jira key / Confluence space / repo), ask for them in this same message so it costs no extra round-trip.

---

## Output Template

### Onboarding Brief - [Project] for [Role]
**Prepared:** [Today] | **Client:** [CLIENT] | **Current phase:** [Phase] | **Internal - not for client distribution**
*Handle with care: [1-2 lines max, from `client.md` relationship notes only. Point at a person rather than the detail - e.g. "ask [account lead] before discussing timeline history with the client". Omit if nothing is recorded.]*

#### In One Paragraph
[What this project is, who it's for, and why it exists. Plain English.]

#### Where We Are Now
- Phase: [Phase] | Current sprint: [N] - [goal]
- Status: Green / Amber / Red - [one line]
- Last artefact: [name] - `path` ([YYYY-MM-DD from the filename])

#### How We Work
- Ceremonies: [standup time, sprint length, review/retro slots]
- Comms: [Slack/Teams channels]
- Where the work lives: [Jira key | Confluence space | repo]

[Pull from `context.md`. If not recorded there, use what the PM supplied in step 3.]

#### Who's Who
| Name / Role | What they own | When to go to them |
|---|---|---|
| [Sponsor] | Budget, final calls | [Escalations] |
| [Tech lead] | Architecture | [Technical decisions] |

#### What to Read First (in order)
1. [Charter - the why and the scope] - `path` ([YYYY-MM-DD])
2. [PRD - what we're building] - `path` ([YYYY-MM-DD])
3. [Current sprint SOW / plan] - `path` ([YYYY-MM-DD])

[Date every source from its filename prefix. If a later decision-log entry supersedes part of a doc, flag it inline: "PRD 2026-03-10 - note: 2026-05-02 decision cut feature X".]

#### Key Decisions Already Made
- [From the decision log - what was decided and why, so the joiner doesn't reopen settled questions]

#### Live Risks & Open Questions
| Item | Why it matters |
|---|---|
| [Risk/question] | [Impact] |

#### Role-Specific Starting Points
- [Tailored to the joiner's role - first tickets, environments, access needed, who to pair with]

#### First-Week Checklist
- [ ] [Access item] - granted by [name/team] [lead time if known]
- [ ] [Client-side access - VPN, client environments] - granted by [client contact] [lead time - these often run multi-day]
- [ ] [Read the three docs above]
- [ ] [Intro to key stakeholders]
- [ ] [First task / shadowing]

[One access-grantor pair per item. If the grantor is not recorded in `context.md`, leave a named blank for the PM to fill - do not drop the pair.]

---

## After Generating

Follow the **Saving Artefacts** rules in `.claude/claude.md`. Default local path: `clients/CLIENT/project-artefacts/YYYY-MM-DD-onboarding-[role].md`. This brief is internal - it carries escalation paths, live risks, and client sensitivities. If the chosen destination is Confluence, Drive, or Gmail, ask once whether that space, folder, or recipient is client-visible before publishing. Offer to share it with the joiner via the connected platform or as clean markdown.
