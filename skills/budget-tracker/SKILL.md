---
name: budget-tracker
description: Tracks project spend against the charter budget over time and flags burn-rate risk. Use whenever someone says "track the budget", "how much have we spent", "are we on budget", "burn rate", or shares cost/effort data that needs comparing to an approved budget. Produces a budget status with spent-to-date, forecast at completion, variance, and a RAG verdict. Not a charter - the charter sets the budget; this monitors it.
version: 1.0.0
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
| Approved budget | Yes | From the charter - the baseline |
| Spend to date | Yes | Actuals, not estimates |
| Progress | Yes | % of time elapsed and/or % scope complete |
| Day rates / team cost | No | Enables forecast |
| Committed-but-unbilled | No | POs, contractor time not yet invoiced |

If budget or spend is missing, ask - a tracker without a baseline is meaningless.

---

## Output Template

### Budget Status - [Project]
**Date:** [Today] | **Reporting period:** [e.g. Sprint 1-4 / Month 2]

> **Verdict: 🟢 On budget / 🟡 Watch / 🔴 Over / at risk**
> [One sentence: spent vs planned and the forecast at completion.]

#### Summary
| Metric | Value |
|---|---|
| Approved budget | [Amount] |
| Spent to date | [Amount] ([X]%) |
| Committed (unbilled) | [Amount] |
| Remaining | [Amount] |
| Work complete | [X]% (by scope) / [Y]% (time elapsed) |
| Forecast at completion | [Amount] |
| Variance vs budget | [+/- Amount] ([+/-]%) |

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
| [e.g. re-baseline, cut scope, request change order] | [Role] | [Date] |

---

## After Generating

Follow the **Saving Artefacts** rules in `.claude/claude.md`. Default local path: `clients/CLIENT/project-artefacts/YYYY-MM-DD-budget-status.md`. If the forecast implies a budget change, suggest a `/decision-log` entry and a `/stakeholder-update`.
