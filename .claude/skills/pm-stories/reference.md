# Reference: Worked Example

Shows how to handle a design/screenshot input and produce spec-driven stories with proper assumptions and open questions.

---

## Input

> [Screenshot described]: Expense submission form. Fields: Amount (required), Category dropdown (required, options: Travel/Meals/Equipment/Other), Date (required, defaults to today), Description (optional, 500 char max), Receipt upload (optional, accepts JPG/PNG/PDF). Submit button. Cancel link. No validation error states visible in the design.

Plus PRD note: "Employees submit expense claims. Manager must approve. Finance exports monthly."

---

## Reading the Design Before Writing Stories

Every element in the design maps to at least one scenario:

| Element | Stories / scenarios it generates |
|---|---|
| Amount field (required) | Happy path, empty submission attempt, negative value, zero value |
| Category dropdown | Happy path, no selection attempt |
| Date (defaults to today) | Happy path, past date, future date (allowed?) |
| Description (optional, 500 char) | With/without, at limit, over limit |
| Receipt upload (optional) | With/without, wrong file type, oversized file |
| Submit button | Success, validation failure |
| Cancel link | Unsaved changes warning? — [open] |
| Validation errors | Not visible in design — [open] must be defined |

---

## USER STORIES — Expense Management / Claim Submission

**Date:** [Today] | **Author:** PM
**Source:** Design v1.2 + PRD FR-04
**Definition of Ready:** Story has title, statement, AC, assumptions, open questions logged

---

### Epic: Expense Claim Submission
*Employees can submit expense claims through a form; the claim enters a manager approval workflow on submission.*

Child stories: S-01, S-02, S-03, S-04 (spike)

---

#### [S-01] Submit valid expense claim

**As an** employee,
**I want to** submit an expense claim with the required details,
**So that** I can get reimbursed without emailing receipts manually.

**Priority:** Must
**Size:** M
**INVEST check:** ✅ Pass
**Linked req:** FR-04

---

**Acceptance Criteria**

```
Scenario 1 — Successful submission with receipt
Given I am logged in as an employee,
When I complete Amount, Category, and Date and click "Submit",
Then the claim is saved with status "Pending Approval",
and I see a confirmation message: "Your expense claim has been submitted."
and the claim appears in my "My Claims" list immediately.

Scenario 2 — Successful submission without receipt
Given I am logged in as an employee,
When I submit a valid claim without uploading a receipt,
Then the claim is saved with status "Pending Approval"
and a flag "No receipt attached" is visible on the claim record.

Scenario 3 — Submit with description at 500 character limit
Given I am logged in as an employee and have typed exactly 500 characters in Description,
When I click "Submit",
Then the claim submits successfully and the full description is saved.

Scenario 4 — Error: Required field missing
Given I am logged in as an employee,
When I click "Submit" with Amount, Category, or Date empty,
Then the form does not submit
and each missing required field is highlighted with an inline error message.
```

**Assumptions**
- `[assumed]` Employees can submit claims for any date in the past — no lookback limit enforced at submission. Confirm with Finance before release.
- `[assumed]` Currency defaults to GBP. Multi-currency is out of scope unless Finance confirms otherwise.

**Open Questions**
- `[open]` Are future dates allowed in the Date field? The design defaults to today but doesn't prevent future dates. Finance team to confirm. Blocks S-01 Scenario 3 finalisation.
- `[open]` What is the confirmation message exact wording? Copywriter or product owner to confirm before build.

**Dependencies**
- None — this is the entry point of the expense workflow.

---

#### [S-02] Upload receipt to expense claim

**As an** employee,
**I want to** attach a receipt to my expense claim,
**So that** my manager has the evidence they need to approve without asking me for it separately.

**Priority:** Must
**Size:** S
**INVEST check:** ✅ Pass
**Linked req:** FR-04

---

**Acceptance Criteria**

```
Scenario 1 — Upload valid receipt
Given I am on the expense submission form,
When I upload a JPG, PNG, or PDF file under 5MB,
Then the file name appears below the upload button
and the file is attached to the claim on submission.

Scenario 2 — Upload wrong file type
Given I am on the expense submission form,
When I attempt to upload a file that is not JPG, PNG, or PDF (e.g. .docx),
Then the file is rejected before upload begins
and I see: "Only JPG, PNG, and PDF files are accepted."

Scenario 3 — Upload oversized file
Given I am on the expense submission form,
When I upload a file larger than 5MB,
Then the upload is rejected
and I see: "File must be under 5MB."

Scenario 4 — Remove uploaded file
Given I have already attached a file to the form,
When I click the remove/clear action next to the file name,
Then the attachment is removed and the upload field returns to its empty state.
```

**Assumptions**
- `[assumed]` Maximum file size is 5MB — industry standard for receipt uploads. IT to confirm server-side limit matches.
- `[assumed]` Only one receipt per claim — design shows a single upload field.

**Open Questions**
- `[open]` Should multiple receipts be supported (e.g. multi-day travel)? Design shows one upload only but PRD doesn't address it. Product owner to decide. If yes, this story needs resizing.

**Dependencies**
- Independent — can be built and tested standalone.

---

#### [S-03] Cancel expense claim in progress

**As an** employee,
**I want to** cancel a claim I've started filling in,
**So that** I don't accidentally submit incomplete or incorrect data.

**Priority:** Should
**Size:** XS
**INVEST check:** ✅ Pass
**Linked req:** FR-04

---

**Acceptance Criteria**

```
Scenario 1 — Cancel with no data entered
Given I am on the expense form with no fields filled,
When I click "Cancel",
Then I am returned to the previous page with no claim created.

Scenario 2 — Cancel with data entered
Given I have entered data in at least one field,
When I click "Cancel",
Then I see a confirmation dialog: "You have unsaved changes. Are you sure you want to leave?"
with options "Stay" and "Leave".

Scenario 3 — Confirm cancel
Given the "unsaved changes" dialog is showing,
When I click "Leave",
Then the form is discarded, no claim is created, and I am returned to the previous page.

Scenario 4 — Stay on form
Given the "unsaved changes" dialog is showing,
When I click "Stay",
Then the dialog closes and my entered data is preserved.
```

**Assumptions**
- `[assumed]` "Previous page" means the My Claims list — confirm with designer if navigation is different.

**Open Questions**
- None — scenarios are fully defined.

**Dependencies**
- Independent.

---

#### [S-04] SPIKE — Investigate manager approval notification mechanism

**Spike: Investigate** manager approval notification mechanism
**Timebox:** 2 days
**Goal:** Answer this specific question: When a claim is submitted, how should the manager be notified — in-app notification, email, or both? And what triggers the notification?
**Output:** A documented decision on notification approach so that the manager approval story (S-05) can be written and estimated.

**Why this is a spike and not a story:**
The PRD states "manager must approve" but doesn't define how they're notified. Two developers asked independently gave estimates of 2 days and 2 weeks depending on whether email infrastructure already exists. The story cannot be estimated until the approach is confirmed.

---

### Story Summary

| ID | Title | User | Priority | Size | INVEST | Source |
|---|---|---|---|---|---|---|
| S-01 | Submit valid expense claim | Employee | Must | M | ✅ Pass | FR-04 |
| S-02 | Upload receipt to expense claim | Employee | Must | S | ✅ Pass | FR-04 |
| S-03 | Cancel expense claim in progress | Employee | Should | XS | ✅ Pass | FR-04 |
| S-04 | SPIKE: Manager notification | PM | Must | 2d | ⚠️ Not estimable yet | PRD gap |

---

## Why This Output Is Good

**The design was read before stories were written.** The cancel link, the optional receipt, the 500-char description limit, the missing error states — all of these were catalogued from the design before a single story was written. Teams that skip this step discover missing scenarios during UAT.

**S-02 is separate from S-01.** Receipt upload could have been AC inside S-01. It's a separate story because it's independently buildable, independently testable, and independently releasable (the form works without it). Keeping it separate means the team can ship S-01 earlier.

**S-04 is a spike, not a story.** The 2-day vs 2-week estimate gap is a real signal: the team doesn't know enough to build it. Writing stories on top of this uncertainty produces waste. The spike produces the decision that unblocks the story.

**Assumptions and open questions are separated.** The 5MB limit is an assumption — the team can proceed with it and it's a reasonable default. The future-date question is genuinely open — the answer changes a scenario in S-01 and needs an external decision. Treating them the same creates confusion about what the team can proceed with.

**Error messages are specific.** "Only JPG, PNG, and PDF files are accepted" — not "invalid file type error shown." A developer reading the latter would make up the copy. A tester reading the former can verify it exactly.