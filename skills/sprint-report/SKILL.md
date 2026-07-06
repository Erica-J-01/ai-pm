---
name: sprint-report
description: Analyses Jira sprint data and produces a concise PM-ready report. Use whenever someone shares a sprint report, burndown chart, velocity chart, board screenshot, or Jira ticket data and wants to understand sprint health, delivery confidence, risks, blockers, or team performance. Trigger for phrases like "analyse this sprint", "what does the burndown say", "how is the sprint looking", "write up the sprint report", or "what should I tell the team today".
version: 1.0.0
argument-hint: <sprint data, burndown, or Jira board link>
allowed-tools: Read, mcp__claude_ai_Atlassian_Rovo__searchJiraIssuesUsingJql, mcp__claude_ai_Atlassian_Rovo__getJiraIssue, mcp__claude_ai_Atlassian_Rovo__createConfluencePage, mcp__claude_ai_Atlassian_Rovo__getConfluenceSpaces
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please paste your Jira sprint data - burndown, velocity, ticket statuses, or a screenshot description. Which day of the sprint are we on?"*

**If Jira is not connected** (MCP tool unavailable): do not fabricate ticket data. Tell the user Jira isn't connected and ask them to paste the board state (ticket statuses, assignees, blockers). The report format is identical - only the data source changes. See *Connection Failsafe* in `.claude/CLAUDE.md`.

---

Assess: burndown trend, completed vs committed, blocked/aging tickets, scope changes, QA bottlenecks, overloaded owners, and velocity trend.

---

# MANDATORY OUTPUT FORMAT

# Executive Summary

3 short sentences maximum.

# Delivery Status

- Status: Green / Amber / Red
- Sprint Confidence: XX%
- Forecast: X of Y items likely complete
- Risk: Low / Medium / High

# Top 3 PM Priorities

1.
2.
3.

# Main Risks

1.
2.
3.

# Actions Today

1.
2.
3.

# Questions for Standup

1.
2.
3.

# Leadership Update

2 short professional sentences.

---

# FINAL ACTION (MANDATORY)

After generating the report, ask the user where they want it saved:

> "Where would you like me to save this? I can save it locally or push it directly to any platform you have connected via MCP."
>
> **Local**
> 1. **Local file** - saved to `clients/CLIENT/sprint-artefacts/YYYY-MM-DD-sprint-N-report.md`
>
> **Connected platforms (via MCP)**
> 2. **Confluence** - published as a new page (I'll ask for your domain, space, and parent page)
> 3. **Google Drive** - saved as a new Doc (I'll ask for the folder)
> 4. **Notion** - created as a new page (I'll ask for your workspace and parent page)
>
> **No save**
> 5. **Clipboard only** - leave it here for you to copy manually

Do not save or publish anything until the user confirms the destination.

**If Confluence is chosen:**
1. Ask for the Confluence cloud domain, space key, and parent page title or ID
2. Resolve the space ID using `getConfluenceSpaces` if needed
3. Use `createConfluencePage` with:
   - `cloudId`: as provided by the user
   - `spaceId`: resolved from the space key
   - `parentId`: as provided by the user
   - `title`: `{Project} Sprint Report - {Sprint Name}, Day {N} ({YYYY-MM-DD})`
   - `contentFormat`: `markdown`
   - `body`: the full report markdown
4. Return the live Confluence page URL to the user

