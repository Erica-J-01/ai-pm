# Risk Scan - Pre-Scan Interview Protocol

Run this interview whenever `/risk-scan` is invoked interactively, before writing any analysis.

Ask **one question at a time**. Wait for the user's answer before asking the next. For every question, offer suggested answers the user can pick from or ignore and type their own. Never present multiple questions at once, except the batched forms of Q5 and Q11 described below.

**Skip rule:** skip any question the input already answers, and record the source of the answer (e.g. "from the SOW") so the analysis can cite it. Only ask what the input leaves open.

**Depth scaling:** at Low depth (the user asked for a quick scan) ask only Q1 and Q13. Asking for a quick scan already answers Q2.

**Non-interactive mode:** when risk-scan runs inside an orchestrated `/pm` chain straight after triage, ask no questions at all. Analyse what the input provides and record every unanswered area in Not Assessed.

---

## Step 1: Detect Signals From the Input

Before asking anything, scan the input for these signals. They determine which conditional questions to include after the core questions.

| Signal | What to look for |
|---|---|
| Date gap | Document date, SOW date, or sprint dates older than today |
| Named external dependencies | APIs, vendors, platforms, or regulatory bodies waiting to provide access or approval |
| Explicitly named risks | Risks called out in the source document itself |
| T&M commercial model | Time and Materials billing with no fixed-price ceiling |
| Multiple phases in scope | More than one phase covered by the same document |
| Team composition stated | Named roles, headcount, or day allocations |
| Compliance / regulatory requirements | FCA, GDPR, PCI, HMRC, or equivalent |
| Tight or expedited timeline | "Expedited", "accelerated", "MVP target", parallel workstreams |
| Third-party integrations | Integrations with systems not owned by the delivery team |
| Phase or current status is ambiguous | Input does not clearly state what phase the project is in right now |

---

## Step 2: Run the Interview - One Question at a Time

Work through the questions in the order listed. Ask each question, present the suggested answers, wait for the response, then move to the next.

Skip a conditional question if its signal was not detected in the input, if the input itself already answers it, or if a previous answer already covered it.

---

### Q1 - Current Phase and Status [always ask]

> "First, let's make sure I have the current picture. What phase is the project in right now, and roughly where are you within it?"

**Suggested answers:**
- A) Pre-kickoff - not started yet
- B) Phase 0 / Foundation - underway
- C) Phase 1 / MVP - in active development
- D) Phase 1 / MVP - near completion or in sign-off
- E) Phase 2+ - later phase
- F) Post-launch - live and in operations
- G) Other - I'll describe

---

### Q2 - Depth Preference [always ask]

> "How thorough does this risk scan need to be?"

**Suggested answers:**
- A) Quick scan - give me the top 3-5 risks fast
- B) Standard review - full risk register, key decisions, not assessed areas *(default)*
- C) Thorough - board-level depth, prioritisation reasoning, 8-12 risks

---

### Q3 - What Has Changed Since the Document Was Written [ask if: date gap detected]

> "The document is dated [X] but today is [Y]. What's changed since it was written?"

**Suggested answers:**
- A) Nothing significant - the document still reflects current reality
- B) Timeline has shifted - we're behind / ahead of the original plan
- C) Scope has changed - features added, removed, or reprioritised
- D) Team has changed - joiners, leavers, or role changes
- E) Key decisions have been made that aren't in the document
- F) Multiple things have changed - I'll describe

---

### Q4 - Delivery Status Against Plan [ask if: date gap detected]

> "Which deliverables or milestones have been completed, and is the project on schedule?"

**Suggested answers:**
- A) On track - all milestones hit as planned
- B) Slightly behind - 1 to 2 weeks
- C) Significantly behind - 3 or more weeks
- D) Ahead of schedule
- E) Mixed - some on track, some delayed - I'll describe
- F) I don't have a clear view right now

---

### Q5 - External Dependency Status [ask if: named external dependencies detected]

List every dependency named in the input, then ask about all of them in one batched question. Present the full list with the status options and let the PM answer per line. Cover every dependency, even ones that seem resolved.

> "The document names these dependencies: [list them]. For each one, what's the current status?"

**Status options (answer per dependency):**
- A) Resolved - access / approval confirmed
- B) In progress - actively being worked, expected by [date]
- C) Blocked - no progress, no clear resolution date
- D) Not yet started
- E) Unknown - I'll need to check

For any dependency answered B or D, follow up once, covering all of them together:

> "For [names]: has sandbox/development access been confirmed, or is the team working against documentation only? And is production access on a separate track?"

*(One batched question covers every named dependency - do not drop any from the list.)*

---

### Q6 - Named Risks From the Document [ask if: risks explicitly named in source]

> "The document flags [risk name / area] as a known risk. Has it materialised, been mitigated, or is it still open?"

**Suggested answers:**
- A) Mitigated - it was resolved
- B) Still open - it hasn't materialised yet but remains a concern
- C) It has materialised - and here's the impact: [user describes]
- D) Partially mitigated - reduced but not fully resolved
- E) Unknown - I'll need to check

*(Repeat for each named risk before moving on.)*

---

### Q7 - Budget and Burn Rate [ask if: T&M commercial model detected]

> "What's the current spend against the original estimate?"

**Suggested answers:**
- A) Within budget - burn rate is on track
- B) Slightly over - less than 10% above estimate
- C) Significantly over - more than 10% above estimate
- D) Under budget - spending less than estimated
- E) Unknown - I don't have visibility on this

---

### Q8 - Phase Status [ask if: multiple phases in scope]

> "The document covers more than one phase. Are all phases still active, or has one closed or been paused?"

**Suggested answers:**
- A) All phases active and running to plan
- B) Earlier phase closed - later phase now active
- C) One phase has been paused
- D) Phases are running concurrently - both in progress
- E) I'll describe the current state

---

### Q9 - Team Changes [ask if: team composition stated in document]

> "Has the team changed since the document was written?"

**Suggested answers:**
- A) No change - same team as documented
- B) Someone has left and not been replaced
- C) Someone has left and been replaced
- D) New people have joined beyond the original plan
- E) Roles or responsibilities have shifted

---

### Q10 - Compliance Sign-Off Status [ask if: compliance / regulatory requirements detected]

> "The work involves [FCA / GDPR / PCI / other] compliance. What's the current sign-off status?"

**Suggested answers:**
- A) Signed off - legal / compliance review complete
- B) In progress - review underway, expected by [date]
- C) Not started - hasn't been initiated yet
- D) Blocked - waiting on a named reviewer or decision
- E) Unknown - I'll need to check

---

### Q11 - Integration Status [ask if: third-party integrations detected]

List every integration named in the input, then ask about all of them in one batched question. Do not drop the less prominent ones. Integrations from prior phases that are assumed complete should still be confirmed.

> "These integrations are named: [list them]. What is the current status of each?"

**Status options (answer per integration):**
- A) Complete - integrated and tested end-to-end
- B) In progress - being built or tested now
- C) Not started - not yet begun
- D) Blocked - waiting on access, credentials, or a third party
- E) Descoped - no longer in plan

*(One batched question covers every named integration. Include integrations from closed phases if they underpin current phase deliverables.)*

---

### Q12 - UAT Readiness [ask if: project is in Phase 1 active development or near completion]

> "Is UAT planned, and do you have confirmed resource and participants lined up to run it?"

**Suggested answers:**
- A) Yes - UAT plan exists, resource confirmed, dates locked
- B) Partially - plan exists but participants or dates not yet confirmed
- C) Not yet planned - UAT approach still to be defined
- D) UAT is being handled by the delivery team, not end users
- E) Unknown - I'll need to check

---

### Q13 - Open Risk Question [always ask last]

> "Finally - are there any risks already on your radar that you'd like me to factor in? These could be things not in the document, early warning signals from the team, or concerns you haven't been able to formally flag yet."

**Suggested answers:**
- A) No - nothing beyond what's in the document
- B) Yes - I'll describe them
- C) There are a few things I'm watching but nothing confirmed yet - I'll mention them

---

## Step 3: Proceed to Analysis

Once the user has answered Q13, proceed directly to the risk analysis. Do not ask further questions unless a response introduces a critical ambiguity that would materially change the risk register.

One exception: if any red risk lacks a named owner at finalisation, ask a single batched question covering all of them ("Who personally owns each of these?") per the Quality Checks in SKILL.md.

In non-interactive mode there is no interview and no owner question - proceed straight to analysis with whatever the input provides and record the gaps in Not Assessed.
