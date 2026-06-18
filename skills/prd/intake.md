# PRD Intake - Clarifying Interview Protocol

Run this interview before generating any PRD or BRD. Ask **one question at a time**. Wait for the user's response before moving to the next. The user may pick a suggested answer or type their own.

---

## Step 1 - Signal Detection

Before asking any questions, scan the input for these signals. They activate conditional questions later.

| Signal | What to look for |
|---|---|
| `no-discovery` | Input is a SOW, brief, email, or stakeholder message with no discovery findings section |
| `stale-input` | Input document has a date older than 3 months, language suggests it may have changed, **or no date is present at all** |
| `regulated` | Keywords: FCA, Consumer Duty, GDPR, UK GDPR, PCI, credit, payment, banking, lending, insurance, subscription billing, consent |
| `no-out-of-scope` | Input does not mention what is explicitly excluded from scope |
| `integration-heavy` | Input names 3 or more external APIs, third-party platforms, or existing systems |
| `locale-specific` | Input targets a specific country or region (e.g. "UK SMEs", "US market", "EU customers") but makes no mention of i18n, localisation, or multi-language support |

---

## Step 2 - Interview Sequence

### Q1 - Document Type [always ask first]

> "Should this be a **PRD** (for your engineering and product team) or a **BRD** (for business stakeholders and sign-off)?"

**Suggested answers:**
- A) PRD - engineering and product audience
- B) BRD - business stakeholders, formal sign-off
- C) Not sure - help me decide

*If C: ask "Is the primary reader a developer/PM or a business sponsor/executive?" and route accordingly. Default to PRD for product/tech projects.*

---

### Q2 - Project Context [always ask]

> "What best describes this piece of work?"

**Suggested answers:**
- A) Net new product or platform
- B) New feature on an existing product
- C) MVP - first shippable version of something new
- D) Enhancement or iteration on an existing feature
- E) Integration, migration, or infrastructure change

---

### Q3 - Primary Users [always ask]

> "Who are the primary users of what you're building?"

**Suggested answers:**
- A) External end customers
- B) Internal staff or operations team
- C) Both external customers and internal staff
- D) Let me describe them

**Scope discrepancy check:** After the user answers Q3, compare their response against the entities named in the source document (countries, user types, product areas, platforms). If the user introduces anything not in the source - a new market, a new user group, a new feature area - **stop and resolve it before continuing:**

> "You mentioned [X], which isn't in the source document. Should I treat that as in scope for this PRD, or is it a future-phase item?"

Record confirmed additions as **scope changes** and carry them into the PRD's dedicated scope change note. Do not silently absorb them or defer them to Open Questions.

---

### Q4 - Success Metrics [always ask]

> "Do you have specific targets for what success looks like - conversion rates, load times, adoption numbers, revenue goals? Anything measurable?"

**Suggested answers:**
- A) Yes - I'll share them now
- B) Not defined yet, but I can estimate reasonable targets
- C) No targets have been set - leave them as TBD for now

*If C: note in the PRD Goals section that targets are outstanding and flag as an open question. Do not leave the Goals table empty.*

**Quality gate - apply after receiving any answer to Q4:** If the provided metrics are gates or qualitative descriptions (e.g. "demo sign-off", "stakeholder approval", "users are happy"), push back once:

> "Those read more as gates than metrics - they tell us when we'll stop, not what good looks like. Can we attach a number to any of them, even a rough target? For example: session completion rate > X%, or guided flow resolution rate > Y%."

If the user cannot provide numbers, accept their answer, note each gate-style metric as `[TARGET OUTSTANDING]` in the Goals table, and add an open question per unresolved metric.

---

### Q5 - Hard Constraints [always ask]

> "Are there hard constraints that shape what gets built - things that are fixed and cannot change?"

**Suggested answers (user can pick more than one):**
- A) Regulatory or compliance requirement (e.g. GDPR, FCA, PCI)
- B) Must integrate with specific existing systems or APIs
- C) Fixed budget or deadline
- D) Mandated tech stack or platform
- E) No hard constraints at this stage

---

### Q5b - NFR Targets [always ask, immediately after Q5]

> "A few quick NFR targets - answer what you know, skip what you don't:
> - Response time target? (e.g. < 2s, < 3s)
> - Session inactivity timeout?
> - Browsers / devices that must be supported?
> - Data retention period for user data?
> - Accessibility standard? (e.g. WCAG 2.1 AA, or explicitly not required for this phase)"

Record each confirmed value directly as an NFR row. For any skipped or unknown item, add `[NEEDS TARGET]` in the NFR table and a corresponding open question. Do not defer the entire NFR section to after generation.

---

### Q6 - Scope Boundaries [ask if: `no-out-of-scope` signal detected]

> "Are there features or capabilities that are **definitely not** in scope for this phase - things that might come up but should be parked for later?"

**Suggested answers:**
- A) Yes - I'll list them
- B) Not formally decided yet
- C) Out-of-scope items are already covered in what I shared

---

### Q7 - Discovery Status [ask if: `no-discovery` signal detected]

> "Has discovery been completed for this project? I ask because requirements written without discovery findings tend to change significantly once users are consulted."

**Suggested answers:**
- A) Yes - the findings are in what I shared
- B) Partially - some discovery has been done, and the rest is based on assumptions
- C) No discovery done - we're going straight to requirements
- D) Discovery is not needed for this type of work (e.g. infrastructure, internal tooling)

*If C: add a note at the top of the PRD: "No discovery completed - requirements based on brief only. Expect revision once user research is conducted."*

---

### Q8 - Input Currency [ask if: `stale-input` signal detected]

> "The input document looks like it may have been written a while ago. Is this still the current agreed scope, or have things changed since it was written?"

**Suggested answers:**
- A) Still current and agreed
- B) Some things have changed - I'll note the differences
- C) Significant changes - let me describe the current state

*If B or C: ask the user to clarify what has changed before continuing. Base requirements on the updated picture, not the stale document.*

---

### Q9 - Regulatory Context [ask if: `regulated` signal detected]

> "Which regulatory frameworks apply to this product? I want to make sure compliance requirements appear as constraints and NFRs, not assumptions."

**Suggested answers:**
- A) FCA / Consumer Duty (UK financial services)
- B) GDPR / UK GDPR (data privacy)
- C) PCI DSS (payments and card data)
- D) Multiple - I'll list them
- E) Not regulated, the signals were coincidental

---

### Q9b - Localisation Scope [ask if: `locale-specific` signal detected]

> "The product appears to target a specific locale. Is localisation - multiple languages, regional date/currency formats, right-to-left support - in scope now, planned for a future phase, or out of scope entirely?"

**Suggested answers:**
- A) Single locale only (e.g. UK English, USD) - state it as a constraint, note future scope
- B) Multi-locale is in scope for this phase - I'll specify which
- C) Not yet decided

*If A: add as a Constraint in section 4 (e.g. "UK English only, multi-locale deferred to future phase"). Do not leave it assumed.*

---

### Q10 - Open Risks and Gaps [always ask last - gate question]

> "Last question before I write the PRD - is there anything critical that affects the requirements which isn't covered in what you've shared? Team concerns, known blockers, design decisions still open, anything I should factor in?"

**Suggested answers:**
- A) No - everything important is in the input
- B) Yes - I'll add it now
- C) There are open questions but nothing that blocks writing requirements

---

## Step 3 - Proceed to Generation

Once Q10 has been answered, proceed to the PRD. Do not ask further questions unless a response introduces a critical ambiguity that would materially change the requirements (e.g. a previously unknown regulatory constraint or a scope change).

Carry all answers forward:
- Q1 answer → determines PRD vs BRD format
- Q2 answer → informs Purpose & Background framing
- Q3 answers → populate the Users & Stakeholders section. Any scope discrepancy resolutions populate the Scope Changes section
- Q4 answers → populate Goals & Success Metrics. Use the provided targets, and flag gate-style or outstanding ones as open questions
- Q5 answers → populate Constraints in section 4
- Q5b answers → populate the NFR table with confirmed targets. Unknowns become `[NEEDS TARGET]` rows and open questions
- Q6 answers → populates Out of Scope section 7
- Q7 answer → adds discovery caveat if needed
- Q8 answer → ensures requirements reflect current state, not stale document
- Q9 answers → ensures each framework appears as an NFR row and a constraint
- Q10 answer → any additions are folded in before writing begins
