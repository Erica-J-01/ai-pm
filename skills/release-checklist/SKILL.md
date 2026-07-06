---
name: release-checklist
description: Runs a structured go/no-go assessment before a SaaS release. Evaluates release readiness across feature completeness, testing, operational readiness, communications, dependencies, and approvals. Produces a categorised checklist with a clear GO / NO-GO / CONDITIONAL GO verdict and a list of blockers the PM must resolve before shipping. Use before any production release - planned sprint delivery, hotfix, or phased rollout.
version: 1.0.0
argument-hint: <release details or Jira sprint link>
allowed-tools: Read, mcp__claude_ai_Atlassian_Rovo__createConfluencePage, mcp__claude_ai_Atlassian_Rovo__searchJiraIssuesUsingJql, mcp__claude_ai_Atlassian_Rovo__getJiraIssue, mcp__claude_ai_Google_Drive__create_file, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Gmail__create_draft
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please share the release details - you can paste a Jira sprint link and I'll pull the ticket data directly, or share the release name, type, target date, features or tickets included, and your team (PM, tech lead, QA lead, DevOps lead)."*

---

# Purpose
Assess whether a release is ready to ship. The goal is not to produce a perfect document - it is to surface blockers, risks, and unresolved questions before they become production incidents. Every item in the checklist is a decision point, not a formality.

---

# When to Use
Use when you are:
- Preparing for a planned sprint release
- Signing off a hotfix or emergency patch
- Coordinating a phased or feature-flagged rollout
- Running a release readiness meeting with engineering and QA
- Asked by a stakeholder "are we ready to ship?"

# Do Not Use
Do not use to:
- Write user stories or acceptance criteria - route to `user-stories`
- Plan the sprint that precedes the release - route to `sprint-sow`
- Analyse risks at project level - route to `risk-scan`
- Document what shipped after the fact - route to `sprint-report`

---

# Operating Principles
1. Every NO or RISK item is a potential blocker - treat it as one until confirmed otherwise.
2. A CONDITIONAL GO is still a commitment. Every condition must have an owner and a deadline before the verdict stands.
3. Do not paper over gaps. If an item cannot be confirmed, mark it UNCONFIRMED and surface it - do not assume it is fine.
4. Focus on production impact. A failed unit test matters less than a missing rollback plan. Prioritise items by what would cause a customer-visible incident.
5. The checklist belongs to the PM. Every item should be answerable without involving engineering - if you can't answer it, you're not ready for the go/no-go meeting.
6. One clear verdict. The output ends with GO, NO-GO, or CONDITIONAL GO. Not "mostly ready" or "some concerns." Choose one.

---

# Required Workflow

## 1. Gather Inputs

Inputs can be provided in two ways - accept either, or a combination of both.

### Option A - Jira link or sprint reference (preferred)
If the user provides any of the following, fetch ticket data from Jira before proceeding:
- A Jira sprint URL (e.g. `https://yourorg.atlassian.net/jira/software/projects/PROJ/boards/12?sprint=45`)
- A Jira board URL with a named sprint
- A sprint name and project key (e.g. "Sprint 11, project NOTIF")
- A list of Jira ticket IDs (e.g. NOTIF-101, NOTIF-102)

**Jira fetch steps:**
1. Extract the project key and sprint name or ID from the URL or input.
2. Use `searchJiraIssuesUsingJql` with the query: `project = "PROJECT_KEY" AND sprint = "SPRINT_NAME" ORDER BY status ASC` to retrieve all tickets in the sprint. **Validate the project key (`[A-Za-z0-9_]+`) and reject a sprint name containing `"` or newlines before building the query, so input can't break out of the JQL** (see *Input Validation & Sanitisation* in `.claude/CLAUDE.md`).
3. For each ticket returned, note: key, summary, status, assignee, and issue type.
4. Use `getJiraIssue` for any ticket where more detail is needed (e.g. labels, linked issues, fix version).
5. Summarise what was fetched before proceeding - list tickets found, their statuses, and any that are not Done or In Review.
6. If the Jira query returns no results, tell the user and ask them to confirm the project key and sprint name.
7. **If the Jira MCP tool is unavailable** (not connected), do not fetch or fabricate ticket data. Tell the user Jira isn't connected and switch to Option B - ask them to paste the ticket list and statuses. See *Connection Failsafe* in `.claude/CLAUDE.md`.

Tickets with status **Done** → count as completed.
Tickets with status **In Progress**, **In Review**, **In QA**, or **Blocked** → flag as incomplete in F1 and F2.
Tickets with status **To Do** → flag as not started - likely a scoping issue.

### Option B - Manual input
If no Jira link is provided, confirm you have at least 4 of:
- **Release name or version** (e.g., Sprint 14 Release, v2.4.1, Payments Phase 1)
- **Release type** (Planned sprint / Hotfix / Phased rollout / Feature flag rollout)
- **Target release date and time** (and timezone)
- **Features or changes included** (ticket list, PRD reference, or feature names)
- **Target environment** (Production / Staging → Prod / Regional rollout)
- **Team** (PM, tech lead, QA lead, infra/DevOps lead)

If fewer than 4 are provided, ask before proceeding:
> "Before I run the go/no-go assessment, I need a few details: release name, release type, target date, features included, and who's on the release team. Which of these can you share? You can also just paste a Jira sprint link and I'll pull the ticket data directly."

### Combining both
If the user provides a Jira link plus additional context (team names, known issues, target date), use the Jira data for Feature Readiness and supplement with the manual context for the remaining categories.

## 2. Categorise the Release
Based on the release type, adjust checklist depth:
- **Planned sprint release** - full checklist, all 7 categories
- **Hotfix / emergency patch** - abbreviated: skip Communications if internal-only; focus on Testing, Rollback, and Approvals
- **Phased / feature flag rollout** - add flag configuration and rollout percentage to Feature Readiness; add monitoring ramp criteria to Operational Readiness

State the release type and any checklist adjustments before proceeding.

## 3. Work Through Each Category
Run through all applicable categories in order. For each item, assign a status:

| Status | Meaning |
|---|---|
| **PASS** | Confirmed complete - you have evidence |
| **FAIL** | Not complete - this is a blocker |
| **RISK** | Completed but with a known concern that needs flagging |
| **N/A** | Not applicable to this release type |
| **UNCONFIRMED** | Cannot be verified from the information provided |

Do not mark PASS unless you have confirmation. When in doubt, mark UNCONFIRMED.

## 4. Score and Verdict
After completing the checklist:
- Count FAIL and UNCONFIRMED items
- Any FAIL = automatic NO-GO unless the PM explicitly accepts the risk in writing
- UNCONFIRMED items must be resolved before a GO verdict can stand
- RISK items do not block GO but must appear in the conditions list

Apply the verdict:
- **GO** - zero FAILs, zero UNCONFIRMEDs, all RISKs acknowledged
- **NO-GO** - one or more FAILs, or critical UNCONFIRMEDs that cannot be resolved before release
- **CONDITIONAL GO** - zero FAILs, but one or more UNCONFIRMEDs or RISKs with a clear resolution plan, owner, and deadline

## 5. Ask Where to Save
After delivering the checklist and verdict, ask:
> "Where would you like me to save this? I can save it locally or push it to a connected platform."
>
> 1. **Local file** - `clients/CLIENT/sprint-artefacts/YYYY-MM-DD-release-checklist-vX.md`
> 2. **Confluence** - published as a new page (I'll ask for your domain, space, and parent page)
> 3. **Google Drive** - saved as a new Doc (I'll ask for the folder)
> 4. **Notion** - created as a new page (I'll ask for your workspace and parent page)
> 5. **Gmail** - drafted as an email to the release team (I'll ask for recipients)
> 6. **Clipboard only** - leave it here for you to copy manually

---

# Checklist Categories

## Category 1 - Feature Readiness
- All stories included in this release are marked Done in Jira
- No in-progress or blocked tickets are in scope for this release
- Code is merged to the release branch and build is passing
- Feature flags are configured correctly for the target environment
- If phased rollout: flag rollout percentage and audience are confirmed
- Database migrations have been reviewed and are reversible (or migration risk is accepted)
- Any breaking API changes are versioned and backwards-compatible (or deprecation communicated)

## Category 2 - Testing
- Unit and integration tests are passing in CI
- QA sign-off confirmed by QA lead (include name)
- Regression test suite has been run against the release candidate
- Edge cases and error states from acceptance criteria have been verified
- Performance / load testing completed if the release touches high-traffic paths
- Security review completed if the release touches authentication, payments, or data handling
- Staging environment validation completed - release candidate behaves as expected

## Category 3 - Operational Readiness
- Monitoring and alerting are in place for new functionality (dashboards updated if needed)
- Error rates and latency baselines are documented so anomalies are detectable post-release
- Runbook exists for the release (who does what if something goes wrong)
- Rollback plan is confirmed: rollback steps are documented and the rollback has been tested or reviewed
- Database rollback is possible, or data migration risk is explicitly accepted by the PM
- On-call schedule is confirmed for the release window and the 24 hours following
- Infrastructure has been scaled or provisioned if the release increases load

## Category 4 - Communications
- Internal release notes are written and shared with the team
- Support team has been briefed on new features, changes, and known edge cases
- If customer-facing change: customer comms drafted and ready to send (email, in-app, changelog)
- If breaking change or deprecation: affected customers have been notified with adequate lead time
- Stakeholders and sponsors have been notified of the release date and scope
- Marketing / growth team is aligned if the release has acquisition or activation implications

## Category 5 - Dependencies
- All third-party APIs and services this release depends on have been verified as operational
- External vendor changes or upgrades (if any) are confirmed and tested
- Cross-team dependencies (e.g., platform, infra, data) have signed off on their part of the release
- Any environment variables, secrets, or configuration changes are deployed to production
- DNS, CDN, or infrastructure changes (if any) are pre-staged and tested

## Category 6 - Approvals
- PM sign-off confirmed (you)
- Tech lead / engineering lead sign-off confirmed (include name)
- QA lead sign-off confirmed (include name)
- Product owner or sponsor sign-off if required for this release type
- Legal / compliance sign-off if the release touches data privacy, payments, or regulated features
- Security sign-off if the release introduces new authentication, authorisation, or data access patterns

## Category 7 - Post-Release Readiness
- Success metrics are defined - you know what "this release went well" looks like in the data
- Monitoring check is scheduled for 30 minutes, 2 hours, and 24 hours post-release
- A release retrospective or review is scheduled if this is a major release
- Known issues or deferred items are documented and ticketed (not forgotten)

---

# Output Format

## Release Go / No-Go Checklist

**Release:** [Name or version]
**Release type:** [Planned sprint / Hotfix / Phased rollout / Feature flag rollout]
**Target date:** [Date and time, timezone]
**Features included:** [List or ticket references]
**Assessed by:** [PM name]
**Date of assessment:** [Today]

---

### Checklist

#### 1. Feature Readiness

| # | Item | Status | Notes |
|---|---|---|---|
| F1 | All in-scope stories marked Done in Jira | PASS / FAIL / RISK / N/A / UNCONFIRMED | |
| F2 | No in-progress or blocked tickets in scope | | |
| F3 | Code merged to release branch, build passing | | |
| F4 | Feature flags configured correctly | | |
| F5 | Database migrations reviewed and reversible | | |
| F6 | API breaking changes versioned or communicated | | |

#### 2. Testing

| # | Item | Status | Notes |
|---|---|---|---|
| T1 | Unit and integration tests passing in CI | | |
| T2 | QA sign-off confirmed - [Name] | | |
| T3 | Regression suite run against release candidate | | |
| T4 | Edge cases and error states verified | | |
| T5 | Performance testing completed (if applicable) | | |
| T6 | Security review completed (if applicable) | | |
| T7 | Staging validation completed | | |

#### 3. Operational Readiness

| # | Item | Status | Notes |
|---|---|---|---|
| O1 | Monitoring and alerting in place for new functionality | | |
| O2 | Error rate and latency baselines documented | | |
| O3 | Runbook exists for this release | | |
| O4 | Rollback plan documented and reviewed | | |
| O5 | Database rollback confirmed (or risk accepted) | | |
| O6 | On-call confirmed for release window + 24 hours | | |
| O7 | Infrastructure scaled if load increases | | |

#### 4. Communications

| # | Item | Status | Notes |
|---|---|---|---|
| C1 | Internal release notes written and shared | | |
| C2 | Support team briefed | | |
| C3 | Customer comms drafted (if customer-facing) | | |
| C4 | Affected customers notified (if breaking change) | | |
| C5 | Stakeholders and sponsors notified | | |
| C6 | Marketing / growth aligned (if applicable) | | |

#### 5. Dependencies

| # | Item | Status | Notes |
|---|---|---|---|
| D1 | Third-party APIs verified as operational | | |
| D2 | External vendor changes confirmed and tested | | |
| D3 | Cross-team dependencies signed off | | |
| D4 | Environment variables and config deployed to prod | | |
| D5 | Infrastructure changes pre-staged (if applicable) | | |

#### 6. Approvals

| # | Item | Status | Notes |
|---|---|---|---|
| A1 | PM sign-off | | |
| A2 | Tech lead / engineering lead sign-off - [Name] | | |
| A3 | QA lead sign-off - [Name] | | |
| A4 | Product owner / sponsor sign-off (if required) | | |
| A5 | Legal / compliance sign-off (if applicable) | | |
| A6 | Security sign-off (if applicable) | | |

#### 7. Post-Release Readiness

| # | Item | Status | Notes |
|---|---|---|---|
| P1 | Success metrics defined | | |
| P2 | Monitoring check scheduled (30 min, 2 hr, 24 hr) | | |
| P3 | Post-release review scheduled (if major release) | | |
| P4 | Known issues / deferred items ticketed | | |

---

### Summary

| Category | PASS | FAIL | RISK | UNCONFIRMED | N/A |
|---|---|---|---|---|---|
| Feature Readiness | | | | | |
| Testing | | | | | |
| Operational Readiness | | | | | |
| Communications | | | | | |
| Dependencies | | | | | |
| Approvals | | | | | |
| Post-Release Readiness | | | | | |
| **Total** | | | | | |

---

### Blockers
> Items that must be resolved before this release can proceed.

- [FAIL / UNCONFIRMED item - owner - resolution deadline]

*If no blockers: "No blockers identified."*

---

### Conditions (CONDITIONAL GO only)
> Items that are in progress or carry known risk. Each must have an owner and a deadline.

- [RISK / UNCONFIRMED item - owner - resolution deadline]

*Remove this section for GO or NO-GO verdicts.*

---

### Verdict

> **[GO / NO-GO / CONDITIONAL GO]**

[One or two sentences: why this verdict, and the single most important action before or immediately after release.]

---

# Quality Checks
Before delivering the output, verify:
- Every PASS item has a confirmable basis - not assumed
- Every FAIL item appears in the Blockers list with an owner
- Every UNCONFIRMED item is surfaced, not silently skipped
- The Summary table totals are correct
- The Verdict is one of the three options - no hedging
- CONDITIONAL GO verdicts have a Conditions section with owners and deadlines
- The output is usable as a release sign-off record - not just a checklist

---

# Style Rules
- Be direct. PASS, FAIL, RISK, N/A, UNCONFIRMED - not "looks good", "needs checking", "TBC".
- Surface blockers at the top of the output, not buried in the table.
- The verdict is non-negotiable - choose one. If the PM wants to override a FAIL, they state so in writing.
- Treat the checklist as a handover document. Someone not in the room should be able to read it and understand the release state.
- No padding. The checklist speaks for itself.
