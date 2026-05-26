# Reference — technical-feasibility-review

Use this to calibrate output quality — especially for translating technical language, scoring risks, and writing precise SA questions.

---

## Input

**Project:** Payment Gateway Integration
**Document reviewed:** Solution Architecture Proposal — Stripe Connect Integration

> **SA Proposal (verbatim):**
> "We recommend implementing Stripe Connect for the marketplace payment flow. The approach uses a platform account with connected accounts per vendor. Payouts will be triggered via webhooks on order completion events. We'll need to implement idempotency keys on all payment endpoints to handle retries safely. KYC verification will be delegated to Stripe. The data model will require a new `vendor_accounts` table with a foreign key to `users`. Estimated backend effort: 3 sprints. Frontend payment UI is out of scope for this proposal."

---

## Output

## Technical Feasibility Review

**Project:** Payment Gateway Integration
**Document reviewed:** Architecture Proposal — Stripe Connect Integration
**Date:** 2026-05-24

---

### Document Type
Architecture proposal

---

### Plain-English Summary
The team proposes using Stripe Connect — a product designed for marketplaces — to handle payments between buyers and vendors on the platform. Each vendor gets their own Stripe account linked to the platform's master account, and when an order completes, Stripe automatically triggers the payout to the right vendor. Stripe also handles the identity verification (KYC) required to legally pay out to vendors, which removes the need to build that ourselves. The backend requires a new database table to link vendors to their Stripe accounts. The payment screens that users actually see are not included in this proposal.

---

### Delivery Implications

- **Timeline:** 3 sprints for backend only. Frontend payment UI is explicitly out of scope — this needs a separate estimate before the full feature can ship to users.
- **Team / skills:** Stripe Connect has a steeper learning curve than basic Stripe integration. The team needs familiarity with OAuth flows, webhook reliability, and idempotency handling. Confirm this exists in the current team before committing to the sprint estimate.
- **Scope:** Frontend payment UI is missing from this proposal. If the end-to-end payment flow needs to ship as one release, the frontend work must be scoped and added to the plan now — not discovered mid-delivery.
- **Third-party dependencies:** Stripe Connect requires vendor onboarding (each vendor must complete Stripe's KYC process before they can receive payouts). If vendors don't complete onboarding, payouts are blocked regardless of what the platform builds.
- **Operational / maintenance:** Webhook reliability must be monitored in production. Failed webhooks mean missed payouts — this requires alerting and a retry strategy from day one, not post-launch.

---

### Risks Surfaced

| # | Risk | Likelihood | Impact | Note |
|---|---|---|---|---|
| R1 | Frontend payment UI is unscoped — the backend ships but users can't complete a payment | H | H | Proposal explicitly excludes frontend; no estimate exists yet |
| R2 | Vendor KYC onboarding blocks payout capability at launch | M | H | Stripe requires each vendor to complete identity verification before payouts are enabled — this is vendor-driven, not platform-driven |
| R3 | Team lacks Stripe Connect-specific experience, causing underestimation of webhook and OAuth complexity | M | M | Basic Stripe ≠ Stripe Connect; connected accounts, OAuth, and idempotency handling are meaningfully more complex |
| R4 | Webhook failures in production cause silent payout misses with no alerting | M | H | Proposal mentions idempotency keys but doesn't address monitoring or retry strategy |

**Top risk to act on now:** R1 — the frontend is out of scope but required for the feature to ship; without a scope and estimate for the payment UI, the delivery plan has a gap that will surface mid-sprint.

---

### Dependencies

- Stripe Connect platform account must be created and configured before development begins
- Each vendor must complete Stripe's KYC onboarding before they can receive payouts — this is a vendor action, not a platform build task; it needs a comms and onboarding plan
- `vendor_accounts` data model must be reviewed and approved before backend sprint 1 begins
- Frontend payment UI must be scoped and estimated separately before a full delivery timeline can be confirmed
- Webhook endpoint infrastructure (reliability, retry, alerting) must be confirmed as in scope for the backend sprints

---

### Questions for the SA / Tech Lead

1. The frontend payment UI is out of scope for this proposal — what is the estimated effort, and which sprint does it target? The feature cannot ship to users without it.
2. How are failed webhooks handled if the order completion event is missed or delivered out of order? Is there a retry mechanism and alerting in scope?
3. Has the team implemented Stripe Connect (not just basic Stripe) before? If not, is the 3-sprint estimate based on a spike or prior experience?
4. What happens to a vendor's orders if their Stripe KYC is incomplete at launch — are payments held, blocked, or do they fail silently?
5. Is the idempotency key implementation covering all payment endpoints, or just the primary charge endpoint? What happens on a partial failure mid-flow?
6. Does the `vendor_accounts` table design account for vendors who operate across multiple jurisdictions with different payout rules?
7. Are there any Stripe Connect pricing implications (per-transaction fees, platform fees) that need to be reflected in the commercial model before we commit to this approach?

---

### Scope Implications

The proposal covers backend only across 3 sprints. The frontend payment UI — which users actually interact with — has no estimate and is out of scope. If this feature is planned as a single release, the frontend work must be scoped immediately or the release date will slip. Additionally, vendor KYC onboarding is a process dependency, not a build dependency: the platform can ship on time but payouts will be blocked until each vendor completes Stripe's identity verification. This needs a vendor onboarding workflow and timeline that sits alongside the technical delivery — it is not currently in the plan.

---

### Feasibility Verdict

**Feasible with conditions**

The SA's proposed approach is sound, but the delivery plan has two gaps that must be resolved before sprint 1 begins: the frontend payment UI needs a scope and estimate, and the vendor KYC onboarding process needs an owner and a plan.
