---
name: meeting-notes
description: Use this skill whenever the user wants to extract meeting notes, minutes, or a summary from a meeting transcript - especially from Microsoft Teams, Zoom, Google Meet, or any raw transcript text. Trigger when the user shares a transcript file or text and asks for a summary, key points, action items, decisions, or meeting minutes. Also trigger when the user says things like "summarize this meeting", "what was discussed", "extract the important parts", "write up the minutes", or pastes a block of conversation text that looks like a meeting transcript. This skill produces clean, plain-English meeting minutes and follow-up questions the user can ask to go deeper. Also trigger when the user wants to save or publish meeting minutes to Confluence.
version: 1.1.0
argument-hint: <meeting transcript or raw notes>
allowed-tools: Read, mcp__claude_ai_Atlassian_Rovo__createConfluencePage, mcp__claude_ai_Atlassian_Rovo__updateConfluencePage, mcp__claude_ai_Atlassian_Rovo__getConfluencePageDescendants, mcp__claude_ai_Atlassian_Rovo__getConfluenceSpaces, mcp__claude_ai_Google_Drive__create_file, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Gmail__create_draft
---

## Input

$ARGUMENTS

*If no input is provided above, ask: "Please paste the meeting transcript or raw notes. Teams, Zoom, and Google Meet transcripts all work."*

---

# Meeting Minutes Skill

Turn raw meeting transcripts into clean, useful meeting minutes. Remove filler, repetition, and side-chatter. Keep only what matters. Optionally save to Confluence.

---

## What to do

### Step 1 - Strip the noise

Strip filler, repetition, off-topic chatter, and crosstalk from the transcript before writing.

**Attribution rules** - auto-transcripts (Teams, Zoom, Meet) often mislabel speakers, especially after crosstalk:
- Never guess an identity for an unlabelled speaker. Keep the label as given (e.g. "Speaker 2").
- Where attribution is doubtful, mark it "(attribution unclear)" in the minutes.
- Note garbled or missing transcript sections rather than papering over them.
- Never assign a decision or action item to a person based on a guessed label. Record it as Unassigned or raise it under Open Questions instead.

### Step 2 - Write the meeting minutes

Output in this exact structure. Use plain English. Be concise. No bullet should be more than 2 lines.

---

**MEETING MINUTES**

**Title:** [short meeting title inferred from the transcript - ask once if unclear]
**Date:** [extract from transcript, or write "Not specified"]
**Attendees:** [list names mentioned or identified as speakers]
**Duration:** [if determinable from timestamps]

---

**Summary**
2-4 sentences. What was this meeting about and what was the overall outcome?

---

**Key Discussion Points**
List the main topics discussed. For each topic:
- **Topic name** - What was said. What was decided or concluded (if anything).

Keep to 3-8 points. Combine related sub-discussions under one topic. For long or agenda-driven meetings (steering, governance, quarterly reviews), group points under agenda headings and let the count grow to cover every distinct topic - never drop or merge unrelated ones to fit the cap. The 2-line limit per bullet still applies.

---

**Decisions Made**
Bullet list of firm decisions reached during the meeting. If none, write "No formal decisions recorded."

---

**Action Items**
| Who | What | By When |
|-----|------|---------|
| Name or "Unassigned" | Task description | Date or "TBD" |

If no owner was stated in the transcript, record the action with "Unassigned" - do not drop it and do not guess an owner. Add each unassigned action to Open Questions as something the PM must resolve. If no action items were clear at all, write "No action items identified."

---

**Open Questions**
Things raised but not resolved. Keep it short - 2-5 items max.

---

### Step 3 - Ask follow-up questions

After the minutes, add a short section:

---

**Want to dig deeper? Here are some things you could ask:**
- [Question based on an unresolved issue in the transcript]
- [Question about a decision that seemed unclear]
- [Question about a person's role or responsibility mentioned]
- [Question about next steps or timeline]

Generate 3-5 relevant questions. Make them specific to THIS meeting, not generic.

---

### Step 4 - Ask where to save

After presenting the minutes, ask the user where they want them saved:

> "Where would you like me to save this? I can save it locally or push it directly to any platform you have connected via MCP."
>
> **Local**
> 1. **Local file** - saved to `clients/CLIENT/meeting-notes/YYYY-MM-DD-meeting-title.md`
>
> **Connected platforms (via MCP)**
> 2. **Confluence** - published as a new page (I'll ask for your domain, space, and parent page)
> 3. **Google Drive** - saved as a new Doc (I'll ask for the folder)
> 4. **Notion** - created as a new page (I'll ask for your workspace and parent page)
> 5. **Gmail** - drafted as an email (I'll ask for the recipient)
>
> **No save**
> 6. **Clipboard only** - leave it here for you to copy manually

Do not save or publish anything until the user confirms the destination.

**Before saving, resolve two things:**
- Use the Title from the header as the filename slug (`YYYY-MM-DD-meeting-title.md`) and in platform page titles. If the title is still unclear, ask once.
- If Date is "Not specified", ask for the actual meeting date before saving. Do not let today's date stand in for a meeting that happened on another day.

**Audience check (external destinations only).** If the chosen destination is external-facing - a Gmail draft to someone outside the delivery team, or a client-visible Confluence space or Notion workspace - ask once whether the minutes are internal or client-facing. If client-facing, flag any candid remarks, commercial detail, or criticism of named people, and offer a redacted circulation copy. The full minutes stay as the internal record. Internal saves get no extra question.

---

### Step 5 - Save to the confirmed destination

**If a chosen platform is not connected** (its MCP tool is unavailable): say so plainly, then offer to save as a local file or render the minutes as clean markdown to copy. Never claim a page was published when no MCP tool actually ran. See *Connection Failsafe* in `.claude/CLAUDE.md`.

**If Confluence is chosen:**

1. Ask for: Confluence cloud domain, space key, and parent page title or ID
2. Check for an existing page with the same title AND date by calling `getConfluencePageDescendants` using the parent page ID the user provides. If a matching page exists, ask whether to update it or create a new one. A page with the same date but a different title is a different meeting - never offer to overwrite it.
3. **Create new page** using `createConfluencePage`:
   - `cloudId`: as provided by the user
   - `spaceId`: resolved from the space key via `getConfluenceSpaces`
   - `parentId`: as provided by the user
   - `title`: `Meeting Minutes - [Title] - [DD MMM YYYY]`
   - `contentFormat`: `markdown`
   - `body`: the full meeting minutes from Step 2
4. **Update existing page** using `updateConfluencePage`:
   - `cloudId`: as provided by the user
   - `pageId`: the existing page ID
   - `contentFormat`: `markdown`
   - `body`: the updated meeting minutes
   - `versionMessage`: `Updated by AI from transcript`
5. Return the live page URL to the user after saving.

---

### Step 6 - Offer a decision log

If Decisions Made contains a scope, timeline, budget, or commitment change, offer to record it with `/decision-log` so the decision has an audit trail.

