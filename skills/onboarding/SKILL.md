---
name: onboarding
description: Brings a new team member up to speed on a client project by synthesising the existing artefacts and context into a single starter brief. Use whenever someone says "onboard a new joiner", "bring someone up to speed", "starter pack for the new dev/PM", or a new person is joining an in-flight project and needs the essentials fast. Reads the project's context and artefacts and produces a one-page orientation - not a charter.
version: 1.0.0
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

1. Identify the active client/project. If `clients/CLIENT/PROJECT/` exists, read `client.md`, `context.md`, and scan the artefact folders for the latest charter, PRD, risk scan, and sprint docs.
2. If no context files exist, ask the user to paste the key artefacts (charter, PRD, current sprint) - honour the **Connection Failsafe** approach: work from whatever is provided.
3. Confirm the joiner's role to set emphasis (engineers → tech + stories; PMs → stakeholders + risks + status).

---

## Output Template

### Onboarding Brief - [Project] for [Role]
**Prepared:** [Today] | **Client:** [CLIENT] | **Current phase:** [Phase]

#### In One Paragraph
[What this project is, who it's for, and why it exists. Plain English.]

#### Where We Are Now
- Phase: [Phase] | Current sprint: [N] - [goal]
- Status: 🟢/🟡/🔴 - [one line]
- Last artefact: [name + path]

#### Who's Who
| Name / Role | What they own | When to go to them |
|---|---|---|
| [Sponsor] | Budget, final calls | [Escalations] |
| [Tech lead] | Architecture | [Technical decisions] |

#### What to Read First (in order)
1. [Charter - the why and the scope] - `path`
2. [PRD - what we're building] - `path`
3. [Current sprint SOW / plan] - `path`

#### Key Decisions Already Made
- [From the decision log - what was decided and why, so the joiner doesn't reopen settled questions]

#### Live Risks & Open Questions
| Item | Why it matters |
|---|---|
| [Risk/question] | [Impact] |

#### Role-Specific Starting Points
- [Tailored to the joiner's role - first tickets, environments, access needed, who to pair with]

#### First-Week Checklist
- [ ] [Access / accounts needed]
- [ ] [Read the three docs above]
- [ ] [Intro to key stakeholders]
- [ ] [First task / shadowing]

---

## After Generating

Follow the **Saving Artefacts** rules in `.claude/claude.md`. Default local path: `clients/CLIENT/project-artefacts/YYYY-MM-DD-onboarding-[role].md`. Offer to share it with the joiner via the connected platform (Confluence, Drive, Gmail) or as clean markdown.
