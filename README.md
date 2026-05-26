![GitHub stars](https://img.shields.io/github/stars/Erica-J-01/ai-pm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://github.com/Erica-J-01/ai-pm/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/Erica-J-01/ai-pm/pulls)
[![Built for Claude Code](https://img.shields.io/badge/Built%20for-Claude%20Code-blueviolet?style=flat-square)](https://claude.ai/code)
[![Built for GitHub Copilot](https://img.shields.io/badge/Built%20for-GitHub%20Copilot-24292f?style=flat-square)](https://code.visualstudio.com/docs/copilot/overview)
[![Built for Amazon Kiro](https://img.shields.io/badge/Built%20for-Amazon%20Kiro-ff9900?style=flat-square)](https://kiro.dev/docs/)

# AI PM Assistant: Your Senior PM Co-Pilot for Claude, Copilot, and Kiro

> 12 structured PM skills across the full delivery lifecycle. From raw stakeholder message to production release — without switching tools.

Designed for Claude Code, GitHub Copilot, and Amazon Kiro. Drop the matching assistant bundle into your workflow and get the same senior PM system on demand.

## Start Here

Raw stakeholder message? → `/triage`  
New project kicking off? → `/charter`  
Writing requirements? → `/prd`  
Breaking down stories? → `/stories`  
Starting a sprint? → `/sprint-sow`  
Planning a sprint? → `/sprint-planning`  
Ready to ship? → `/release-checklist`  
Not sure which skill you need? → `/pm [paste anything]`

If this project helps you, ⭐ the repo.

---

## Why AI PM Assistant?

Generic AI gives you text. AI PM Assistant gives you structure.

Each skill encodes a proven PM workflow — intake triage, risk analysis, discovery, PRDs, user stories, sprint planning — and walks the assistant through it step by step. You get the rigour of a senior PM built into your workflow, not sitting in a workshop somewhere.

The result: decision-ready artefacts in minutes, not hours.

---

## How It Works

**Skills** are the building blocks. Each skill file gives the assistant a defined workflow, output format, and style rules for a specific PM task. Skills are loaded automatically when relevant.

**Commands** are slash commands that invoke a skill directly (`/triage`, `/prd`, `/stories`). The **PM Orchestrator** (`/pm`) reads your input, picks the right skill, and chains them in delivery order.

**Skill chain:**

```
Raw request → /triage → /risk-scan → /charter → /discovery → /prd → /stories → /sprint-sow → /sprint-planning → /release-checklist
```

After any command completes, the next logical skill is suggested — just follow the prompts.

---

## Setup

```bash
git clone https://github.com/Erica-J-01/ai-pm.git
cd ai-pm
```

Choose the assistant bundle you want to use:

### Claude Code

```bash
claude .
```

Claude reads `CLAUDE.md` and the skills in `.claude/skills/` automatically.

### GitHub Copilot

Open the `copilot/` folder as the workspace root in VS Code.

Copilot reads `.github/copilot-instructions.md`, `.github/skills/`, and `.github/prompts/` from that bundle.

### Amazon Kiro

Open the `kiro/` folder as the workspace root in Kiro.

Kiro reads `AGENTS.md`, `.kiro/skills/`, and `.kiro/steering/` from that bundle.

---

## Available Skills

<details>
<summary><strong>intake-triage</strong> — Turn a raw stakeholder message into a structured intake summary</summary>

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
<summary><strong>risk-scan</strong> — Risk register with scoring, owners, and trigger signals</summary>

**What it does:**  
Analyses a project, PRD, or feature request and produces a risk register with likelihood/impact scoring, suggested owners, and early warning signals to watch.

**When to use:**  
- Phase gate reviews  
- Before signing off on scope  
- Alongside any other skill in the chain

**Command:** `/risk-scan`

</details>

<details>
<summary><strong>project-charter</strong> — Sponsor-ready project charter</summary>

**What it does:**  
Produces a complete project charter: objectives, scope, success metrics, stakeholders, assumptions, constraints, and a high-level timeline.

**When to use:**  
- Formalising a new project or engagement  
- Getting executive sign-off  
- Aligning a cross-functional team before discovery

**Command:** `/charter`

</details>

<details>
<summary><strong>discovery-workshop</strong> — Discovery workshop guide and output structure</summary>

**What it does:**  
Plans a discovery workshop or structures the output from one. Produces a facilitation guide, session agenda, or clean discovery summary depending on what you provide.

**When to use:**  
- Planning a discovery session with stakeholders  
- Synthesising notes from a workshop you've already run  
- Moving from problem space to solution space

**Command:** `/discovery`

</details>

<details>
<summary><strong>prd</strong> — Full Product Requirements Document</summary>

**What it does:**  
Produces a complete PRD: problem statement, goals, non-goals, user stories, functional requirements, edge cases, and open questions.

**When to use:**  
- Documenting requirements for a new feature or product  
- Aligning engineering, design, and stakeholders before build  
- Creating a source of truth for the sprint

**Command:** `/prd`

</details>

<details>
<summary><strong>user-stories</strong> — Jira-ready epics and user stories with acceptance criteria</summary>

**What it does:**  
Breaks requirements into epics and user stories following the 3 C's (Card, Conversation, Confirmation) and INVEST criteria. Each story includes a description, design notes, and testable acceptance criteria.

**When to use:**  
- Populating a backlog from a PRD or feature description  
- Preparing tickets before sprint planning  
- Breaking down a large feature into shippable increments

**Command:** `/stories`

</details>

<details>
<summary><strong>sprint-report</strong> — Sprint report analysis from Jira data</summary>

**What it does:**  
Analyses sprint data (velocity, completion rate, carry-over, blockers) and produces a structured sprint report with insights and recommendations for the next sprint.

**When to use:**  
- End-of-sprint review prep  
- Velocity trend analysis  
- Stakeholder reporting

**Command:** `/sprint-report`

</details>

<details>
<summary><strong>sprint-sow</strong> — Sprint Scope of Work document</summary>

**What it does:**  
Produces a sprint SOW with sprint goal, in-scope stories, out-of-scope items, dependencies, risks, and definition of done.

**When to use:**  
- Sprint kick-off documentation  
- Client-facing sprint agreements  
- Aligning stakeholders on what will and won't ship

**Command:** `/sprint-sow`

</details>

<details>
<summary><strong>meeting-note</strong> — Clean meeting minutes from raw transcripts</summary>

**What it does:**  
Turns a raw meeting transcript or bullet-point notes into structured minutes: attendees, decisions made, action items with owners and due dates, and parking lot items.

**When to use:**  
- Post-meeting documentation  
- Capturing decisions before they get lost  
- Sharing outcomes with stakeholders who weren't in the room

**Command:** `/meeting-notes`

</details>

<details>
<summary><strong>technical-feasibility-review</strong> — PM-ready review of SA proposals and architecture docs</summary>

**What it does:**  
Reads a solution architect proposal, architecture doc, or integration spec and produces a PM-ready feasibility summary: delivery risks, dependency flags, and a prioritised list of questions for the tech lead.

**When to use:**  
- Reviewing an SA proposal before committing to delivery  
- Translating a technical doc into PM language  
- Preparing for a feasibility conversation with engineering

**Command:** `/tech-review`

</details>

<details>
<summary><strong>sprint-planning</strong> — Sprint plan with capacity, backlog scoping, dependencies, and key dates</summary>

**What it does:**
Takes team availability, a prioritised backlog, and a sprint goal and produces a structured sprint plan: capacity table, P0/P1/P2 backlog breakdown, dependency tracking, risk flags, definition of done, and key dates. Defaults to 70–80% capacity planning and flags overcommitment explicitly.

**When to use:**
- Planning an upcoming sprint with a defined team and backlog
- Working out realistic capacity after accounting for PTO and meetings
- Aligning stakeholders on what will and won't ship this sprint

**Command:** `/sprint-planning`

**Example:**
```
/sprint-planning
Sprint 3, 2 weeks. Team: Alice (FE, 8 days), Ben (BE, 7 days — 1 day PTO).
Goal: Ship the client dashboard with live data.
Backlog: PROJ-12 Dashboard UI (3pts), PROJ-13 Data API (5pts), PROJ-14 Export (2pts), PROJ-15 Notifications (3pts — stretch).
Carryover: PROJ-11 Auth bug (2pts, blocked last sprint by infra).
```

</details>

<details>
<summary><strong>release-checklist</strong> — Go/no-go assessment before any production release</summary>

**What it does:**  
Runs a structured readiness assessment across 7 categories — feature completeness, testing, operational readiness, communications, dependencies, approvals, and post-release readiness. Every checklist item is scored PASS / FAIL / RISK / UNCONFIRMED / N/A. Produces a categorised checklist, a blockers list, and one of three verdicts: **GO**, **NO-GO**, or **CONDITIONAL GO**.

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
Release: Sprint 22 — Invoicing v2
Type: Planned sprint release
Date: Friday 30 May 2026, 6:00 PM AEST
Tickets: FIN-441, FIN-442, FIN-443, FIN-451, FIN-461, FIN-470
Team: PM Erica J, Tech lead Marcus R, QA lead Priya S, DevOps Tom W
QA sign-off received for FIN-441 and FIN-442. FIN-443 still in testing.
No load testing done. Rollback plan exists but unreviewed.
```

</details>

---

## PM Orchestrator

Not sure which skill to use? The `/pm` command analyses your input and routes it automatically.

```
/pm Here's a message from my client — [paste anything]
```

The assistant will read the input, identify the right skill (or chain of skills), and ask for your approval before running each step. You stay in control.

Native skill commands are namespaced with a `pm-` prefix (for example `/pm-triage`) to avoid collisions with user-facing command aliases (for example `/triage`).

---

## Project Structure

```text
.claude/                             # Claude bundle
  CLAUDE.md
  commands/
  skills/
copilot/                            # GitHub Copilot bundle, open this folder as workspace root
  README.md
  .github/
    copilot-instructions.md
    prompts/
    skills/
kiro/                               # Amazon Kiro bundle, open this folder as workspace root
  README.md
  AGENTS.md
  .kiro/
    steering/
    skills/
clients/                            # Local only — excluded from version control
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

- `name`, `description`, `tools` in frontmatter
- One-paragraph purpose statement
- Clear "When to Use / Do Not Use" boundaries
- Numbered operating principles
- Numbered required workflow steps
- Exact output format template
- Style rules (tone, format guardrails)
- A worked `reference.md` example (input → output)

See any existing skill for the pattern.

---

## Requirements

- [Claude Code](https://claude.ai/code), or
- [GitHub Copilot Chat in VS Code](https://code.visualstudio.com/docs/copilot/overview), or
- [Amazon Kiro](https://kiro.dev/docs/)

---

## License

MIT — see [LICENSE](LICENSE).
