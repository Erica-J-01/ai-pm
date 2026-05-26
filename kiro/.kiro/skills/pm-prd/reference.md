# Reference: Worked Example — PRD

Use this to calibrate output quality, especially for separating requirements from solutions and writing testable requirements.

---

## Raw Input

> "We're building a client reporting portal for finance clients. They currently email us for invoice updates and it takes too much time. Discovery found: clients can't find invoices, our ops team spends 2 hrs/month manually generating reports, Sarah (Finance lead) wants CSV export, clients want mobile access, IT weren't in discovery. Budget £80k, live by end of Q3. No delivery or table booking features."

---

## PRD — Client Reporting Portal

**Version:** 1.0 | **Date:** [Today] | **Author:** PM
**Status:** Draft
**Approvers:** Sarah (Finance), IT Lead, Sponsor

---

### 1. Purpose & Background

Finance clients currently request invoice updates by email, creating a manual workload for the ops team and causing delays for clients. This project will deliver a self-service portal giving clients direct access to their invoices and reports, eliminating the need for email-based requests.

---

### 2. Goals & Success Metrics

| Goal | Success Metric | Target |
|---|---|---|
| Reduce client email requests | Volume of invoice-related emails to ops | Down 70% within 60 days of go-live |
| Reduce ops manual effort | Hours spent generating/sending reports manually | From 2 hrs/month to under 15 mins |
| Client self-service adoption | % of clients logging in within 30 days of launch | > 80% |

---

### 3. Users & Stakeholders

| Role | Description | Primary need |
|---|---|---|
| Finance client | External client who needs access to their invoices and reports | Find and download their own invoices without contacting us |
| Ops team | Internal team currently generating and sending reports | Stop manual report generation, manage client access |
| Finance lead (Sarah) | Internal — owns reporting requirements | Monthly CSV export for GL reconciliation |
| IT lead | Not in discovery — [assumed] responsible for infrastructure | System stability, security, integration with existing stack |

---

### 4. Assumptions & Constraints

**Assumptions:**
- [assumed] IT lead will confirm infrastructure approach — was not present in discovery
- [assumed] Clients have internet access and a modern browser — mobile access is desired but not confirmed in scope
- [assumed] Existing invoice data is in a format that can be surfaced via a portal without significant transformation

**Constraints:**
- Must go live by end of Q3
- Budget is £80k
- No delivery or table booking features (explicitly out of scope)
- Must comply with GDPR — client data handling requires review

---

### 5. Functional Requirements

#### Client Access

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-01 | A finance client must be able to log in using an email and password to access their account | Must | MFA requirement to be confirmed with IT |
| FR-02 | A client must be able to view a list of all their invoices, sorted by date descending, so they can find recent invoices without scrolling | Must | |
| FR-03 | A client must be able to download any individual invoice as a PDF so they can save or forward it without requesting it from ops | Must | |
| FR-04 | A client must be able to filter their invoice list by date range and status (paid/unpaid) so they can find specific invoices quickly | Should | |
| FR-05 | A client must receive an email notification when a new invoice is available, so they don't need to log in to check | Should | |

#### Ops Admin

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-06 | An ops admin must be able to create and deactivate client accounts so access is managed centrally | Must | |
| FR-07 | An ops admin must be able to upload invoices to a client's account in bulk via CSV so monthly publishing takes under 15 minutes | Must | Replaces current 2hr manual process |
| FR-08 | A finance admin (Sarah) must be able to export a full monthly transaction report as CSV including invoice ID, client name, amount, status, and date, so she can reconcile against the GL without manual data entry | Must | Specific to Sarah's reconciliation workflow |

#### Reporting

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-09 | The system must maintain an audit log of all client logins and document downloads for the previous 12 months | Must | GDPR and audit requirement |
| FR-10 | An ops admin must be able to see which clients have not logged in within 30 days so they can follow up on adoption | Could | Nice to have for adoption tracking |

---

### 6. Non-Functional Requirements

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-01 | Performance | Page load time for invoice list | Under 2 seconds on a standard broadband connection |
| NFR-02 | Security | Authentication | Password + MFA for admin accounts; password only for client accounts (confirm with IT) |
| NFR-03 | Availability | System uptime during business hours | 99.5% Monday–Friday 8am–6pm |
| NFR-04 | Accessibility | Client-facing pages | WCAG 2.1 AA minimum |
| NFR-05 | Data | Invoice data retention | 7 years, per financial regulation |

---

### 7. Out of Scope

- Delivery tracking or logistics features
- Table booking functionality
- Integration with third-party accounting platforms (Xero, QuickBooks, etc.)
- Mobile native app — browser on mobile is in scope, native app is not
- Real-time invoice generation — invoices are uploaded by ops, not auto-generated

---

### 8. Dependencies

| Dependency | Type | Owner | Status |
|---|---|---|---|
| IT infrastructure confirmation | Technical | IT Lead | Pending — IT not in discovery |
| GDPR review of client data handling | Compliance | Legal / DPO | Not started |
| Existing invoice data format | Data | Ops | Assumed compatible — needs confirmation |

---

### 9. Open Questions

| # | Question | Who Can Answer | By When |
|---|---|---|---|
| Q1 | Does mobile access need to be native app or is browser-on-mobile sufficient? | Sponsor | Before design begins |
| Q2 | What authentication standard does IT require for external-facing systems? | IT Lead | Before FR-01 is finalised |
| Q3 | What is the existing invoice data format and can it be imported without transformation? | Ops + IT | Before FR-07 is estimated |
| Q4 | What does GDPR require for this type of client data portal? | Legal / DPO | Before build begins |

---

### 10. Sign-off

| Role | Name | Status | Date |
|---|---|---|---|
| Sponsor | | Approved / Changes requested | |
| Finance Lead | Sarah | Approved / Changes requested | |
| IT Lead | | Approved / Changes requested | |

---

## Why This PRD Is Good

**FR-07 and FR-08 are specific to real workflows.** FR-07 replaces a named 2-hour manual process with a specific target (under 15 minutes). FR-08 names Sarah, names her workflow (GL reconciliation), and lists exactly what columns the CSV must contain. A developer reading this knows exactly what to build. A tester knows exactly what to verify.

**IT absence is treated as a dependency risk, not ignored.** IT wasn't in discovery. Rather than assuming they'll be fine, the PRD lists three dependency items that require IT input and flags them in Open Questions. The sign-off table includes IT Lead — they must approve before build begins.

**Out of scope is specific.** Five named items, including the nuance that mobile browser is in scope but native app is not. This prevents the conversation mid-build.

**Open questions has 4 items.** A PRD with zero open questions after one round of discovery is almost certainly missing something. Real requirements always surface things that need a decision before build.

**NFRs have numbers.** "Under 2 seconds", "99.5% uptime", "WCAG 2.1 AA" — not "fast", "reliable", "accessible". Non-functional requirements without targets cannot be tested.