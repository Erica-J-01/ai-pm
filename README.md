![GitHub stars](https://img.shields.io/github/stars/Erica-J-01/ai-pm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://github.com/Erica-J-01/ai-pm/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/Erica-J-01/ai-pm/pulls)
[![Built for Claude Code](https://img.shields.io/badge/Built%20for-Claude%20Code-blueviolet?style=flat-square)](https://claude.ai/code)

# AI PM Assistant: Your Senior PM Co-Pilot in Claude Code

> 18 structured PM skills across the full delivery lifecycle. From raw stakeholder message to production release - without switching tools.

Designed for Claude Code. Drop it into any project and get a senior PM brain on demand.

## Start Here

Raw stakeholder message? → `/triage`  
New project kicking off? → `/charter`  
Writing requirements? → `/prd`  
Breaking down stories? → `/stories`  
Starting a sprint? → `/sprint-sow`  
Planning a sprint? → `/sprint-planning`  
Ready to ship? → `/release-checklist`  
Logging a decision or plan change? → `/decision-log`  
Running a retro? → `/retrospective`  
Updating stakeholders? → `/stakeholder-update`  
Building a roadmap? → `/roadmap`  
Tracking the budget? → `/budget-tracker`  
Onboarding a joiner? → `/onboarding`  
Not sure which skill you need? → `/pm [paste anything]`

If this project helps you, ⭐ the repo.

---

## Why AI PM Assistant?

Generic AI gives you text. AI PM Assistant gives you structure.

Each skill encodes a proven PM workflow - intake triage, risk analysis, discovery, PRDs, user stories, sprint planning - and walks Claude through it step by step. You get the rigour of a senior PM built into your terminal, not sitting in a workshop somewhere.

The result: decision-ready artefacts in minutes, not hours.

---

## How It Works

**Skills** are the building blocks. Each skill file gives Claude a defined workflow, output format, and style rules for a specific PM task. Skills are loaded automatically when relevant.

**Commands** are slash commands that invoke a skill directly (`/triage`, `/prd`, `/stories`). The **PM Orchestrator** (`/pm`) reads your input, picks the right skill, and chains them in delivery order.

**Skill chain:**

```
Raw request → /triage → /risk-scan → /charter → /discovery → /prd → /stories → /sprint-sow → /sprint-planning → /release-checklist
                                                                                                                          ↕
                                                                                                                  /decision-log (runs after any skill that surfaces a decision)
```

After any command completes, the next logical skill is suggested - just follow the prompts.

---

## Setup

```bash
git clone https://github.com/Erica-J-01/ai-pm.git
cd ai-pm
claude .
```

Claude reads `CLAUDE.md` and `.claude/CLAUDE.md` automatically, and registers slash commands from `.claude/commands/`. No configuration needed to start.

> **New here? Read [INSTRUCTIONS.md](INSTRUCTIONS.md)** for a full walkthrough: starting the engine, connecting your tools step by step, and clear instructions for each of the 18 skills.

---

## Connecting Your Tools (MCP) - optional

Everything works out of the box as a text-in, markdown-out tool. **Connecting your tools is optional** - it just removes copy-paste: skills can then read live Jira data and publish straight to Confluence, Google Drive, Notion, or Gmail.

**If nothing is connected**, skills fall back gracefully: they ask you to paste ticket data (instead of pulling it) and render clean markdown or save locally (instead of publishing). You never lose output - see the *Connection Failsafe* in [.claude/CLAUDE.md](.claude/CLAUDE.md).

**Two ways to connect:**

1. **Claude connectors (simplest).** Enable the Atlassian (Jira/Confluence), Google Drive, Notion, and Gmail connectors in Claude. The skills are pre-wired to the resulting tool names - no config files needed.

2. **Self-hosted MCP servers.** Copy the template and fill in your details:
   ```bash
   cp .mcp.json.example .mcp.json
   ```
   Put real credentials in environment variables (referenced as `${VAR}` in `.mcp.json`) or a `.env` file. Both `.mcp.json` and `.env` are gitignored - **credentials are never committed.**

   Get an Atlassian API token from `id.atlassian.com` → Security → API tokens.

> Personal overrides and secrets belong in `.claude/settings.local.json`, `.env`, or `.mcp.json` - all gitignored. Never hardcode tokens in tracked files.

---

## Available Skills

<details>
<summary><strong>intake-triage</strong> - Turn a raw stakeholder message into a structured intake summary</summary>

**What it does:**  
Reads a forwarded email, Slack message, or vague client request and produces a structured intake summary with problem statement, requestor context, priority signals, and a recommended next step.

**When to use:**  
- You receive a raw message and need to understand what's actually being asked  
- You want to triage before committing to scope  
- You need a clean summary to share with your team

**Command:** `/triage`

**Example:**
```
/triage
Here's a message from our client: "We need the reporting dashboard to show 
real-time data. The exec team is presenting to the board next month and the 
current refresh rate is embarrassing."
```

</details>

<details>
<summary><strong>risk-scan</strong> - Risk register with scoring, owners, and trigger signals</summary>

**What it does:**  
Analyses a project, PRD, or feature request and produces a risk register with likelihood/impact scoring, suggested owners, and early warning signals to watch.

**When to use:**  
- Phase gate reviews  
- Before signing off on scope  
- Alongside any other skill in the chain

**Command:** `/risk-scan`

</details>

<details>
<summary><strong>project-charter</strong> - Sponsor-ready project charter</summary>

**What it does:**  
Produces a complete project charter: objectives, scope, success metrics, stakeholders, assumptions, constraints, and a high-level timeline.

**When to use:**  
- Formalising a new project or engagement  
- Getting executive sign-off  
- Aligning a cross-functional team before discovery

**Command:** `/charter`

</details>

<details>
<summary><strong>discovery-workshop</strong> - Discovery workshop guide and output structure</summary>

**What it does:**  
Plans a discovery workshop or structures the output from one. Produces a facilitation guide, session agenda, or clean discovery summary depending on what you provide.

**When to use:**  
- Planning a discovery session with stakeholders  
- Synthesising notes from a workshop you've already run  
- Moving from problem space to solution space

**Command:** `/discovery`

</details>

<details>
<summary><strong>prd</strong> - Full Product Requirements Document</summary>

**What it does:**  
Runs a structured 10-question intake interview before writing - asking one question at a time to confirm document type (PRD vs BRD), scope boundaries, target users, success metrics, constraints, and NFR targets. Conditional questions trigger automatically when signals like stale input, regulated context, or missing out-of-scope items are detected. No document is generated until the final gate question is answered.

Once intake is complete it produces a full PRD or BRD: purpose and background, goals and success metrics, users and stakeholders, assumptions and constraints, functional requirements (grouped by feature area with error states as first-class FRs), non-functional requirements (with concrete targets), out-of-scope items, dependencies, open questions, and sign-off table. Any scope divergence from the source document is logged in a dedicated Scope Changes section.

**When to use:**  
- Documenting requirements for a new feature or product  
- Aligning engineering, design, and stakeholders before build  
- Creating a source of truth for the sprint

**Command:** `/prd`

</details>

<details>
<summary><strong>user-stories</strong> - Jira-ready epics and user stories with acceptance criteria</summary>

**What it does:**  
Breaks requirements into epics and user stories following the 3 C's (Card, Conversation, Confirmation) and INVEST criteria. Each story includes a description, design notes, and testable acceptance criteria.

**When to use:**  
- Populating a backlog from a PRD or feature description  
- Preparing tickets before sprint planning  
- Breaking down a large feature into shippable increments

**Command:** `/stories`

</details>

<details>
<summary><strong>sprint-report</strong> - Sprint report analysis from Jira data</summary>

**What it does:**  
Analyses sprint data (velocity, completion rate, carry-over, blockers) and produces a structured sprint report with insights and recommendations for the next sprint.

**When to use:**  
- End-of-sprint review prep  
- Velocity trend analysis  
- Stakeholder reporting

**Command:** `/sprint-report`

</details>

<details>
<summary><strong>sprint-sow</strong> - Sprint Scope of Work document</summary>

**What it does:**  
Produces a sprint SOW with sprint goal, in-scope stories, out-of-scope items, dependencies, risks, and definition of done.

**When to use:**  
- Sprint kick-off documentation  
- Client-facing sprint agreements  
- Aligning stakeholders on what will and won't ship

**Command:** `/sprint-sow`

</details>

<details>
<summary><strong>meeting-note</strong> - Clean meeting minutes from raw transcripts</summary>

**What it does:**  
Turns a raw meeting transcript or bullet-point notes into structured minutes: attendees, decisions made, action items with owners and due dates, and parking lot items.

**When to use:**  
- Post-meeting documentation  
- Capturing decisions before they get lost  
- Sharing outcomes with stakeholders who weren't in the room

**Command:** `/meeting-notes`

</details>

<details>
<summary><strong>technical-feasibility-review</strong> - PM-ready review of SA proposals and architecture docs</summary>

**What it does:**  
Reads a solution architect proposal, architecture doc, or integration spec and produces a PM-ready feasibility summary: delivery risks, dependency flags, and a prioritised list of questions for the tech lead.

**When to use:**  
- Reviewing an SA proposal before committing to delivery  
- Translating a technical doc into PM language  
- Preparing for a feasibility conversation with engineering

**Command:** `/tech-review`

</details>

<details>
<summary><strong>sprint-planning</strong> - Sprint plan with capacity, backlog scoping, dependencies, and key dates</summary>

**What it does:**
Takes team availability, a prioritised backlog, and a sprint goal and produces a structured sprint plan: capacity table, P0/P1/P2 backlog breakdown, dependency tracking, risk flags, definition of done, and key dates. Defaults to 70-80% capacity planning and flags overcommitment explicitly.

**When to use:**
- Planning an upcoming sprint with a defined team and backlog
- Working out realistic capacity after accounting for PTO and meetings
- Aligning stakeholders on what will and won't ship this sprint

**Command:** `/sprint-planning`

**Example:**
```
/sprint-planning
Sprint 3, 2 weeks. Team: Alice (FE, 8 days), Ben (BE, 7 days - 1 day PTO).
Goal: Ship the client dashboard with live data.
Backlog: PROJ-12 Dashboard UI (3pts), PROJ-13 Data API (5pts), PROJ-14 Export (2pts), PROJ-15 Notifications (3pts - stretch).
Carryover: PROJ-11 Auth bug (2pts, blocked last sprint by infra).
```

</details>

<details>
<summary><strong>release-checklist</strong> - Go/no-go assessment before any production release</summary>

**What it does:**  
Runs a structured readiness assessment across 7 categories - feature completeness, testing, operational readiness, communications, dependencies, approvals, and post-release readiness. Every checklist item is scored PASS / FAIL / RISK / UNCONFIRMED / N/A. Produces a categorised checklist, a blockers list, and one of three verdicts: **GO**, **NO-GO**, or **CONDITIONAL GO**.

**When to use:**  
- Before any planned sprint release  
- Before shipping a hotfix or emergency patch  
- Coordinating a phased or feature-flagged rollout  
- Running a release readiness meeting with engineering and QA  
- When a stakeholder asks "are we ready to ship?"

**Command:** `/release-checklist`

**Example:**
```
/release-checklist
Release: Sprint 22 - Invoicing v2
Type: Planned sprint release
Date: Friday 30 May 2026, 6:00 PM AEST
Tickets: FIN-441, FIN-442, FIN-443, FIN-451, FIN-461, FIN-470
Team: PM Erica J, Tech lead Marcus R, QA lead Priya S, DevOps Tom W
QA sign-off received for FIN-441 and FIN-442. FIN-443 still in testing.
No load testing done. Rollback plan exists but unreviewed.
```

</details>

<details>
<summary><strong>decision-log</strong> - Structured decision log for plan changes, scope revisions, and approvals</summary>

**What it does:**  
Extracts decisions from any input - a change request, scope revision, or prior skill output - and produces a structured 11-column decision log table covering area, original plan, revised plan, reason, change owner, delivery impact, technical impact, product owner impact, cost impact, change status, and approver.

**When to use:**  
- A timeline, scope, budget, or architecture decision has been made and needs an audit trail  
- The PM Orchestrator detects a decision in a skill output and asks whether to log it  
- You need a formal change record to share with stakeholders or attach to a charter

**Command:** `/decision-log`

**Example:**
```
/decision-log
We were planning a 3-month delivery but the client moved the go-live to 6 weeks.
Engineering flagged this as a scope risk. We also dropped the reporting module from MVP.
```

</details>

<details>
<summary><strong>retrospective</strong> - Sprint/project retro with owned action items</summary>

**What it does:**  
Facilitates a retro (format, agenda, prompts) or turns raw retro notes into a structured summary: what went well, what didn't (as blameless themes), and action items each with a single owner and a date. Reviews whether the last retro's actions actually got done.

**When to use:**  
- End of a sprint or project phase  
- Turning a messy retro board into owned next steps  
- Carrying improvement actions into the next `/sprint-planning`

**Command:** `/retrospective`

</details>

<details>
<summary><strong>stakeholder-update</strong> - Audience-ready status update</summary>

**What it does:**  
Translates delivery detail into a concise update for a specific audience (sponsor, exec, client, or team): RAG status, progress as outcomes, what's next, risks, and any decisions needed. Drafts it as an email, Confluence page, or copy-ready text.

**When to use:**  
- Weekly or milestone stakeholder comms  
- Briefing a sponsor or client on progress  
- Turning a sprint report into something a non-delivery audience will read

**Command:** `/stakeholder-update`

</details>

<details>
<summary><strong>roadmap</strong> - Now/Next/Later or quarterly roadmap</summary>

**What it does:**  
Sequences initiatives into themes and time horizons with dependencies and honest confidence levels (near-term firm, later directional). Produces a Now/Next/Later or quarterly view, plus what's explicitly parked and why.

**When to use:**  
- Communicating direction to stakeholders  
- Sequencing a backlog into themes after a charter or PRD  
- Quarterly or half-year planning

**Command:** `/roadmap`

</details>

<details>
<summary><strong>budget-tracker</strong> - Spend vs budget with burn-rate forecast</summary>

**What it does:**  
Compares spend to date against the charter budget, forecasts cost at completion, and flags overrun early with a RAG verdict, variance drivers, and recommended actions. Built to catch problems while there's still time to act.

**When to use:**  
- Monthly or per-sprint budget check-ins  
- Answering "are we on budget?"  
- Spotting burn-rate risk before it becomes an overrun

**Command:** `/budget-tracker`

</details>

<details>
<summary><strong>onboarding</strong> - Starter brief for a new joiner</summary>

**What it does:**  
Synthesises a project's existing artefacts and context into a one-page orientation for a new team member: what the project is, where it stands, who's who, what to read first, decisions already made, live risks, and a role-specific first-week checklist.

**When to use:**  
- A new dev, QA, PM, or designer joins an in-flight project  
- Bringing someone up to speed without a series of meetings  
- Capturing project knowledge in one place

**Command:** `/onboarding`

</details>

---

## PM Orchestrator

Not sure which skill to use? The `/pm` command analyses your input and routes it automatically.

```
/pm Here's a message from my client - [paste anything]
```

Claude will read the input, identify the right skill (or chain of skills), and ask for your approval before running each step. You stay in control.

---

## Project Structure

```
.mcp.json.example                    # MCP connection template (copy to .mcp.json, gitignored)
CHANGELOG.md                         # Release notes + the v2.0 roadmap
.claude/
  CLAUDE.md                          # Behaviour rules, output defaults, skill routing
  commands/                          # Slash command entry points (picked up by Claude Code)
    pm.md                            # /pm - PM Orchestrator
    triage.md  risk-scan.md  charter.md  discovery.md  prd.md  stories.md
    sprint-report.md  sprint-sow.md  sprint-planning.md  meeting-notes.md
    tech-review.md  release-checklist.md  decision-log.md
    retrospective.md  stakeholder-update.md  roadmap.md  budget-tracker.md
    onboarding.md  new-client.md
  settings.json                      # Permissions config (cat scoped to clients/)
skills/                              # Skill definitions (project root)
  pm/                                # PM Orchestrator (reads client/project context)
  triage/  risk-scan/  charter/  discovery/  prd/  stories/      # core chain
  sprint-report/  sprint-sow/  sprint-planning/                  # sprint skills
  meeting-notes/  tech-review/  release-checklist/  decision-log/
  retrospective/  stakeholder-update/  roadmap/                  # v2.0 additions
  budget-tracker/  onboarding/  new-client/
    SKILL.md                         # each skill: SKILL.md (+ reference.md where helpful)
tests/                               # Skill smoke tests - input + expected-structure checks
clients/                             # Local only - excluded from version control
  CLIENT/
    client.md                        # Shared relationship facts (stakeholders, billing)
    PROJECT/
      context.md                     # Per-engagement state (phase, sprint, risks, log)
      project-artefacts/  sprint-artefacts/  meeting-notes/  user-stories/
```

---

## Client Data

The `clients/` directory is excluded from this repo via `.gitignore`. All client artefacts live there locally and are never committed to version control.

After cloning, create your own client folder:

```bash
mkdir -p clients/YOUR_CLIENT/project-artefacts
```

Skills will ask you where to save each artefact. You can save locally, or push directly to Confluence, Jira, Google Drive, Notion, or Gmail if you have those connected via MCP.

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b skill/your-skill-name`
3. Follow the existing skill structure (`SKILL.md` + `reference.md` minimum)
4. Open a pull request

**Skill authoring checklist:**

- `name`, `description`, `version`, `argument-hint`, `allowed-tools` in frontmatter
- `## Input` block with `$ARGUMENTS` and a fallback ask if empty
- What to Gather First (inputs required before generating)
- Output template - exact structure Claude will follow
- Save prompt following the Saving Artefacts rules in `.claude/CLAUDE.md`
- A `reference.md` worked example (input → output) where helpful

See any existing skill for the pattern.

---

## Requirements

- [Claude Code](https://claude.ai/code) - CLI or VS Code extension
- An Anthropic account with Claude Code access

---

## License

MIT - see [LICENSE](LICENSE).

---

## Credits

Created by **Erica**, the original author of AI PM Assistant ([Erica-J-01/ai-pm](https://github.com/Erica-J-01/ai-pm)). This repository is a fork with modifications; all original design and authorship credit belongs to the original author.
