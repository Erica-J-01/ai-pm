# Reference: Worked Example

Use this to calibrate output quality — especially for theme grouping, deliverable descriptions, and the Definition of Done checklist.

---

## Input

> Sprint 2 — Reporting & Notifications
> Goal: Give finance admins self-service access to monthly reports and notify clients automatically when new invoices are available.
> Dates: 2 June – 13 June 2026
> Jira board: [PROJECT-board-url]
>
> Team:
> - Priya Sharma — Frontend Engineer — PROJECT-44, PROJECT-51
> - Tom Ellis — Backend Engineer — PROJECT-45, PROJECT-46, PROJECT-52
> - Mia Chen — QA — PROJECT-53
>
> Tickets:
> - PROJECT-44: Build monthly report export UI (CSV download button, date range filter)
> - PROJECT-45: Implement report generation API endpoint
> - PROJECT-46: Schedule monthly report generation job (runs 1st of each month)
> - PROJECT-51: Invoice notification email template and send trigger
> - PROJECT-52: Notification preferences API (client opt-in/opt-out)
> - PROJECT-53: QA — end-to-end test plan for reporting and notifications
>
> Out of scope: PDF export, push notifications, in-app notification centre

---

## Correct Output

---

Prepared By: [PM Name]
Date: 2026-06-02
Link to the Jira Board: [PROJECT-board-url]

## Sprint Goal

> Give finance admins self-service access to monthly reports and notify clients automatically when new invoices are available.

---

## Overview

Sprint 2 delivers the reporting and notification foundations of the client portal. Finance admins will be able to export monthly transaction reports as CSV without manual intervention, and clients will receive automated email notifications when new invoices are published. The backend scheduling job introduced this sprint will run automatically on the first of each month, removing the current 2-hour manual reporting process. PDF export and in-app notifications are deferred to Sprint 3.

---

## Sprint Timeline

* Sprint Start: 2026-06-02
* Sprint End: 2026-06-13

---

## Sprint Team

| Team Member | Role | Assigned Tickets |
| --- | --- | --- |
| Priya Sharma | Frontend Engineer | [PROJECT-44](url), [PROJECT-51](url) |
| Tom Ellis | Backend Engineer | [PROJECT-45](url), [PROJECT-46](url), [PROJECT-52](url) |
| Mia Chen | QA Engineer | [PROJECT-53](url) |

---

## Deliverables by Theme

### 1. Self-Service Reporting

Enables finance admins to export monthly transaction data without raising a manual request.

| Ticket | Deliverable | Description | Assignee |
| --- | --- | --- | --- |
| [PROJECT-44](url) | Report Export UI | Date range filter and CSV download button on the admin reports page; allows finance admins to select a month and download transaction data in one click. | Priya Sharma |
| [PROJECT-45](url) | Report Generation API | Backend endpoint that accepts a date range and returns a formatted CSV of all transactions; consumed by the export UI. | Tom Ellis |
| [PROJECT-46](url) | Monthly Report Scheduler | Scheduled job that automatically generates and stores the monthly report on the first of each month; removes the current manual process. | Tom Ellis |

---

### 2. Client Notifications

Keeps clients informed when new invoices are available without requiring them to log in to check.

| Ticket | Deliverable | Description | Assignee |
| --- | --- | --- | --- |
| [PROJECT-51](url) | Invoice Notification Email | Branded email template and send trigger that fires when an invoice is published to a client's account; includes invoice summary and portal link. | Priya Sharma |
| [PROJECT-52](url) | Notification Preferences API | Backend endpoint allowing clients to opt in or out of email notifications; preference stored per account and respected by the notification trigger. | Tom Ellis |

---

### 3. Quality Assurance

End-to-end coverage across reporting and notification flows before sprint close.

| Ticket | Deliverable | Description | Assignee |
| --- | --- | --- | --- |
| [PROJECT-53](url) | QA Test Plan & Execution | End-to-end test plan covering report generation, CSV export, email delivery, and notification opt-out; executed against staging before sprint review. | Mia Chen |

---

## Out of Scope — Sprint 2

The following are explicitly excluded from this sprint and will be addressed in subsequent sprints:

* PDF export of monthly reports — deferred to Sprint 3 ([PROJECT-?])
* Push notifications — deferred to Sprint 3
* In-app notification centre — deferred to Sprint 3
* Report filtering by category or client — not yet prioritised

---

## Definition of Done

Sprint 2 is considered complete when all of the following conditions are met:

- [ ] Finance admin can filter by month and download a CSV report from the portal.
- [ ] CSV report contains all transactions for the selected period with correct formatting.
- [ ] Monthly report scheduler runs successfully in the staging environment.
- [ ] Invoice notification email sends correctly when a new invoice is published.
- [ ] Clients can opt out of email notifications and no further emails are sent to opted-out accounts.
- [ ] QA test plan executed and all critical/high defects resolved.
- [ ] All code reviewed and merged to dev branch.
- [ ] No known defects outstanding at sprint close.

---

## Why This Output Is Good

**Themes are business-readable, not technical.** "Self-Service Reporting" and "Client Notifications" — not "Backend API Layer" and "Frontend Components." A sponsor reading this understands what was built.

**The scheduler deliverable calls out the business benefit explicitly.** "Removes the current manual process" — not just "scheduled job configured." A stakeholder reading this knows why it matters.

**Out of scope is specific.** Four named items with target sprints where known. Each one is a conversation that happened upfront rather than a surprise in Sprint 3.

**Definition of Done is testable.** Every item is binary — it either passes or it doesn't. "Finance admin can filter by month and download a CSV" can be verified in two minutes. "Reporting is complete" cannot.
