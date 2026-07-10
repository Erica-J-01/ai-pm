---
name: budget-tracker
description: Tracks project spend against the charter budget over time and flags burn-rate risk. Use whenever someone says "track the budget", "how much have we spent", "are we on budget", "burn rate", or shares cost/effort data that needs comparing to an approved budget. Produces a budget status with spent-to-date, forecast at completion, variance, and a RAG verdict. Not a charter - the charter sets the budget and this skill monitors it.
version: 1.1.0
argument-hint: <approved budget + spend to date + progress>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "What's the approved budget, how much is spent so far, and how far through the work are we (by time or scope)? Day rates or effort data help if you have them."*

---

# Budget Tracker

Compare spend to plan and forecast the endpoint honestly. The job is to flag overrun early - while there's still time to act - not to report it after the fact.

## What to Gather First

| Input | Required? | Notes |
|---|---|---|
| Approved budget | Yes | From the charter, plus any approved change orders - together the current baseline |
| Spend to date | Yes | Actuals, not estimates |
| Progress | Yes | % of time elapsed and/or % scope complete |
| Planned start and end dates | Yes | Needed for time elapsed and the exhaustion-date check |
| Day rates / team cost | No | Enables forecast |
| Committed-but-unbilled | No | POs, contractor time not yet invoiced |
| Known one-off costs ahead | No | Licence renewals, vendor milestone payments |
| Commercial model | No | Fixed price, T&M, or retainer - read from the project's `context.md`, ask once if unknown |

If budget or spend is missing, ask - a tracker without a baseline is meaningless.

**Messy actuals:**
- If spend arrives as hours (timesheet or Harvest-style exports), compute cost as hours x the stated day rates and state the rate assumption in the output. Never apply a silent blended rate.
- Finance extracts often trail invoicing by two to six weeks. Flag the lag as an explicit caveat on spent to date rather than presenting an understated number as current.
- If timesheets and finance disagree, surface the gap. Do not smooth it.

---

## How to Forecast

Compute the forecast at completion - never guess it.

- **Run-rate forecast** = spend to date + committed + known one-off costs still ahead + average burn per period x remaining periods.
- **Scope-based forecast** = spend to date / % scope complete.

Show both only when they materially diverge. Name which one drives the verdict and why, and state the assumptions in one line. List the known one-offs explicitly so a quiet future invoice cannot hide inside a healthy run rate.

## Verdict Rules

Measure variance and the RAG against the **current baseline** (original budget plus approved changes). Defaults, unless the project's `context.md` sets a client-specific tolerance:

- **Green** - forecast at completion within 5% of baseline
- **Amber** - 5-10% over, or the burn trend is worsening
- **Red** - more than 10% over, or the exhaustion date lands before the planned end

State which rule fired so the verdict is reproducible.

Tailor the verdict wording and default actions to the commercial model - the numbers are identical across models:

- **Fixed price** - overrun is margin erosion, not a client cost. Escalate internally with the account lead and open a scope conversation. A change order applies only if scope actually changed.
- **T&M** - overrun is the client's cost. Have the sponsor conversation early and raise a change order.
- **Retainer** - frame it as utilisation versus scope.

If the model is unknown and the user doesn't answer, proceed with neutral wording - do not block.

## Trend vs Last Report

Before writing the output, read the most recent `YYYY-MM-DD-budget-status.md` in the active `clients/CLIENT/PROJECT/project-artefacts/` folder and add one movement line under the verdict: forecast moved [X] to [Y], verdict [amber] to [red], burn per [period] [up/down]. If no prior report exists, omit the line entirely - never invent history, and never read another client's folder.

---

## Output Template

### Budget Status - [Project]
**Date:** [Today] | **Reporting period:** [e.g. Sprint 1-4 / Month 2]

> **Verdict: Green - On budget / Amber - Watch / Red - Over / at risk**
> [One sentence: spent vs planned, the forecast at completion, and which verdict rule fired.]
> **Since last report:** [forecast X to Y, verdict change, burn per period up/down - omit if no prior report]

#### Summary
| Metric | Value |
|---|---|
| Original budget | [Amount] |
| Approved changes | [+Amount] ([decision-log ref]) |
| Current baseline | [Amount] |
| Spent to date | [Amount] ([X]%) [caveat any invoice lag] |
| Committed (unbilled) | [Amount] |
| Remaining | [Amount] |
| Work complete | [X]% (by scope) / [Y]% (time elapsed) |
| Forecast at completion | [Amount] ([run-rate or scope-based] - assumptions in one line) |
| Variance vs current baseline | [+/- Amount] ([+/-]%) |

*Collapse the first three rows into a single "Approved budget" row when no changes have been approved. Add a contingency-remaining row only where the charter defines contingency.*

#### Burn Rate
- Average spend per [sprint/week]: [Amount]
- At this rate, budget exhausts on: [Date] vs planned end [Date]

#### Variance Drivers
| Driver | Effect | Note |
|---|---|---|
| [e.g. scope add, overtime, vendor cost] | [+Amount] | [Why] |

#### Actions
| Action | Owner | By When |
|---|---|---|
| [Match the commercial model - e.g. cut scope, escalate margin risk internally (fixed price), raise a change order (T&M), re-baseline] | [Role] | [Date] |

---

## After Generating

Follow the **Saving Artefacts** rules in `.claude/claude.md`. Default local path: `clients/CLIENT/project-artefacts/YYYY-MM-DD-budget-status.md`. If the forecast implies a budget change, suggest a `/decision-log` entry and a `/stakeholder-update`.
