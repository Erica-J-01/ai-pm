---
name: pm-meeting-notes
description: >
  Use this skill whenever the user wants to extract meeting notes, minutes, or a summary from a meeting transcript — especially from Microsoft Teams, Zoom, Google Meet, or any raw transcript text. Trigger when the user shares a transcript file or text and asks for a summary, key points, action items, decisions, or meeting minutes. Also trigger when the user says things like "summarize this meeting", "what was discussed", "extract the important parts", "write up the minutes", or pastes a block of conversation text that looks like a meeting transcript. This skill produces clean, plain-English meeting minutes and follow-up questions the user can ask to go deeper. Also trigger when the user wants to save or publish meeting minutes to Confluence.
tools:
  - mcp__claude_ai_Atlassian_Rovo__createConfluencePage
  - mcp__claude_ai_Atlassian_Rovo__updateConfluencePage
  - mcp__claude_ai_Atlassian_Rovo__getConfluencePageDescendants
  - mcp__claude_ai_Atlassian_Rovo__getConfluenceSpaces
  - mcp__claude_ai_Google_Drive__create_file
  - mcp__claude_ai_Notion__notion-create-pages
  - mcp__claude_ai_Gmail__create_draft
---

# Meeting Minutes Skill

Turn raw meeting transcripts into clean, useful meeting minutes. Remove filler, repetition, and side-chatter. Keep only what matters. Optionally save to Confluence.

---

## What to do

### Step 1 — Read the transcript

The transcript may arrive as:
- A pasted block of text in the chat
- An uploaded `.txt`, `.vtt`, `.docx`, or `.pdf` file (read it using the file-reading skill if needed)
- A Teams auto-generated transcript (look for speaker labels like `John Smith   00:01:23`)

Strip out:
- Filler words ("um", "you know", "like", "so yeah")
- Repetition (same point made multiple times — keep the clearest version)
- Off-topic chatter (weather talk, lunch plans, "can everyone hear me?")
- Crosstalk and false starts

---

### Step 2 — Write the meeting minutes

Output in this exact structure. Use plain English. Be concise. No bullet should be more than 2 lines.

---

**MEETING MINUTES**

**Date:** [extract from transcript, or write "Not specified"]
**Attendees:** [list names mentioned or identified as speakers]
**Duration:** [if determinable from timestamps]

---

**Summary**
2–4 sentences. What was this meeting about and what was the overall outcome?

---

**Key Discussion Points**
List the main topics discussed. For each topic:
- **Topic name** — What was said. What was decided or concluded (if anything).

Keep to 3–8 points. Combine related sub-discussions under one topic.

---

**Decisions Made**
Bullet list of firm decisions reached during the meeting. If none, write "No formal decisions recorded."

---

**Action Items**
| Who | What | By When |
|-----|------|---------|
| Name | Task description | Date or "TBD" |

If no action items were clear, write "No action items identified."

---

**Open Questions**
Things raised but not resolved. Keep it short — 2–5 items max.

---

### Step 3 — Ask follow-up questions

After the minutes, add a short section:

---

**Want to dig deeper? Here are some things you could ask:**
- [Question based on an unresolved issue in the transcript]
- [Question about a decision that seemed unclear]
- [Question about a person's role or responsibility mentioned]
- [Question about next steps or timeline]

Generate 3–5 relevant questions. Make them specific to THIS meeting, not generic.

---

### Step 4 — Ask where to save

After presenting the minutes, ask the user where they want them saved:

> "Where would you like me to save this? I can save it locally or push it directly to any platform you have connected via MCP."
>
> **Local**
> 1. **Local file** — saved to `clients/CLIENT/meeting-notes/YYYY-MM-DD-meeting-title.md`
>
> **Connected platforms (via MCP)**
> 2. **Confluence** — published as a new page (I'll ask for your domain, space, and parent page)
> 3. **Google Drive** — saved as a new Doc (I'll ask for the folder)
> 4. **Notion** — created as a new page (I'll ask for your workspace and parent page)
> 5. **Gmail** — drafted as an email (I'll ask for the recipient)
>
> **No save**
> 6. **Clipboard only** — leave it here for you to copy manually

Do not save or publish anything until the user confirms the destination.

---

### Step 5 — Save to the confirmed destination

**If Confluence is chosen:**

1. Ask for: Confluence cloud domain, space key, and parent page title or ID
2. Check for an existing page with the same date by calling `getConfluencePageDescendants` using the parent page ID the user provides. If a matching page exists, ask whether to update it or create a new one.
3. **Create new page** using `createConfluencePage`:
   - `cloudId`: as provided by the user
   - `spaceId`: resolved from the space key via `getConfluenceSpaces`
   - `parentId`: as provided by the user
   - `title`: `Meeting Minutes – [DD MMM YYYY]`
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

## Tone and style rules

- Write like a smart colleague summarizing a meeting for someone who wasn't there
- Use simple, direct English — no corporate jargon unless it was used in the meeting and matters
- Past tense for what happened ("The team decided...", "Sarah raised a concern about...")
- Avoid vague phrases like "various topics were discussed" — be specific
- If something was unclear in the transcript, write "[unclear]" rather than guessing

---

## Edge cases

**Transcript has no speaker labels** — Still extract content. Note at the top: "Speaker attribution not available."

**Very short meeting (under 10 min)** — Skip the table format. Use a brief paragraph summary + bullets for action items.

**Very long meeting (1+ hour)** — Group discussion points by agenda item or theme. Add a one-line "TL;DR" at the very top before the full minutes.

**Multiple languages** — Write the minutes in the same language the user used to ask, regardless of the transcript language. Note the original language at the top.

**Sensitive content** — If the transcript contains HR, legal, or confidential discussions, include a note: "⚠️ This summary contains sensitive content. Handle accordingly."