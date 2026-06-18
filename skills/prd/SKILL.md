---
name: prd
description: 'Writes a Product Requirements Document (PRD) or Business Requirements Document (BRD) from discovery findings, a project brief, or raw stakeholder input. Use whenever someone says "write the PRD", "write the BRD", "document the requirements", "turn this into a spec", or has completed discovery and needs requirements formally documented before build begins. A PRD defines what to build and why - from the product/user perspective. A BRD defines what the business needs the solution to achieve - from the business/stakeholder perspective. Both serve the same purpose: give the team a single agreed source of truth so everyone builds the same thing. Use this skill after discovery, before user stories or design begins.'
version: 3.1.0
argument-hint: <discovery findings, charter, or feature brief>
allowed-tools: Read
---

## Input

$ARGUMENTS

*If no input is provided, ask: "Please share your discovery findings, project charter, or feature brief."*

---

# Step 1 - Run the Intake Interview

Read `skills/prd/intake.md` and follow the interview protocol exactly.

- Scan the input for signals listed in intake.md before asking any questions
- Ask **one question at a time** - never present multiple questions together
- Wait for the user's response before moving to the next question
- Skip conditional questions whose signal was not detected
- **Do not begin writing the PRD until Q10 has been answered**

For BRD: once Q1 confirms BRD, also read `brd-guide.md` for structural differences.

---

# Step 2 - Confirm Feature Areas Before Writing FRs

Before writing any FR, derive the feature areas from the source material and confirm them with the user in a single message:

> "I'll group requirements under these areas: [list them]. Does that look right, or should any be split, merged, or renamed?"

Wait for confirmation or correction. Adjust the areas before proceeding. This prevents structural rework after FRs are written.

---

# Step 3 - Translate Source Material Into Requirements

**Do this before writing a single FR.**

Source material (SOW, brief, acceptance criteria) describes deliverables - what will be built. Requirements describe behaviour - what the system must do.

**Rule: Never copy-paste a deliverable or acceptance criterion as an FR. Re-express it.**

| Source says | FR says |
|---|---|
| "Score gauge implemented and QA passed" | FR-01: The system must display a score gauge (0-100) with colour-coded risk bands. FR-02: The gauge must animate on load. |
| "Error handling implemented" | FR-XX: The system must display [exact message] when [specific error condition] occurs. |
| "Functional and visually approved" | Split: one FR for function, one NFR for visual sign-off gate. |

Each source item may produce 1-4 FRs. That is expected. It means requirements are atomic.

---

# Step 4 - Requirement Quality Rules

Apply these rules to every FR before including it in the output.

**1. One FR = one observable, testable behaviour.**
If an FR contains "and", ask: can each half fail independently? If yes - split into two FRs.

**2. No adjectives without numbers.**
- "Fast" → "< 2 seconds"
- "Secure" → name the specific control (e.g. "HMAC-SHA256 signature verification")
- "Accessible" → "WCAG 2.1 AA"

**3. Error states are their own FRs.**
Never append "with error handling" to a happy-path FR. Write a separate FR per distinct error condition.

**4. No TBD inside an FR.**
If a value is unknown, the requirement is not ready to be written. Move it to Open Questions (section 9) and return to it when resolved.

**5. Enforce this format:**
- User action: "The [actor] must be able to [action] [under condition] so that [outcome]."
- System behaviour: "The system must [action] when [trigger] [resulting in outcome]."

**6. Smell check - before finalising the FR table, flag and fix any of these:**
- FR contains "etc.", "and/or", or more than one verb clause → split or rewrite
- FR priority is Must but the target value is unconfirmed → move to Open Questions
- FR duplicates information already stated in another FR → remove the duplicate
- FR reads like it was copied verbatim from the source input → rewrite
- FR describes a process rule or team behaviour (e.g. "content must be reviewed by…") → move to Assumptions or Constraints
- FR and an NFR row state the same target (e.g. response time in both) → remove the FR; NFRs own non-functional targets
- FR error state uses vague language ("appropriate message", "clearly worded") without specifying the exact message or condition → rewrite or move to Open Questions

---

# Step 5 - Error State Enumeration

Before finalising FRs for each feature area, explicitly list the distinct error conditions that can occur. Each must become its own FR - never append error handling to a happy-path FR.

For each feature area, ask: what happens when -
- The external service / API is unavailable or returns an error?
- The user's input matches nothing in the system?
- Authentication fails or the session expires mid-flow?
- A rate limit is hit?
- The network connection is lost?

Write a separate FR for each condition that applies, using the format:
> "The system must display [exact message or behaviour] when [specific error condition]."

If the exact message or behaviour is not yet defined, move it to Open Questions - do not write a vague FR.

---

# Step 6 - Coverage Check

Before writing sections 4, 6, and 7, verify every item in the table below is accounted for somewhere in the PRD. Each item must appear as one of:
- An **NFR row** in section 6 (with a concrete target, or `[NEEDS TARGET]` if unknown)
- A **Constraint** in section 4 (if it is fixed and non-negotiable)
- An **Out of Scope entry** in section 7 (if it is explicitly deferred to a future phase)

**Never silently omit an item.** If it does not fit any of the three homes, add it as an Open Question.

| Category | What to cover | Typical home |
|---|---|---|
| Performance | Page and API response time targets | NFR |
| Security | Authentication, authorisation, and encryption controls named specifically - not just "security implemented" | NFR |
| Accessibility | WCAG level stated (e.g. WCAG 2.1 AA) | NFR or Out of Scope |
| Availability | Uptime or SLA target | NFR |
| Data retention | How long each data type is stored; who manages deletion | NFR |
| Account deletion / right to erasure | Can a user delete their account and all associated data? Required under UK GDPR unless explicitly out of scope | NFR or Out of Scope |
| Audit logging | Which user and system actions are logged; how long logs are retained; especially critical for regulated or financial products | NFR |
| API rate limiting | Behaviour when quota is exhausted for each named external API | NFR or FR (error state) |
| Session management | Timeout period; concurrent session rules | NFR |
| Browser and device support | Named browsers and minimum versions - without this QA has no acceptance threshold | NFR or Constraint |
| Localisation / internationalisation | Target locale(s) stated explicitly; if single-locale only, state it as a constraint and note future scope - do not leave it assumed | Constraint or Out of Scope |

---

# Step 7 - Output Template

The output is clean markdown. Do not include guidance, rules, or instructional commentary in the generated document - those stay in this skill file.

---

## [PRD / BRD] - [Project Name]

**Version:** 1.0 | **Date:** [Today] | **Status:** Draft
**Approvers:** [Roles who must sign off]

---

### Scope Changes from Source Document

*Only include this section if the intake interview surfaced items that contradict or extend the source material (SOW, brief, charter). List each change explicitly so reviewers know exactly what diverged and why. Remove this section if there are no changes.*

| # | Change | Original (source says) | Updated (PRD reflects) | Reason |
|---|---|---|---|---|
| SC-01 | | | | Confirmed by [name] on [date] |

---

### 1. Purpose & Background

[2-3 sentences. Why does this project exist? What problem does it solve? What triggered it?]

### 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| | | |

### 3. Users & Stakeholders

| Role | Who they are | Primary need |
|---|---|---|
| | | |

### 4. Assumptions & Constraints

**Assumptions** - believed true, must be validated before build:
- [assumed] ...

**Constraints** - fixed, cannot change:
- ...

### 5. Functional Requirements

Group by feature area or user journey. Use a parent heading when there are more than 7 areas. MoSCoW: **Must** (product fails without it) / **Should** (high value, workaround exists) / **Could** (cut first if time is tight).

#### [Feature Area]

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-01 | | Must / Should / Could | |

### 6. Non-Functional Requirements

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-01 | | | |

### 7. Out of Scope

- ...

### 8. Dependencies

| Dependency | Type | Owner | Status |
|---|---|---|---|
| | | | Confirmed / Pending / Blocked |

### 9. Open Questions

| # | Question | Owner | By When |
|---|---|---|---|
| Q1 | | | |

### 10. Sign-off

| Role | Name | Status | Date |
|---|---|---|---|
| Product Owner | | Pending | |
| Tech Lead | | Pending | |
