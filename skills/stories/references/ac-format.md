# Acceptance Criteria Format

AC must be **short and scannable**. One bullet or scenario line = one testable
statement. If a line takes more than one breath to read aloud, split it.

Two formats. Use the one that matches the story's input:

- **Format A - screen-by-screen blocks** for design-led input (Figma,
  screenshots, mockups)
- **Format B - Given/When/Then scenarios** for behaviour-led input (PRD,
  requirements text)

For mixed input choose per story: screen composition and states take Format A,
workflow behaviour takes Format B. Never mix formats inside one story.

Omit sections that genuinely don't apply - never leave one blank or write "N/A".
Definition of Ready and Definition of Done are **not** part of AC. They are
stated once per output - see `story-template.md`.

---

# Format A - Screen-by-Screen

Stories that span multiple screens are broken out **screen by screen**.
Each screen gets its own Functional Specs and Error Handling block.
Shared concerns (Non-Functional Specs, Out of Scope, Permissions, Analytics,
Dependencies) appear **once at the end**.

---

## Screen [N] - [Screen Name]

### Functional Specs

- Screen displays: [exact title, subtitle, buttons, labels, and UI copy visible on load]
- [User action]: [what happens - navigation, state change, data fetch]
- [User action]: [outcome]

*Rules:*
- One bullet per observable behaviour
- Navigation bullets name the exact destination: "navigates to Screen 2" not "goes to next"
- Display bullets list every visible element using exact copy from the designs
- Back arrow behaviour always stated explicitly

### Error Handling

- [Condition]: [action taken] and show "[exact error message]"
- [API failure]: show "[exact message]" with a retry option
- [Zero results]: show "[exact message with dynamic value if applicable]"

*Rules:*
- Every API call must have a failure bullet
- Every empty / zero-result state must have a bullet
- Error messages quoted verbatim - no paraphrasing

---

*(Repeat the Screen block for each screen in the flow)*

---

## Non-Functional Specs

- [Feature]: [measurable threshold] on [connection / device condition]
- [Feature]: [measurable threshold]

*Concrete numbers only - no "fast", "responsive", or "smooth".*

---

## Out of Scope

- [Thing that could be assumed in scope but isn't - be specific]
- [Feature deferred to a later story - name it if known]

---

## Permissions *(omit if no access control applies)*

- [Role]: can [action]
- [Role]: cannot [action] - [what they see instead]

---

## Analytics *(omit if no trackable actions)*

Missing instrumentation is expensive to retrofit - always specify it.

- Event: `[event_name]` - fires when [trigger]
  - Properties: `[property]`: [type], `[property]`: [type]

---

## Dependencies

- [System or service name]: [link or description]

---

## Format A example (expense submission flow)

```
## Screen 1 - Submit Expense

### Functional Specs
- Screen displays: title "Submit Expense", subtitle "Fill in the details below
  and attach your receipt.", Amount field (required), Category dropdown
  (required, options: Travel / Meals / Equipment / Other), Date field
  (required, defaults to today), Description field (optional, 500 char max),
  Receipt upload (optional, accepts JPG/PNG/PDF), "Submit" button, "Cancel" link.
- "Submit" button is disabled until Amount, Category, and Date are all filled.
- Tapping "Submit" with valid fields saves the claim with status "Pending Approval"
  and navigates to Screen 2.
- Tapping "Cancel" with no data entered returns to the My Claims list.
- Tapping "Cancel" with data entered shows the unsaved-changes dialog.
- Tapping the back arrow behaves identically to "Cancel".

### Error Handling
- Amount empty on submit: show inline error "Please enter an amount."
- Category not selected on submit: show inline error "Please select a category."
- Date empty on submit: show inline error "Please enter a date."
- Receipt wrong file type: reject before upload and show "Only JPG, PNG, and PDF files are accepted."
- Receipt over 5MB: reject and show "File must be under 5MB."
- API error on submit: show banner "Something went wrong. Please try again." and keep form data.

---

## Screen 2 - Submission Confirmed

### Functional Specs
- Screen displays: title "Claim submitted", confirmation message "Your expense
  claim has been submitted and is awaiting manager approval.", "View my claims"
  button.
- Tapping "View my claims" navigates to the My Claims list.
- No back arrow - submission is complete and cannot be undone from this screen.

---

## Non-Functional Specs
- Form loads within 1s on a standard broadband connection.
- Submission API response within 2s on a 4G connection.
- Receipt upload completes within 3s for a file under 5MB on 4G.

---

## Out of Scope
- Manager approval flow - handled in a separate story.
- Multi-currency support - GBP only in this story.

---

## Permissions
- Authenticated employees: can submit claims.
- Unauthenticated users: cannot access this screen - redirected to sign-in.

---

## Dependencies
- Expense API: `[YOUR_API_BASE_URL]/expenses`
```

---

# Format B - Given/When/Then Scenarios

Number the scenarios inside one fenced block. Happy path first, then variants
and boundaries, then every error state.

```
Scenario [N] - [short name]
Given [exact starting state],
When [one user action],
Then [observable outcome]
and [further observable outcomes, one per line].
```

*Rules:*
- One When per scenario - exactly one action under test
- Every Then is observable and testable as written
- Error scenarios quote the exact message the user sees - no paraphrasing
- Success, validation failure, and API failure covered for every submit or async action
- Boundary values get their own scenario (at the limit, over the limit)

## Format B example

```
Scenario 1 - Successful submission with receipt
Given I am logged in as an employee,
When I complete Amount, Category, and Date and click "Submit",
Then the claim is saved with status "Pending Approval"
and I see: "Your expense claim has been submitted."

Scenario 2 - Error: required field missing
Given I am logged in as an employee,
When I click "Submit" with Amount, Category, or Date empty,
Then the form does not submit
and each missing required field shows an inline error message.
```

See `reference.md` for a full worked example in this format.
