---
name: visualisation
description: Creates executive-friendly visualisations and dashboards from structured PM artefacts. Use when someone asks to visualise, create charts, generate a dashboard, show a heatmap, create an executive summary view, display trends, or present information visually. Supports risk scans, roadmaps, sprint plans, budget trackers, release readiness assessments, stakeholder updates, and other structured PM outputs. Focus on highlighting insights rather than repeating the underlying report.
version: 1.0.0
argument-hint: <artefact to visualise>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no artefact is provided above, ask: "Please provide the PM artefact or report you'd like visualised."*

---

# Before Starting - What to Identify

Determine:

| Input | Required? | Why |
|---------|---------|---------|
| Artefact Type | Yes | Determines which visualisations are relevant |
| Structured Data Available | Yes | Visualisations must be based on available data |
| Audience | No | Executive, sponsor, PM, delivery team |
| Visualisation Goal | No | Dashboard, heatmap, trend analysis, executive summary |

If the artefact type cannot be determined, infer it from the content.

---

# Supported Artefacts

| Artefact | Visualisations |
|-----------|-----------|
| Risk Scan | Heatmap, Timeline, Category Distribution, Ownership Distribution, Summary Cards |
| Roadmap | Initiative Timeline, Theme Distribution |
| Sprint Planning | Capacity Utilisation, Story Point Allocation |
| Budget Tracker | Budget Burn, Forecast Variance |
| Release Readiness | Readiness Dashboard |
| Stakeholder Update | Executive KPI Summary |

Only generate visualisations supported by the available data.

---

# Visualisation Principles

Visualisations should answer one or more of the following:

1. How severe is the issue?
2. How urgent is the issue?
3. Where is the issue concentrated?
4. Who owns the issue?
5. Is the situation improving or deteriorating?

Avoid creating charts that add little decision-making value.

Prefer 3-5 meaningful visualisations over many low-value charts.

Do not repeat information already obvious from the report.

---

# Risk Scan Visualisations

Generate where data exists.

## Executive Summary Cards

Show:

- Total Risks
- Red Risks
- Yellow Risks
- Green Risks
- Highest Risk Category

Purpose:
Provide a rapid executive overview.

---

## Risk Heatmap

Axes:

X = Likelihood

Y = Impact

Purpose:
Highlight the most severe risks.

Use values from the Risk Register.

---

## Risk Timeline

Group risks by proximity:

- Week 1-2
- Month 1
- Month 2-3
- Later

Purpose:
Highlight urgency and sequencing.

---

## Risk Category Distribution

Display risk counts by category.

Examples:

- Product
- Customer
- Technical
- Compliance
- Stakeholder
- Dependency
- Operational

Purpose:
Identify concentration of risk.

---

## Risk Ownership Distribution

Display risk counts by owner.

Purpose:
Highlight accountability concentration and overloaded owners.

---

# Roadmap Visualisations

## Initiative Timeline

Display initiatives across months or quarters.

Purpose:
Show sequencing and delivery horizon.

---

## Strategic Theme Distribution

Display initiative count by strategic objective.

Purpose:
Show investment allocation.

---

# Sprint Planning Visualisations

## Story Point Allocation

Display story points by team, stream, or epic.

Purpose:
Highlight workload balance.

---

## Capacity Utilisation

Display planned versus available capacity.

Purpose:
Identify overcommitment risk.

---

# Budget Tracker Visualisations

## Budget Burn

Display:

- Approved Budget
- Consumed Budget
- Remaining Budget

Purpose:
Show financial health.

---

## Forecast Variance

Display planned versus forecast spend.

Purpose:
Highlight budget risk.

---

# Release Readiness Visualisations

## Readiness Dashboard

Display:

- Scope Ready
- QA Ready
- UAT Ready
- Deployment Ready
- Support Ready

Purpose:
Support go/no-go decisions.

---

# Visualisation Selection Rules

Risk Scan:
- Summary Cards
- Heatmap
- Timeline
- Category Distribution

Roadmap:
- Initiative Timeline
- Theme Distribution

Sprint Planning:
- Capacity Utilisation
- Story Point Allocation

Budget Tracker:
- Budget Burn
- Forecast Variance

Release Readiness:
- Readiness Dashboard

Only generate visualisations relevant to the artefact.

---

# Quality Checks

Before finalising:

- Every visualisation must support a decision.
- Avoid duplicating the same insight across multiple charts.
- Do not generate charts without supporting data.
- Prefer executive readability over analytical complexity.
- Limit output to the most valuable visualisations.
- Clearly explain the key takeaway from each visualisation.

---

# Output Format

## VISUALISATION SUMMARY

**Artefact:** [Type]

**Audience:** [Executive / PM / Delivery / Sponsor]

**Visualisations Generated:** [Count]

---

### Executive Insights

- [Most important takeaway]
- [Second takeaway]
- [Third takeaway]

---

### Recommended Visualisations

#### [Visualisation Name]

**Purpose:** [Why it matters]

**What it shows:** [Key data represented]

**Key takeaway:** [Insight]

---

#### [Visualisation Name]

**Purpose:** [Why it matters]

**What it shows:** [Key data represented]

**Key takeaway:** [Insight]

---

### Dashboard Recommendation

Recommend the minimum set of visualisations that should appear on a single screen dashboard.