# Story Template

Use this exact template for every story. Never omit a field. "None" only when
the field genuinely does not apply.

---

## [Story Title]

**As a** [persona]
**I want to** [goal]
**So that** [outcome]

---

**Story Points:** [1 / 2 / 3 / 5 / 8 — flag anything >8 for splitting]

**Dependencies**
- Blocked by: [Story ID or None]
- Blocks: [Story ID or None]

**Feature Flag**
- Flag name: [`feature_name` or None]
- Default: [on / off]

**Open Questions**
- [ ] [Question] | Owner: [Name] | Needed by: [Sprint / Date]

**Stakeholder Sign-off**
- Approved by: [Name] | Role: [e.g. Product Lead] | Date: [date]

---

[Acceptance Criteria — use ac-format.md]

---

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