# Acceptance Criteria Format

AC must be **short and scannable**. One bullet = one testable statement.
If a line takes more than one breath to read aloud, split it.

Omit sections that genuinely don't apply — never leave one blank or write "N/A".

---

## Structure

Stories that span multiple screens are broken out **screen by screen**.
Each screen gets its own Functional Specs and Error Handling block.
Shared concerns (Non-Functional Specs, Out of Scope, Permissions, Analytics,
Definition of Done, Dependencies) appear **once at the end**.

---

## Screen [N] — [Screen Name]

### Functional Specs

- Screen displays: [exact title, subtitle, buttons, labels, and UI copy visible on load]
- [User action]: [what happens — navigation, state change, data fetch]
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
- Error messages quoted verbatim — no paraphrasing

---

*(Repeat the Screen block for each screen in the flow)*

---

## Non-Functional Specs

- [Feature]: [measurable threshold] on [connection / device condition]
- [Feature]: [measurable threshold]

*Concrete numbers only — no "fast", "responsive", or "smooth".*

---

## Out of Scope

- [Thing that could be assumed in scope but isn't — be specific]
- [Feature deferred to a later story — name it if known]

---

## Permissions *(omit if no access control applies)*

- [Role]: can [action]
- [Role]: cannot [action]; [what they see instead]

---

## Analytics *(omit if no trackable actions)*

Missing instrumentation is expensive to retrofit — always specify it.

- Event: `[event_name]` — fires when [trigger]
  - Properties: `[property]`: [type], `[property]`: [type]

---

## Definition of Done

- [ ] All functional and non-functional AC passed
- [ ] Unit and integration tests written and passing
- [ ] Code reviewed and merged
- [ ] Tested in staging environment
- [ ] No known defects outstanding
- [ ] No new accessibility violations (WCAG 2.1 AA)
- [ ] Feature flag configured (if applicable)

---

## Dependencies

- [System or service name]: [link or description]

---

## Example (expense submission flow)

```
## Screen 1 — Submit Expense

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

## Screen 2 — Submission Confirmed

### Functional Specs
- Screen displays: title "Claim submitted", confirmation message "Your expense
  claim has been submitted and is awaiting manager approval.", "View my claims"
  button.
- Tapping "View my claims" navigates to the My Claims list.
- No back arrow — submission is complete and cannot be undone from this screen.

---

## Non-Functional Specs
- Form loads within 1s on a standard broadband connection.
- Submission API response within 2s on a 4G connection.
- Receipt upload completes within 3s for a file under 5MB on 4G.

---

## Out of Scope
- Manager approval flow — handled in a separate story.
- Multi-currency support — GBP only in this story.

---

## Permissions
- Authenticated employees: can submit claims.
- Unauthenticated users: cannot access this screen; redirected to sign-in.

---

## Definition of Done
- [ ] All functional and non-functional AC passed
- [ ] Unit and integration tests written and passing
- [ ] Code reviewed and merged
- [ ] Tested in staging environment
- [ ] No known defects outstanding

---

## Dependencies
- Expense API: `[YOUR_API_BASE_URL]/expenses`
```