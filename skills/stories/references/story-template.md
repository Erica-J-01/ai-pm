# Story Template

Use this exact template for every story. Never omit a field except where marked
optional. "None" only when the field genuinely does not apply.

---

## [Story Title]

**As a** [persona]
**I want to** [goal]
**So that** [outcome]

---

**Priority:** [Must / Should / Could]

**Indicative Size:** [1 / 2 / 3 / 5 / 8, or "TBD - team to estimate". This is a
PM planning guess, not an estimate - the team's figure from refinement
supersedes it. If it looks likely above 8, write "likely >8 - split before
refinement" instead of a number.]

**Linked Requirement:** [FR-XX or requirement ID from the source doc. "None"
for design-only input with no numbered requirements.]

**Dependencies**
- Blocked by: [Story ID or None]
- Blocks: [Story ID or None]

**Feature Flag**
- Flag name: [`feature_name` or None]
- Default: [on / off]

**Assumptions**
- `[assumed]` [Inference the team can proceed on] - [who confirms it]

**Open Questions**
- [ ] [Question whose answer would change the story] | Owner: [Name] | Needed by: [Sprint / Date]

**Stakeholder Sign-off** *(optional - include only where the engagement
requires per-story sign-off, e.g. regulated delivery)*
- Approved by: [Name] | Role: [e.g. Product Lead] | Date: [date]

---

[Acceptance Criteria - use ac-format.md]

---

## Definition of Ready / Definition of Done - once per output

State these once at the end of the full output, never inside each story. If
the team's board already defines them, replace the checklists with one line
saying so.

**Definition of Ready**
- [ ] AC fully written with no "to be defined" items
- [ ] All open questions resolved or have a named owner and deadline
- [ ] Design assets attached or linked
- [ ] Dependencies identified and unblocked
- [ ] NFRs specified

**Definition of Done**
- [ ] All AC passes QA sign-off
- [ ] Unit and integration tests written and passing
- [ ] Deployed to staging and smoke-tested
- [ ] No new accessibility violations (WCAG 2.1 AA)
- [ ] PR reviewed and merged
- [ ] Feature flag configured (if applicable)
- [ ] Rollback plan documented (if applicable)
