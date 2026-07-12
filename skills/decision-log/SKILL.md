---
name: decision-log
description: Creates a structured decision log from project changes, scope revisions, or PM decisions. Use whenever a decision needs to be formally recorded - including when someone says "log this decision", "document this change", "we changed direction on X", or when the PM Orchestrator detects a decision in a prior skill output and asks whether to log it. Also triggers when a user shares a change request, revised scope, or any deviation from the original plan that needs an audit trail.
version: 1.1.0
argument-hint: <decision context, change description, or prior skill output>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Describe the decision or change - what was originally planned, what changed, and why? Include who proposed the change if known."*

---

# Before Generating - Find the Register

The decision log is one living register per project, not a new file per decision. Before generating:

1. Check the active `clients/CLIENT/PROJECT/project-artefacts/` folder for an existing decision log.
2. If one exists, read it, continue the Decision ID sequence from its last entry, and prepare the new entries as an append. Bump the register's internal `Version:` field on each append. The file keeps its original name - per-entry dates carry the audit trail, not the filename.
3. If none exists, start a fresh register at `D-001`.

If a new decision reverses an earlier one, mark the new entry `Supersedes: D-00X` and change the superseded entry's status to Superseded. Never delete or rewrite the old entry - the trail is the point.

---

# What to Extract

From the input, identify each decision or plan change that was actually made. For each one, extract:

- **Decision ID** - Next in the register's sequence: D-001, D-002, and so on
- **Date Decided** - When the decision was made, not the date the log was prepared. Use `[TBC]` if the input doesn't say
- **Area** - Domain of the decision: Scope / Timeline / Budget / Architecture / Team / Process / Other
- **Original Plan** - What was agreed or assumed before this change
- **Revised Plan** - What has been decided instead
- **Reason** - Why the change was made (business driver, risk, constraint, stakeholder request). If the input explicitly names options that were rejected, note them here in one clause - never infer alternatives that weren't stated
- **Change Proposed By** - Role or name of who raised or drove the change
- **Delivery Impact** - Effect on timeline, sprint commitments, or milestones
- **Technical Impact** - Effect on architecture, integrations, or technical approach
- **Product Owner Impact** - Effect on roadmap, backlog, or accepted scope
- **Cost Impact** - Budget effect if known (increase / decrease / neutral / TBC)
- **Change Status** - One of: Proposed / Under Review / Approved / Rejected (Superseded is applied later, to an old entry a new decision reverses)
- **Change Approved By** - Role or name of approver, or `[TBC]` if not yet confirmed
- **Supersedes** - `D-00X` if this decision reverses an earlier entry. Omit otherwise
- **Follow-ups** - One line, only when something genuinely arises: whether the change is covered by the current SOW or needs a formal CR, which existing artefacts (charter, sprint plan, PRD) are now stale, and whether the client or sponsor still needs telling (point to `/stakeholder-update` if comms are owed). Omit the line entirely when nothing arises - no `[TBC]` noise here

If any other field cannot be determined from the input, write `[TBC]`.

**Decided vs discussed.** When the input is a transcript or thread, log only items with evidence a decision was actually made - an explicit agreement, sign-off, or clear commitment. Put clearly floated ideas ("we should probably...") in a short **Discussed, not decided** note and ask once which, if any, to log. Never default an ambiguous item to Approved.

---

# Output Format

## Decision Log

**Project:** [Extract from input, or write "Not specified"]
**Version:** [Register version - bump on each append]
**Last updated:** [Today's date]
**Prepared by:** [PM or role if known]

### Index

| ID | Date | Area | Decision | Status | Approved By |
|---|---|---|---|---|---|
| D-001 | [Date decided] | [Area] | [One-line summary of the revised plan] | Proposed / Under Review / Approved / Rejected / Superseded | [Who approved] |

*One index row per decision. New entries append below existing rows.*

### D-001 - [Short decision title]

- **Original Plan:** [What was planned]
- **Revised Plan:** [What changed to]
- **Reason:** [Why, including any explicitly rejected options]
- **Proposed By:** [Who]
- **Delivery Impact:** [Timeline/milestone effect]
- **Technical Impact:** [Tech effect]
- **Product Owner Impact:** [PO/roadmap effect]
- **Cost Impact:** [Budget effect]
- **Supersedes:** [D-00X - only if this reverses an earlier entry]
- **Follow-ups:** [SOW vs CR, stale artefacts, comms owed - only if something arises]

*One detail block per decision. On an append, earlier entries stay untouched except for a status change to Superseded where a new decision reverses them.*

If the input contained floated ideas that were not decided, add a short **Discussed, not decided** note after the entries.

If any entry ends Proposed, Under Review, or with Approved By `[TBC]`, close with one line naming who needs to sign it off and offer to draft the approval ask.

---

# After Generating

Ask the user where they want it saved:

> "Where would you like me to save this? I can save it locally or push it directly to any platform you have connected via MCP."
>
> **Local**
> 1. **Local file** - appended to the project's existing decision log in `clients/CLIENT/project-artefacts/`, or saved as a new `YYYY-MM-DD-decision-log.md` if this is the project's first entry
>
> **Connected platforms (via MCP)**
> 2. **Confluence** - published as a new page or appended to the existing register page (I'll ask for your domain, space, and parent page)
> 3. **Google Drive** - saved as a new Doc (I'll ask for the folder)
> 4. **Notion** - created as a new page (I'll ask for your workspace and parent page)
> 5. **Jira** - added as a comment or description on a relevant issue (I'll ask for the issue key)
>
> **No save**
> 6. **Clipboard only** - leave it here for you to copy manually

Do not save or publish anything until the user confirms the destination. This applies to appends to an existing register as well as new files.
