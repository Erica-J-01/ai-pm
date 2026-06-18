/**
 * Auto-generated from skills/<id>/intake.md - do not edit by hand.
 * Run `node scripts/generateSkillPrompts.mjs` to regenerate.
 */

export interface IntakeQuestion {
  id: string;
  title: string;
  prompt: string;
  suggested: string[];
  conditional: boolean;
  condition: string;
  gate: boolean;
}

export const INTAKE_QUESTIONS: Record<string, IntakeQuestion[]> = {
  "prd": [
    {
      "id": "Q1",
      "title": "Document Type",
      "prompt": "Should this be a PRD (for your engineering and product team) or a BRD (for business stakeholders and sign-off)?",
      "suggested": [
        "PRD - engineering and product audience",
        "BRD - business stakeholders, formal sign-off",
        "Not sure - help me decide"
      ],
      "conditional": false,
      "condition": "always ask first",
      "gate": false
    },
    {
      "id": "Q2",
      "title": "Project Context",
      "prompt": "What best describes this piece of work?",
      "suggested": [
        "Net new product or platform",
        "New feature on an existing product",
        "MVP - first shippable version of something new",
        "Enhancement or iteration on an existing feature",
        "Integration, migration, or infrastructure change"
      ],
      "conditional": false,
      "condition": "always ask",
      "gate": false
    },
    {
      "id": "Q3",
      "title": "Primary Users",
      "prompt": "Who are the primary users of what you're building?",
      "suggested": [
        "External end customers",
        "Internal staff or operations team",
        "Both external customers and internal staff",
        "Let me describe them"
      ],
      "conditional": false,
      "condition": "always ask",
      "gate": false
    },
    {
      "id": "Q4",
      "title": "Success Metrics",
      "prompt": "Do you have specific targets for what success looks like - conversion rates, load times, adoption numbers, revenue goals? Anything measurable?",
      "suggested": [
        "Yes - I'll share them now",
        "Not defined yet, but I can estimate reasonable targets",
        "No targets have been set - leave them as TBD for now"
      ],
      "conditional": false,
      "condition": "always ask",
      "gate": false
    },
    {
      "id": "Q5",
      "title": "Hard Constraints",
      "prompt": "Are there hard constraints that shape what gets built - things that are fixed and cannot change?",
      "suggested": [],
      "conditional": false,
      "condition": "always ask",
      "gate": false
    },
    {
      "id": "Q5b",
      "title": "NFR Targets",
      "prompt": "A few quick NFR targets - answer what you know, skip what you don't:",
      "suggested": [],
      "conditional": false,
      "condition": "always ask, immediately after Q5",
      "gate": false
    },
    {
      "id": "Q6",
      "title": "Scope Boundaries",
      "prompt": "Are there features or capabilities that are definitely not in scope for this phase - things that might come up but should be parked for later?",
      "suggested": [
        "Yes - I'll list them",
        "Not formally decided yet",
        "Out-of-scope items are already covered in what I shared"
      ],
      "conditional": true,
      "condition": "ask if: `no-out-of-scope` signal detected",
      "gate": false
    },
    {
      "id": "Q7",
      "title": "Discovery Status",
      "prompt": "Has discovery been completed for this project? I ask because requirements written without discovery findings tend to change significantly once users are consulted.",
      "suggested": [
        "Yes - the findings are in what I shared",
        "Partially - some discovery has been done, and the rest is based on assumptions",
        "No discovery done - we're going straight to requirements",
        "Discovery is not needed for this type of work (e.g. infrastructure, internal tooling)"
      ],
      "conditional": true,
      "condition": "ask if: `no-discovery` signal detected",
      "gate": false
    },
    {
      "id": "Q8",
      "title": "Input Currency",
      "prompt": "The input document looks like it may have been written a while ago. Is this still the current agreed scope, or have things changed since it was written?",
      "suggested": [
        "Still current and agreed",
        "Some things have changed - I'll note the differences",
        "Significant changes - let me describe the current state"
      ],
      "conditional": true,
      "condition": "ask if: `stale-input` signal detected",
      "gate": false
    },
    {
      "id": "Q9",
      "title": "Regulatory Context",
      "prompt": "Which regulatory frameworks apply to this product? I want to make sure compliance requirements appear as constraints and NFRs, not assumptions.",
      "suggested": [
        "FCA / Consumer Duty (UK financial services)",
        "GDPR / UK GDPR (data privacy)",
        "PCI DSS (payments and card data)",
        "Multiple - I'll list them",
        "Not regulated, the signals were coincidental"
      ],
      "conditional": true,
      "condition": "ask if: `regulated` signal detected",
      "gate": false
    },
    {
      "id": "Q9b",
      "title": "Localisation Scope",
      "prompt": "The product appears to target a specific locale. Is localisation - multiple languages, regional date/currency formats, right-to-left support - in scope now, planned for a future phase, or out of scope entirely?",
      "suggested": [
        "Single locale only (e.g. UK English, USD) - state it as a constraint, note future scope",
        "Multi-locale is in scope for this phase - I'll specify which",
        "Not yet decided"
      ],
      "conditional": true,
      "condition": "ask if: `locale-specific` signal detected",
      "gate": false
    },
    {
      "id": "Q10",
      "title": "Open Risks and Gaps",
      "prompt": "Last question before I write the PRD - is there anything critical that affects the requirements which isn't covered in what you've shared? Team concerns, known blockers, design decisions still open, anything I should factor in?",
      "suggested": [
        "No - everything important is in the input",
        "Yes - I'll add it now",
        "There are open questions but nothing that blocks writing requirements"
      ],
      "conditional": false,
      "condition": "always ask last - gate question",
      "gate": true
    }
  ],
  "risk-scan": [
    {
      "id": "Q1",
      "title": "Current Phase and Status",
      "prompt": "First, let's make sure I have the current picture. What phase is the project in right now, and roughly where are you within it?",
      "suggested": [
        "Pre-kickoff - not started yet",
        "Phase 0 / Foundation - underway",
        "Phase 1 / MVP - in active development",
        "Phase 1 / MVP - near completion or in sign-off",
        "Phase 2+ - later phase",
        "Post-launch - live and in operations",
        "Other - I'll describe"
      ],
      "conditional": false,
      "condition": "always ask",
      "gate": false
    },
    {
      "id": "Q2",
      "title": "Depth Preference",
      "prompt": "How thorough does this risk scan need to be?",
      "suggested": [
        "Quick scan - give me the top 3-5 risks fast",
        "Standard review - full risk register, key decisions, not assessed areas",
        "Thorough - board-level depth, prioritisation reasoning, 8-12 risks"
      ],
      "conditional": false,
      "condition": "always ask",
      "gate": false
    },
    {
      "id": "Q3",
      "title": "What Has Changed Since the Document Was Written",
      "prompt": "The document is dated [X] but today is [Y]. What's changed since it was written?",
      "suggested": [
        "Nothing significant - the document still reflects current reality",
        "Timeline has shifted - we're behind / ahead of the original plan",
        "Scope has changed - features added, removed, or reprioritised",
        "Team has changed - joiners, leavers, or role changes",
        "Key decisions have been made that aren't in the document",
        "Multiple things have changed - I'll describe"
      ],
      "conditional": true,
      "condition": "ask if: date gap detected",
      "gate": false
    },
    {
      "id": "Q4",
      "title": "Delivery Status Against Plan",
      "prompt": "Which deliverables or milestones have been completed, and is the project on schedule?",
      "suggested": [
        "On track - all milestones hit as planned",
        "Slightly behind - 1 to 2 weeks",
        "Significantly behind - 3 or more weeks",
        "Ahead of schedule",
        "Mixed - some on track, some delayed - I'll describe",
        "I don't have a clear view right now"
      ],
      "conditional": true,
      "condition": "ask if: date gap detected",
      "gate": false
    },
    {
      "id": "Q5",
      "title": "External Dependency Status",
      "prompt": "The document names [dependency name] as a dependency. What's the current status?",
      "suggested": [
        "Resolved - access / approval confirmed",
        "In progress - actively being worked, expected by [date]",
        "Blocked - no progress, no clear resolution date",
        "Not yet started",
        "Unknown - I'll need to check"
      ],
      "conditional": true,
      "condition": "ask if: named external dependencies detected",
      "gate": false
    },
    {
      "id": "Q6",
      "title": "Named Risks From the Document",
      "prompt": "The document flags [risk name / area] as a known risk. Has it materialised, been mitigated, or is it still open?",
      "suggested": [
        "Mitigated - it was resolved",
        "Still open - it hasn't materialised yet but remains a concern",
        "It has materialised - and here's the impact: [user describes]",
        "Partially mitigated - reduced but not fully resolved",
        "Unknown - I'll need to check"
      ],
      "conditional": true,
      "condition": "ask if: risks explicitly named in source",
      "gate": false
    },
    {
      "id": "Q7",
      "title": "Budget and Burn Rate",
      "prompt": "What's the current spend against the original estimate?",
      "suggested": [
        "Within budget - burn rate is on track",
        "Slightly over - less than 10% above estimate",
        "Significantly over - more than 10% above estimate",
        "Under budget - spending less than estimated",
        "Unknown - I don't have visibility on this"
      ],
      "conditional": true,
      "condition": "ask if: T&M commercial model detected",
      "gate": false
    },
    {
      "id": "Q8",
      "title": "Phase Status",
      "prompt": "The document covers more than one phase. Are all phases still active, or has one closed or been paused?",
      "suggested": [
        "All phases active and running to plan",
        "Earlier phase closed - later phase now active",
        "One phase has been paused",
        "Phases are running concurrently - both in progress",
        "I'll describe the current state"
      ],
      "conditional": true,
      "condition": "ask if: multiple phases in scope",
      "gate": false
    },
    {
      "id": "Q9",
      "title": "Team Changes",
      "prompt": "Has the team changed since the document was written?",
      "suggested": [
        "No change - same team as documented",
        "Someone has left and not been replaced",
        "Someone has left and been replaced",
        "New people have joined beyond the original plan",
        "Roles or responsibilities have shifted"
      ],
      "conditional": true,
      "condition": "ask if: team composition stated in document",
      "gate": false
    },
    {
      "id": "Q10",
      "title": "Compliance Sign-Off Status",
      "prompt": "The work involves [FCA / GDPR / PCI / other] compliance. What's the current sign-off status?",
      "suggested": [
        "Signed off - legal / compliance review complete",
        "In progress - review underway, expected by [date]",
        "Not started - hasn't been initiated yet",
        "Blocked - waiting on a named reviewer or decision",
        "Unknown - I'll need to check"
      ],
      "conditional": true,
      "condition": "ask if: compliance / regulatory requirements detected",
      "gate": false
    },
    {
      "id": "Q11",
      "title": "Integration Status",
      "prompt": "What is the current status of the [integration name] integration?",
      "suggested": [
        "Complete - integrated and tested end-to-end",
        "In progress - being built or tested now",
        "Not started - not yet begun",
        "Blocked - waiting on access, credentials, or a third party",
        "Descoped - no longer in plan"
      ],
      "conditional": true,
      "condition": "ask if: third-party integrations detected",
      "gate": false
    },
    {
      "id": "Q12",
      "title": "UAT Readiness",
      "prompt": "Is UAT planned, and do you have confirmed resource and participants lined up to run it?",
      "suggested": [
        "Yes - UAT plan exists, resource confirmed, dates locked",
        "Partially - plan exists but participants or dates not yet confirmed",
        "Not yet planned - UAT approach still to be defined",
        "UAT is being handled by the delivery team, not end users",
        "Unknown - I'll need to check"
      ],
      "conditional": true,
      "condition": "ask if: project is in Phase 1 active development or near completion",
      "gate": false
    },
    {
      "id": "Q13",
      "title": "Open Risk Question",
      "prompt": "Finally - are there any risks already on your radar that you'd like me to factor in? These could be things not in the document, early warning signals from the team, or concerns you haven't been able to formally flag yet.",
      "suggested": [
        "No - nothing beyond what's in the document",
        "Yes - I'll describe them",
        "There are a few things I'm watching but nothing confirmed yet - I'll mention them"
      ],
      "conditional": false,
      "condition": "always ask last",
      "gate": true
    }
  ]
};
