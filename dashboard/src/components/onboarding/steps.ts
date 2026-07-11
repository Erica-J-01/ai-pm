/** Structured onboarding schema: scalars, tag inputs, list rows, and epic groups. */

/** Skills that hold a collection of records (multiple meetings, sprints, etc.). */
export const MULTI_RECORD_SKILLS: string[] = [
  "meeting-notes", "tech-review", "retrospective", "stakeholder-update",
  "decision-log", "release-checklist", "sprint-report", "sprint-planning",
];
/** Multi-record skills whose records can be exported to Word/PDF from the list. */
export const EXPORTABLE_SKILLS: string[] = [
  "meeting-notes", "tech-review", "retrospective", "stakeholder-update", "decision-log",
];
/** Singular noun + default record title prefix per multi-record skill. */
export const RECORD_NOUN: Record<string, string> = {
  "meeting-notes": "Meeting",
  "tech-review": "Tech review",
  retrospective: "Retro",
  "stakeholder-update": "Update",
  "decision-log": "Decision log",
  "release-checklist": "Release",
  "sprint-report": "Sprint report",
  "sprint-planning": "Sprint plan",
};

export type Row = Record<string, string>;
export interface EpicGroup { name: string; stories: Row[] }
export type StepValues = Record<string, string | string[] | Row[] | EpicGroup[]>;
export type OnbData = Record<string, StepValues>;

export interface ScalarField {
  name: string;
  label: string;
  kind: "text" | "textarea" | "select" | "tags";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /** Needs a person to fill it in - not auto-filled from other artefacts. */
  human?: boolean;
  /** Derived from other artefacts and refreshed on open - hidden from the editor. */
  auto?: boolean;
}
export interface ListField {
  name: string;
  label: string;
  kind: "list";
  addLabel: string;
  required?: boolean;
  /** Needs a person to fill it in - not auto-filled from other artefacts. */
  human?: boolean;
  /** Derived from other artefacts and refreshed on open - hidden from the editor. */
  auto?: boolean;
  itemFields: ScalarField[];
}
export interface EpicsField {
  name: string;
  label: string;
  kind: "epics";
  required?: boolean;
  /** Derived from other artefacts and refreshed on open - hidden from the editor. */
  auto?: boolean;
  storyFields: ScalarField[];
}
export type StepField = ScalarField | ListField | EpicsField;

export interface OnbStep {
  id: string;
  title: string;
  intro: string;
  fields: StepField[];
}

const HML = ["H", "M", "L"];
const POINTS = ["1", "2", "3", "5", "8", "13", "21"]; // 7 selections
const STORY_STATUS = ["To Do", "In Progress", "Done"];
const PRIORITY = ["P0", "P1", "P2"];
const RISK_PRIORITY = ["Act now", "Monitor", "Contingency", "Log"];
const MOSCOW = ["Must", "Should", "Could"];
const CHECK_STATUS = ["PASS", "RISK", "FAIL", "UNCONFIRMED", "N/A"];
const CATEGORIES = [
  "Feature Readiness", "Testing", "Operational Readiness",
  "Communications", "Dependencies", "Approvals", "Post-Release Readiness", "Hotfix",
];
const RAG = ["green", "amber", "red"];
const WEEKS = ["4", "6", "8", "10", "12"];
const WEEKNUM = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const DECISION_AREA = ["Scope", "Timeline", "Budget", "Architecture", "Team", "Process", "Other"];
const CHANGE_STATUS = ["Proposed", "Under Review", "Approved", "Rejected", "Superseded"];
const RISK_CATEGORY = ["Delivery", "Technical", "Stakeholder", "Business"];
const RISK_RESPONSE = ["Mitigate", "Transfer", "Avoid", "Accept", "Escalate"];
const RISK_PROXIMITY = ["Week 1-2", "Month 1", "Month 2-3", "Later"];
const DETECT = ["Easy", "Moderate", "Hard"];
const VELOCITY = ["Fast", "Medium", "Slow"];
const RELEASE_TYPE = ["planned", "hotfix", "phased", "feature-flag"];
const UPDATE_STATUS = ["On track", "At risk", "Off track"];
const SPRINT_MODE = ["In flight", "Closed"];
const RISK_LEVEL = ["Low", "Medium", "High"];
const GOAL_STATUS = ["On track", "At risk", "Missed", "Not stated"];
const FEASIBILITY_VERDICT = ["Feasible", "Feasible with conditions", "Not feasible as proposed", "Cannot assess - missing information"];
const ROADMAP_BUCKET = ["Now", "Next", "Later"];
const RM_CONFIDENCE = ["High", "Medium", "Low"];
const RM_SIZE = ["S", "M", "L"];
const COMMERCIAL_MODEL = ["fixed-price", "time-and-materials", "retainer"];

export const STEPS: OnbStep[] = [
  { id: "triage", title: "Triage", intro: "Structure the raw request.", fields: [
    { name: "requester", label: "Requester & source", kind: "textarea", placeholder: "Who sent it, their role, the channel, date. Note when they relay someone else's authority." },
    { name: "requestSummary", label: "Request summary", kind: "textarea", required: true },
    { name: "businessGoal", label: "Likely business goal", kind: "textarea", required: true },
    { name: "stakeholderNeed", label: "Primary user / stakeholder need", kind: "textarea" },
    { name: "whatIsClear", label: "What is clear", kind: "list", addLabel: "Add point", itemFields: [
      { name: "point", label: "Point", kind: "text", placeholder: "Something we already know" },
    ]},
    { name: "missingInfo", label: "Missing information", kind: "list", addLabel: "Add question", itemFields: [
      { name: "question", label: "Question", kind: "text", placeholder: "Something to clarify" },
      { name: "audience", label: "For", kind: "select", options: ["Ask requester", "Check internally"] },
    ]},
    { name: "concerns", label: "Risks / concerns", kind: "list", addLabel: "Add concern", itemFields: [
      { name: "point", label: "Concern", kind: "text" },
    ]},
    { name: "urgency", label: "Urgency", kind: "textarea", placeholder: "The stated deadline and whether it reads as real or negotiable." },
    { name: "impact", label: "Impact on current work", kind: "select", options: [
      "New scope", "Change request against in-flight SOW", "Duplicate of existing scope", "Standalone", "Not checked - no project context",
    ]},
    { name: "classification", label: "Intake classification", kind: "select", options: [
      "Ready for Discovery", "Needs Clarification", "Likely Change Request", "Needs Technical Review", "Low Priority / Unclear Value",
    ]},
    { name: "nextStep", label: "Recommended next step", kind: "textarea" },
  ]},
  { id: "risk-scan", title: "Risk Scan", intro: "List the early risks. Likelihood and impact build the matrix.", fields: [
    { name: "risks", label: "Risks", kind: "list", addLabel: "Add risk", required: true, itemFields: [
      { name: "risk", label: "Risk", kind: "text", required: true, placeholder: "What could go wrong" },
      { name: "category", label: "Category", kind: "select", options: RISK_CATEGORY },
      { name: "likelihood", label: "Likelihood", kind: "select", options: HML },
      { name: "impact", label: "Impact", kind: "select", options: HML },
      { name: "detectability", label: "Detect", kind: "select", options: DETECT },
      { name: "velocity", label: "Velocity", kind: "select", options: VELOCITY },
      { name: "priority", label: "Priority", kind: "select", options: RISK_PRIORITY },
      { name: "response", label: "Response", kind: "select", options: RISK_RESPONSE },
      { name: "proximity", label: "Proximity", kind: "select", options: RISK_PROXIMITY },
      { name: "owner", label: "Owner", kind: "text", placeholder: "Who owns it" },
      { name: "triggerSignal", label: "Trigger signal", kind: "text", placeholder: "Observable sign it is materialising (required if Detect = Hard)" },
    ]},
  ]},
  { id: "charter", title: "Charter", intro: "Formalise the project.", fields: [
    { name: "purpose", label: "Purpose", kind: "textarea", required: true, placeholder: "Why this project exists" },
    { name: "sponsor", label: "Sponsor", kind: "text", required: true },
    { name: "objectives", label: "Objectives", kind: "list", addLabel: "Add objective", required: true, itemFields: [
      { name: "objective", label: "Objective", kind: "text", placeholder: "A measurable outcome" },
    ]},
    { name: "inScope", label: "In scope", kind: "list", addLabel: "Add scope item", itemFields: [
      { name: "item", label: "In scope", kind: "text" },
    ]},
    { name: "outOfScope", label: "Out of scope", kind: "list", addLabel: "Add exclusion", itemFields: [
      { name: "item", label: "Excluded", kind: "text", placeholder: "What we are NOT doing" },
    ]},
    { name: "deliverables", label: "Deliverables", kind: "list", addLabel: "Add deliverable", itemFields: [
      { name: "deliverable", label: "Deliverable", kind: "text" },
      { name: "due", label: "Due", kind: "text" },
    ]},
    { name: "governance", label: "Governance", kind: "list", addLabel: "Add governance item", itemFields: [
      { name: "item", label: "Item", kind: "text", placeholder: "e.g. Decision authority" },
      { name: "detail", label: "Detail", kind: "text", placeholder: "Who decides / how changes are approved / reporting cadence" },
    ]},
    { name: "milestones", label: "Timeline / milestones", kind: "list", addLabel: "Add milestone", itemFields: [
      { name: "milestone", label: "Milestone", kind: "text" },
      { name: "date", label: "Target date", kind: "text" },
    ]},
    { name: "budget", label: "Budget", kind: "list", addLabel: "Add line", itemFields: [
      { name: "item", label: "Item", kind: "text" },
      { name: "amount", label: "Amount", kind: "text" },
    ]},
    { name: "risks", label: "Top risks", kind: "list", addLabel: "Add risk", itemFields: [
      { name: "risk", label: "Risk", kind: "text" },
      { name: "likelihood", label: "Likelihood", kind: "select", options: HML },
      { name: "impact", label: "Impact", kind: "select", options: HML },
      { name: "response", label: "Response", kind: "text" },
    ]},
    { name: "constraints", label: "Constraints", kind: "list", addLabel: "Add constraint", itemFields: [
      { name: "constraint", label: "Constraint", kind: "text", placeholder: "Fixed - cannot change" },
    ]},
    { name: "assumptions", label: "Assumptions", kind: "list", addLabel: "Add assumption", itemFields: [
      { name: "assumption", label: "Assumption", kind: "text", placeholder: "Believed true - must be validated" },
    ]},
    { name: "clientDependencies", label: "Client-side dependencies", kind: "list", addLabel: "Add dependency", itemFields: [
      { name: "dependency", label: "Dependency", kind: "text", placeholder: "What the client must supply" },
      { name: "neededBy", label: "Needed by", kind: "text" },
      { name: "owner", label: "Owner", kind: "text", placeholder: "Client-side role" },
    ]},
    { name: "approvals", label: "Approvals", kind: "list", addLabel: "Add approver", itemFields: [
      { name: "role", label: "Role", kind: "text" },
      { name: "name", label: "Name", kind: "text" },
    ]},
  ]},
  { id: "discovery", title: "Discovery", intro: "Frame the problem and what must be learned.", fields: [
    { name: "problem", label: "The real problem", kind: "textarea", required: true },
    { name: "success", label: "What success looks like", kind: "textarea" },
    { name: "affected", label: "Who is affected", kind: "list", addLabel: "Add stakeholder", itemFields: [
      { name: "stakeholder", label: "Stakeholder", kind: "text" },
      { name: "pain", label: "Current pain", kind: "text" },
      { name: "impact", label: "Impact", kind: "text", placeholder: "Time, money, or quality cost" },
    ]},
    { name: "findings", label: "Key findings", kind: "list", addLabel: "Add finding", itemFields: [
      { name: "finding", label: "Finding", kind: "text" },
      { name: "source", label: "Source", kind: "text", placeholder: "Who said it, or 'unattributed'" },
      { name: "confidence", label: "Confidence", kind: "select", options: ["High", "Medium", "Low"] },
    ]},
    { name: "conflicts", label: "Conflicts / disagreements", kind: "list", addLabel: "Add conflict", itemFields: [
      { name: "conflict", label: "Conflict", kind: "text" },
    ]},
    { name: "unknowns", label: "Still unknown", kind: "list", addLabel: "Add unknown", required: true, itemFields: [
      { name: "unknown", label: "Unknown", kind: "text", placeholder: "A question to resolve" },
      { name: "resolve", label: "How to resolve", kind: "text" },
    ]},
    { name: "nextSteps", label: "Recommended next steps", kind: "list", addLabel: "Add next step", itemFields: [
      { name: "action", label: "Action", kind: "text" },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "by", label: "By when", kind: "text" },
    ]},
    { name: "readiness", label: "Readiness verdict", kind: "textarea", placeholder: "Ready or not ready for charter and requirements - if not, the blocking items" },
    { name: "attendees", label: "Attendees", kind: "tags", placeholder: "Type a name and press Enter" },
  ]},
  { id: "prd", title: "PRD", intro: "Document the requirements.", fields: [
    { name: "scopeChanges", label: "Scope changes from source", kind: "list", addLabel: "Add scope change", itemFields: [
      { name: "change", label: "Change", kind: "text" },
      { name: "original", label: "Original (source says)", kind: "text" },
      { name: "updated", label: "Updated (PRD reflects)", kind: "text" },
      { name: "reason", label: "Reason / confirmed by", kind: "text" },
    ]},
    { name: "background", label: "Purpose & background", kind: "textarea", required: true },
    { name: "goals", label: "Goals & success metrics", kind: "list", addLabel: "Add goal", required: true, itemFields: [
      { name: "goal", label: "Goal", kind: "text" },
      { name: "metric", label: "Metric", kind: "text" },
      { name: "baseline", label: "Baseline", kind: "text", placeholder: "Current value, or blank if unknown" },
      { name: "target", label: "Target", kind: "text" },
    ]},
    { name: "users", label: "Users & stakeholders", kind: "list", addLabel: "Add user", itemFields: [
      { name: "role", label: "Role", kind: "text" },
      { name: "who", label: "Who they are", kind: "text" },
      { name: "need", label: "Primary need", kind: "text" },
    ]},
    { name: "assumptions", label: "Assumptions (validate before build)", kind: "list", addLabel: "Add assumption", itemFields: [
      { name: "assumption", label: "Assumption", kind: "text" },
    ]},
    { name: "constraints", label: "Constraints (fixed)", kind: "list", addLabel: "Add constraint", itemFields: [
      { name: "constraint", label: "Constraint", kind: "text" },
    ]},
    { name: "journeys", label: "Key user journeys", kind: "list", addLabel: "Add journey", itemFields: [
      { name: "journey", label: "Journey", kind: "text", placeholder: "e.g. Configure recipients" },
      { name: "steps", label: "Steps", kind: "textarea", placeholder: "Numbered plain-prose steps, one per line" },
    ]},
    { name: "functional", label: "Functional requirements", kind: "list", addLabel: "Add requirement", required: true, itemFields: [
      { name: "requirement", label: "Requirement", kind: "text" },
      { name: "priority", label: "Priority", kind: "select", options: MOSCOW },
      { name: "notes", label: "Notes", kind: "text" },
    ]},
    { name: "nonFunctional", label: "Non-functional requirements", kind: "list", addLabel: "Add NFR", itemFields: [
      { name: "category", label: "Category", kind: "text" },
      { name: "requirement", label: "Requirement", kind: "text" },
      { name: "target", label: "Target", kind: "text", placeholder: "[NEEDS TARGET] if unknown" },
    ]},
    { name: "outOfScope", label: "Out of scope", kind: "list", addLabel: "Add exclusion", itemFields: [
      { name: "item", label: "Excluded", kind: "text" },
    ]},
    { name: "dependencies", label: "Dependencies", kind: "list", addLabel: "Add dependency", itemFields: [
      { name: "dependency", label: "Dependency", kind: "text" },
      { name: "type", label: "Type", kind: "text" },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "status", label: "Status", kind: "select", options: ["Confirmed", "Pending", "Blocked"] },
    ]},
    { name: "openQuestions", label: "Open questions", kind: "list", addLabel: "Add question", itemFields: [
      { name: "question", label: "Question", kind: "text" },
      { name: "owner", label: "Who can answer", kind: "text" },
      { name: "by", label: "By when", kind: "text" },
    ]},
    { name: "signOff", label: "Sign-off", kind: "list", addLabel: "Add approver", itemFields: [
      { name: "role", label: "Role", kind: "text" },
      { name: "name", label: "Name", kind: "text" },
      { name: "status", label: "Status", kind: "text" },
      { name: "date", label: "Date", kind: "text" },
    ]},
  ]},
  { id: "stories", title: "User Stories", intro: "Add epics. Each holds its own stories.", fields: [
    { name: "epics", label: "Epics", kind: "epics", required: true, storyFields: [
      { name: "title", label: "Story title", kind: "text", placeholder: "Short goal" },
      { name: "priority", label: "Priority", kind: "select", options: MOSCOW },
      { name: "linkedRequirement", label: "Linked requirement", kind: "text", placeholder: "e.g. FR-04, or None" },
      { name: "asA", label: "As a", kind: "text", placeholder: "persona" },
      { name: "iWant", label: "I want to", kind: "text", placeholder: "goal" },
      { name: "soThat", label: "So that", kind: "text", placeholder: "outcome" },
      { name: "points", label: "Points (indicative)", kind: "select", options: [...POINTS, "TBD"] },
      { name: "status", label: "Status", kind: "select", options: STORY_STATUS },
      { name: "criteria", label: "Acceptance criteria (one per line)", kind: "textarea", placeholder: "Given a payment fails, when the event arrives, then an email is sent within 60s" },
    ]},
  ]},
  { id: "sprint-sow", title: "Sprint SOW", intro: "Scope the sprint as a statement of work.", fields: [
    { name: "preparedBy", label: "Prepared by", kind: "text", placeholder: "PM name" },
    { name: "version", label: "Version", kind: "text", placeholder: "1.0" },
    { name: "status", label: "Status", kind: "select", options: ["Draft", "Approved"] },
    { name: "jiraBoard", label: "Link to the Jira board", kind: "text", placeholder: "https://..." },
    { name: "sprintGoal", label: "Sprint goal", kind: "textarea", required: true },
    { name: "overview", label: "Overview", kind: "textarea" },
    { name: "startDate", label: "Sprint start", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "endDate", label: "Sprint end", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "team", label: "Sprint team", kind: "list", addLabel: "Add member", itemFields: [
      { name: "member", label: "Team member", kind: "text" },
      { name: "role", label: "Role", kind: "text" },
      { name: "tickets", label: "Assigned tickets", kind: "text" },
    ]},
    { name: "deliverables", label: "Deliverables by theme", kind: "list", addLabel: "Add deliverable", required: true, itemFields: [
      { name: "theme", label: "Theme", kind: "text" },
      { name: "ticket", label: "Ticket", kind: "text" },
      { name: "deliverable", label: "Deliverable", kind: "text" },
      { name: "description", label: "Description", kind: "text" },
      { name: "assignee", label: "Assignee", kind: "text" },
      { name: "estimate", label: "Estimate", kind: "text" },
    ]},
    { name: "outOfScope", label: "Out of scope", kind: "list", addLabel: "Add exclusion", itemFields: [
      { name: "item", label: "Excluded", kind: "text" },
    ]},
    { name: "dependencies", label: "Dependencies & assumptions", kind: "list", addLabel: "Add dependency", itemFields: [
      { name: "item", label: "Dependency or assumption", kind: "text" },
    ]},
    { name: "dod", label: "Definition of Done", kind: "list", addLabel: "Add condition", itemFields: [
      { name: "condition", label: "Condition", kind: "text" },
    ]},
    { name: "approver", label: "Approval", kind: "text", placeholder: "Approver name, or leave blank for Pending" },
  ]},
  { id: "sprint-planning", title: "Sprint Planning", intro: "Per-person capacity. Committed load is P0 + P1.", fields: [
    { name: "sprintName", label: "Sprint name", kind: "text", placeholder: "Sprint 1 - Notifications" },
    { name: "sprintGoal", label: "Sprint goal", kind: "text", required: true },
    { name: "startDate", label: "Start date", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "endDate", label: "End date", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "velocityPoints", label: "Velocity baseline (avg pts)", kind: "text", placeholder: "e.g. 20 - leave blank if none" },
    { name: "velocitySprints", label: "Over how many sprints", kind: "text", placeholder: "e.g. 3" },
    { name: "team", label: "Team capacity", kind: "list", addLabel: "Add person", required: true, itemFields: [
      { name: "person", label: "Person", kind: "text", placeholder: "Name" },
      { name: "availableDays", label: "Available days", kind: "text" },
      { name: "workingDays", label: "Working days", kind: "text" },
      { name: "points", label: "Usable points", kind: "select", options: POINTS },
      { name: "notes", label: "Notes", kind: "text" },
    ]},
    { name: "backlog", label: "Backlog", kind: "list", addLabel: "Add item", required: true, itemFields: [
      { name: "priority", label: "Priority", kind: "select", options: PRIORITY },
      { name: "item", label: "Item", kind: "text" },
      { name: "points", label: "Points", kind: "select", options: [...POINTS, "TBD"] },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "dependencies", label: "Dependencies", kind: "text" },
      { name: "servesGoal", label: "Serves goal", kind: "select", options: ["Yes", "No"] },
    ]},
  ]},
  { id: "release-checklist", title: "Release Checklist", intro: "Statuses roll up to a verdict.", fields: [
    { name: "release", label: "Release name", kind: "text", required: true },
    { name: "releaseType", label: "Release type", kind: "select", options: RELEASE_TYPE },
    { name: "targetDate", label: "Target date", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "items", label: "Checks", kind: "list", addLabel: "Add check", required: true, itemFields: [
      { name: "category", label: "Category", kind: "select", options: CATEGORIES },
      { name: "item", label: "Check", kind: "text" },
      { name: "status", label: "Status", kind: "select", options: CHECK_STATUS },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "due", label: "Deadline", kind: "text" },
      { name: "acceptedBy", label: "Accepted by (for a FAIL you accept)", kind: "text" },
      { name: "note", label: "Note", kind: "text" },
    ]},
  ]},
  { id: "sprint-report", title: "Sprint Report", intro: "Sprint status snapshot. Leave confidence blank when days remaining are unknown.", fields: [
    { name: "sprint", label: "Sprint", kind: "text", required: true },
    { name: "mode", label: "Sprint mode", kind: "select", options: SPRINT_MODE },
    { name: "day", label: "Day of sprint", kind: "text", placeholder: "e.g. 7" },
    { name: "totalDays", label: "Sprint length (days)", kind: "text", placeholder: "e.g. 10" },
    { name: "status", label: "RAG status", kind: "select", options: RAG },
    { name: "confidence", label: "Confidence (%)", kind: "text", placeholder: "blank if days remaining unknown" },
    { name: "riskLevel", label: "Risk level", kind: "select", options: RISK_LEVEL },
    { name: "committed", label: "Committed points", kind: "text" },
    { name: "completed", label: "Completed points", kind: "text" },
    { name: "goal", label: "Sprint goal", kind: "text", placeholder: "leave blank if none was set" },
    { name: "goalStatus", label: "Goal attainment", kind: "select", options: GOAL_STATUS },
    { name: "forecast", label: "Forecast / actuals", kind: "textarea" },
    { name: "summary", label: "Executive summary", kind: "textarea" },
    { name: "movement", label: "Movement since last report", kind: "text" },
    { name: "velocityHistory", label: "Velocity history (prior sprints)", kind: "list", addLabel: "Add sprint", itemFields: [
      { name: "sprint", label: "Sprint", kind: "text" },
      { name: "points", label: "Points delivered", kind: "text" },
    ]},
    { name: "priorities", label: "Top PM priorities", kind: "list", addLabel: "Add priority", itemFields: [
      { name: "item", label: "Priority", kind: "text" },
    ]},
    { name: "topRisks", label: "Main risks / blockers", kind: "list", addLabel: "Add risk", itemFields: [
      { name: "risk", label: "Risk", kind: "text" },
    ]},
    { name: "actionsToday", label: "Actions today (in flight)", kind: "list", addLabel: "Add action", itemFields: [
      { name: "item", label: "Action", kind: "text" },
    ]},
    { name: "standup", label: "Questions for standup (in flight)", kind: "list", addLabel: "Add question", itemFields: [
      { name: "item", label: "Question", kind: "text" },
    ]},
    { name: "carryover", label: "Carry-over (closed sprints)", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Item", kind: "text" },
    ]},
    { name: "nextSprintImplications", label: "Next sprint implications (closed)", kind: "textarea" },
    { name: "leadershipUpdate", label: "Leadership update", kind: "textarea" },
  ]},
  { id: "decision-log", title: "Decision Log", intro: "One running register. Each decision gets an ID, a date, and an audit trail.", fields: [
    { name: "project", label: "Project", kind: "text" },
    { name: "preparedBy", label: "Prepared by", kind: "text" },
    { name: "version", label: "Register version", kind: "text", placeholder: "e.g. 1.3" },
    { name: "entries", label: "Decisions", kind: "list", addLabel: "Add decision", required: true, itemFields: [
      { name: "date", label: "Date decided", kind: "text", placeholder: "YYYY-MM-DD" },
      { name: "title", label: "Decision title", kind: "text" },
      { name: "area", label: "Area", kind: "select", options: DECISION_AREA },
      { name: "originalPlan", label: "Original plan", kind: "text" },
      { name: "revisedPlan", label: "Revised plan", kind: "text" },
      { name: "reason", label: "Reason (note any rejected options)", kind: "text" },
      { name: "changeProposedBy", label: "Proposed by", kind: "text" },
      { name: "deliveryImpact", label: "Delivery impact", kind: "text" },
      { name: "technicalImpact", label: "Technical impact", kind: "text" },
      { name: "productOwnerImpact", label: "PO impact", kind: "text" },
      { name: "costImpact", label: "Cost impact", kind: "text" },
      { name: "changeStatus", label: "Status", kind: "select", options: CHANGE_STATUS },
      { name: "changeApprovedBy", label: "Approved by", kind: "text" },
      { name: "supersedes", label: "Supersedes (D-00X)", kind: "text" },
      { name: "followUps", label: "Follow-ups (SOW/CR, stale artefacts, comms)", kind: "text" },
    ]},
    { name: "discussed", label: "Discussed, not decided", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Floated idea", kind: "text" },
    ]},
  ]},
  { id: "meeting-notes", title: "Meeting Minutes", intro: "Header, agenda, and notes - export-ready.", fields: [
    { name: "title", label: "Meeting title", kind: "text", required: true },
    { name: "date", label: "Date", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "duration", label: "Duration", kind: "text", placeholder: "e.g. 45 min" },
    { name: "attendees", label: "Attendees", kind: "tags", placeholder: "Type a name and press Enter" },
    { name: "summary", label: "Summary", kind: "textarea" },
    { name: "agenda", label: "Agenda", kind: "list", addLabel: "Add agenda item", itemFields: [
      { name: "item", label: "Agenda item", kind: "text" },
    ]},
    { name: "notes", label: "Key discussion points", kind: "list", addLabel: "Add point", itemFields: [
      { name: "note", label: "Description", kind: "textarea" },
    ]},
    { name: "decisions", label: "Decisions", kind: "list", addLabel: "Add decision", itemFields: [
      { name: "decision", label: "Decision", kind: "text" },
    ]},
    { name: "actions", label: "Action items", kind: "list", addLabel: "Add action", itemFields: [
      { name: "who", label: "Who (or Unassigned)", kind: "text" },
      { name: "what", label: "What", kind: "text" },
      { name: "when", label: "By when", kind: "text" },
    ]},
    { name: "openQuestions", label: "Open questions", kind: "list", addLabel: "Add question", itemFields: [
      { name: "question", label: "Question", kind: "text" },
    ]},
    { name: "followUps", label: "Want to dig deeper?", kind: "list", addLabel: "Add question", itemFields: [
      { name: "question", label: "Question", kind: "text" },
    ]},
  ]},
  { id: "tech-review", title: "Tech Review", intro: "Feasibility verdict, delivery risks, SA questions.", fields: [
    { name: "project", label: "Project", kind: "text" },
    { name: "documentType", label: "Document type", kind: "text", placeholder: "e.g. Architecture proposal" },
    { name: "verdict", label: "Feasibility verdict", kind: "select", options: FEASIBILITY_VERDICT },
    { name: "summary", label: "Plain-English summary", kind: "textarea", required: true },
    { name: "implications", label: "Delivery implications", kind: "list", addLabel: "Add implication", itemFields: [
      { name: "item", label: "Implication", kind: "text" },
    ]},
    { name: "estimate", label: "Estimate assessment (includes / excludes, basis)", kind: "textarea" },
    { name: "cost", label: "Cost / commercial", kind: "textarea" },
    { name: "risks", label: "Risks surfaced", kind: "list", addLabel: "Add risk", itemFields: [
      { name: "risk", label: "Risk", kind: "text" },
      { name: "likelihood", label: "Likelihood", kind: "select", options: HML },
      { name: "impact", label: "Impact", kind: "select", options: HML },
      { name: "note", label: "Note", kind: "text" },
    ]},
    { name: "topRisk", label: "Top risk to act on now", kind: "textarea" },
    { name: "dependencies", label: "Dependencies", kind: "list", addLabel: "Add dependency", itemFields: [
      { name: "dependency", label: "Dependency", kind: "text" },
    ]},
    { name: "questions", label: "Questions for the SA", kind: "list", addLabel: "Add question", itemFields: [
      { name: "question", label: "Question", kind: "text" },
    ]},
    { name: "scopeImplications", label: "Scope implications", kind: "textarea" },
  ]},
  { id: "retrospective", title: "Retrospective", intro: "Depersonalised themes, owned actions, escalations.", fields: [
    { name: "sprint", label: "Sprint", kind: "text" },
    { name: "outcome", label: "Sprint outcome", kind: "text" },
    { name: "sprintFacts", label: "Sprint facts (committed vs done, carryover, incidents)", kind: "text" },
    { name: "attendees", label: "Attendees (roles, not names)", kind: "tags", placeholder: "Type a role and press Enter" },
    { name: "priorActions", label: "Prior actions review", kind: "list", addLabel: "Add prior action", itemFields: [
      { name: "action", label: "Last retro action", kind: "text" },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "done", label: "Done?", kind: "select", options: ["Yes", "No", "Partial"] },
    ]},
    { name: "wentWell", label: "What went well", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Item", kind: "text" },
    ]},
    { name: "didnt", label: "What didn't", kind: "list", addLabel: "Add item", itemFields: [
      { name: "theme", label: "Theme", kind: "text" },
      { name: "whatHappened", label: "What happened (blameless)", kind: "text" },
      { name: "impact", label: "Impact", kind: "text" },
      { name: "recurring", label: "Recurring?", kind: "select", options: ["No", "Yes"] },
    ]},
    { name: "actions", label: "Action items", kind: "list", addLabel: "Add action", itemFields: [
      { name: "action", label: "Action", kind: "text" },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "by", label: "By when", kind: "text" },
      { name: "addresses", label: "Addresses (theme #)", kind: "text" },
      { name: "escalation", label: "Escalation?", kind: "select", options: ["No", "Yes"] },
    ]},
    { name: "parked", label: "Parked - revisit if it recurs", kind: "list", addLabel: "Add parked item", itemFields: [
      { name: "item", label: "Item", kind: "text" },
    ]},
    { name: "sentiment", label: "Team sentiment", kind: "textarea" },
  ]},
  { id: "stakeholder-update", title: "Stakeholder Update", intro: "Audience-ready status comms with a RAG trend.", fields: [
    { name: "audience", label: "Audience", kind: "text" },
    { name: "status", label: "Overall status", kind: "select", options: UPDATE_STATUS },
    { name: "previousStatus", label: "Previous status (for the trend)", kind: "select", options: UPDATE_STATUS },
    { name: "headline", label: "Headline (impact, recovery, ask when at risk)", kind: "textarea", required: true },
    { name: "progress", label: "Progress since last update", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Update", kind: "text" },
    ]},
    { name: "comingNext", label: "Coming next", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Next", kind: "text" },
    ]},
    { name: "budget", label: "Budget", kind: "textarea", placeholder: "Spend vs budget and trajectory, or leave blank" },
    { name: "risks", label: "Risks & issues", kind: "list", addLabel: "Add risk", itemFields: [
      { name: "risk", label: "Item", kind: "text" },
      { name: "impact", label: "Impact", kind: "text" },
      { name: "action", label: "What we're doing", kind: "text" },
    ]},
    { name: "asks", label: "Decisions / help needed", kind: "list", addLabel: "Add ask", itemFields: [
      { name: "ask", label: "Ask", kind: "text" },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "by", label: "By when", kind: "text" },
    ]},
    { name: "keyDates", label: "Key dates", kind: "list", addLabel: "Add date", itemFields: [
      { name: "milestone", label: "Milestone", kind: "text" },
      { name: "date", label: "Date", kind: "text" },
      { name: "was", label: "Was (previous date)", kind: "text" },
    ]},
    { name: "nextUpdate", label: "Next update", kind: "text", placeholder: "YYYY-MM-DD" },
  ]},
  { id: "roadmap", title: "Roadmap", intro: "Now / Next / Later buckets, with an optional horizon timeline.", fields: [
    { name: "goal", label: "Goal", kind: "text", required: true },
    { name: "horizon", label: "Horizon", kind: "text", placeholder: "e.g. Next 2 quarters" },
    { name: "confidence", label: "Confidence note", kind: "text", placeholder: "Near-term firm, later directional" },
    { name: "nextReview", label: "Next review", kind: "text", placeholder: "date or trigger" },
    { name: "items", label: "Initiatives (Now / Next / Later)", kind: "list", addLabel: "Add initiative", required: true, itemFields: [
      { name: "bucket", label: "Bucket", kind: "select", options: ROADMAP_BUCKET },
      { name: "initiative", label: "Initiative", kind: "text" },
      { name: "theme", label: "Theme", kind: "text" },
      { name: "confidence", label: "Confidence", kind: "select", options: RM_CONFIDENCE },
      { name: "size", label: "Size (optional)", kind: "select", options: RM_SIZE },
      { name: "note", label: "Why now / depends on / open question", kind: "text" },
    ]},
    { name: "weeks", label: "Timeline weeks (optional)", kind: "select", options: WEEKS },
    { name: "tasks", label: "Timeline items (optional)", kind: "list", addLabel: "Add item", itemFields: [
      { name: "name", label: "Item", kind: "text" },
      { name: "lane", label: "Bucket / lane", kind: "text", placeholder: "e.g. Now" },
      { name: "startWeek", label: "Start week", kind: "select", options: WEEKNUM },
      { name: "endWeek", label: "End week", kind: "select", options: WEEKNUM },
      { name: "startDate", label: "Start date", kind: "text", placeholder: "optional, e.g. 2026-06-09" },
      { name: "endDate", label: "End date", kind: "text", placeholder: "optional" },
    ]},
  ]},
  { id: "budget-tracker", title: "Budget Tracker", intro: "Spend vs baseline, forecast at completion, RAG verdict.", fields: [
    { name: "project", label: "Project", kind: "text" },
    { name: "budget", label: "Original budget", kind: "text", placeholder: "e.g. 80000" },
    { name: "approvedChanges", label: "Approved changes (change orders)", kind: "text", placeholder: "e.g. 5000, or blank" },
    { name: "approvedChangesRef", label: "Change order ref (decision log)", kind: "text", placeholder: "e.g. D-002" },
    { name: "committed", label: "Committed but unbilled", kind: "text", placeholder: "e.g. 4000" },
    { name: "commercialModel", label: "Commercial model", kind: "select", options: COMMERCIAL_MODEL },
    { name: "scopeComplete", label: "Scope complete (%)", kind: "text", placeholder: "0-100" },
    { name: "timeElapsed", label: "Time elapsed (%)", kind: "text", placeholder: "0-100" },
    { name: "plannedStart", label: "Planned start", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "plannedEnd", label: "Planned end", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "developers", label: "Developers", kind: "list", addLabel: "Add developer", required: true, itemFields: [
      { name: "name", label: "Developer", kind: "text" },
      { name: "hours", label: "Hours", kind: "text" },
      { name: "rate", label: "Cost / hour", kind: "text" },
    ]},
  ]},
  { id: "onboarding", title: "Onboarding Brief", intro: "A sendable starter brief for a new joiner. Most of it auto-fills from this project's artefacts and refreshes each time you open it. Only the fields marked 'you fill this' need a person, and those are the ones that persist. Download it as a PDF to email the joiner.", fields: [
    { name: "role", label: "Joiner role", kind: "text", required: true, human: true, placeholder: "dev / QA / PM / designer" },
    { name: "client", label: "Client", kind: "text", auto: true },
    { name: "phase", label: "Current phase", kind: "text", auto: true },
    { name: "sensitivities", label: "Handle with care (from client.md)", kind: "text", human: true },
    { name: "summary", label: "In one paragraph", kind: "textarea", auto: true },
    { name: "whereWeAre", label: "Where we are now", kind: "list", addLabel: "Add line", auto: true, itemFields: [
      { name: "item", label: "Line", kind: "text" },
    ]},
    { name: "howWeWork", label: "How we work (cadence, comms, where work lives)", kind: "list", addLabel: "Add line", human: true, itemFields: [
      { name: "item", label: "Line", kind: "text" },
    ]},
    { name: "whosWho", label: "Who's who", kind: "list", addLabel: "Add person", auto: true, itemFields: [
      { name: "who", label: "Name / role", kind: "text" },
      { name: "owns", label: "What they own", kind: "text" },
      { name: "goTo", label: "When to go to them", kind: "text" },
    ]},
    { name: "readFirst", label: "What to read first (in order)", kind: "list", addLabel: "Add doc", auto: true, itemFields: [
      { name: "item", label: "Doc + date", kind: "text" },
    ]},
    { name: "decisions", label: "Key decisions already made", kind: "list", addLabel: "Add decision", auto: true, itemFields: [
      { name: "item", label: "Decision", kind: "text" },
    ]},
    { name: "risks", label: "Live risks & open questions", kind: "list", addLabel: "Add item", auto: true, itemFields: [
      { name: "item", label: "Risk / question", kind: "text" },
      { name: "why", label: "Why it matters", kind: "text" },
    ]},
    { name: "roleStart", label: "Role-specific starting points", kind: "list", addLabel: "Add item", human: true, itemFields: [
      { name: "item", label: "Starting point", kind: "text" },
    ]},
    { name: "checklist", label: "First-week checklist", kind: "list", addLabel: "Add item", human: true, itemFields: [
      { name: "item", label: "Item", kind: "text" },
      { name: "grantedBy", label: "Granted by (+ lead time)", kind: "text" },
    ]},
  ]},
];

/** Pre-filled test data so every section is ready to view. */
export const TEST_DATA: OnbData = {
  triage: {
    requester: "Sarah, client VP Product, via email on 12 May, relayed through our account manager. Sarah is the cited authority, not the sender.",
    requestSummary: "Enterprise clients discover failed payments reactively (via customer calls) rather than proactively. Sarah is asking for real-time payment failure notifications.",
    businessGoal: "Reduce client churn and support burden by giving enterprise customers visibility into payment failures before their end-customers complain.",
    stakeholderNeed: "Enterprise clients need to know about payment failures the moment they occur.",
    whatIsClear: [
      { point: "Trigger event: payment failure" },
      { point: "Audience: enterprise clients" },
      { point: "Deadline: 6 weeks (Salesforce conference)" },
      { point: "Budget: ~$80k" },
    ],
    missingInfo: [
      { question: "Channels (email / SMS / webhook / in-app)?", audience: "Ask requester" },
      { question: "Events beyond failures (partial, reversals, retries)?", audience: "Ask requester" },
      { question: "Who receives the notification?", audience: "Ask requester" },
      { question: "Existing infra to build on?", audience: "Check internally" },
      { question: "Is 6 weeks for MVP or full feature?", audience: "Ask requester" },
    ],
    concerns: [
      { point: '"Real-time" undefined (30s vs 5min)' },
      { point: "6 weeks is aggressive" },
      { point: "$80k may not cover full scope" },
    ],
    urgency: "6 weeks tied to the Salesforce conference. Reads as a real external deadline - confirm the conference date is fixed.",
    impact: "Not checked - no project context",
    classification: "Needs Clarification",
    nextStep: "Run a discovery session with Sarah and the tech lead.",
  },
  "risk-scan": {
    risks: [
      { risk: "6-week deadline unachievable for full scope", category: "Delivery", likelihood: "H", impact: "H", detectability: "Easy", velocity: "Fast", priority: "Act now", response: "Mitigate", proximity: "Week 1-2", owner: "PM" },
      { risk: "Real-time needs event streaming infra not in place", category: "Technical", likelihood: "M", impact: "H", detectability: "Hard", velocity: "Fast", priority: "Act now", response: "Escalate", proximity: "Week 1-2", owner: "Tech Lead" },
      { risk: "Notification channel scope expands mid-sprint", category: "Business", likelihood: "H", impact: "M", detectability: "Moderate", velocity: "Medium", priority: "Monitor", response: "Mitigate", proximity: "Month 1", owner: "PM" },
      { risk: "$80k budget insufficient if webhook infra needed", category: "Business", likelihood: "M", impact: "H", detectability: "Moderate", velocity: "Slow", priority: "Contingency", response: "Transfer", proximity: "Month 2-3", owner: "PM" },
      { risk: "Per-client config complexity underestimated", category: "Technical", likelihood: "M", impact: "M", detectability: "Moderate", velocity: "Slow", priority: "Monitor", response: "Mitigate", proximity: "Month 1", owner: "PM" },
    ],
  },
  charter: {
    purpose: "Enterprise clients discover payment failures reactively, causing churn and support overhead. This project delivers real-time payment event notifications so clients can act before their customers notice.",
    sponsor: "Sarah Chen (Head of Product)",
    objectives: [{ objective: "Notify within 60s of a payment event" }, { objective: "Reduce payment-related support tickets by 40%" }],
    inScope: [{ item: "Email notifications for payment failure events" }, { item: "Configurable recipients per account" }, { item: "Failure, retry and resolution events" }],
    outOfScope: [{ item: "SMS and push notifications" }, { item: "Webhook delivery (phase 2)" }, { item: "End-user notifications [proposed - confirm]" }],
    deliverables: [
      { deliverable: "Notification engine (email)", due: "Sprint 1" },
      { deliverable: "Recipient management", due: "Sprint 2" },
    ],
    governance: [
      { item: "Decision authority", detail: "Sarah Chen - final call on scope, budget, and timeline" },
      { item: "Change approval", detail: "Material scope, budget, or timeline changes need sponsor sign-off, recorded via /decision-log" },
      { item: "Reporting cadence", detail: "Weekly one-page status update to the sponsor" },
    ],
    milestones: [
      { milestone: "Charter sign-off", date: "2026-06-02" },
      { milestone: "Email MVP to staging", date: "2026-06-20" },
      { milestone: "Conference demo", date: "2026-07-13" },
    ],
    budget: [
      { item: "Estimated delivery cost", amount: "$80k" },
      { item: "Contingency (10-15%)", amount: "$10k" },
      { item: "Commercial basis", amount: "Time and materials, invoiced monthly [assumed]" },
      { item: "Includes / excludes", amount: "SendGrid and infra included; third-party licences excluded [assumed]" },
      { item: "Budget owner", amount: "Sarah Chen" },
    ],
    risks: [
      { risk: "Event streaming infra not in place", likelihood: "M", impact: "H", response: "Spike in Week 1" },
      { risk: "6-week deadline for MVP only", likelihood: "H", impact: "H", response: "Confirm scope with Sarah" },
    ],
    constraints: [{ constraint: "Must demo at the Salesforce conference on 13 July" }],
    assumptions: [{ assumption: "[assumed] Dev team of 4 is available from Month 1" }, { assumption: "[assumed] Kafka event layer is already in production" }],
    clientDependencies: [
      { dependency: "Access to the payment event stream (Kafka)", neededBy: "Week 1", owner: "Client platform team" },
      { dependency: "Enterprise recipient lists for configuration", neededBy: "Sprint 2", owner: "Client account managers" },
    ],
    approvals: [{ role: "Sponsor", name: "Sarah Chen" }, { role: "Tech Lead", name: "Marcus Reid" }, { role: "Project Manager", name: "" }],
  },
  discovery: {
    problem: "Enterprise clients have no proactive signal for payment failures, so they learn from their own customers. The root need is a timely, configurable alert, not a dashboard.",
    success: "A notification is delivered within 60 seconds of a payment event to the right account contacts.",
    affected: [
      { stakeholder: "Enterprise finance teams", pain: "Find out about failures from angry customers", impact: "Reputational hit and churn risk on high-value accounts" },
      { stakeholder: "Finwave support", pain: "High volume of avoidable tickets", impact: "~30% of inbound tickets are failure chasers" },
    ],
    findings: [
      { finding: "Kafka event layer already exists and can be reused", source: "Marcus (Tech Lead)", confidence: "High" },
      { finding: "MVP is email plus in-app, and in-app is a stretch", source: "Sarah (Sponsor)", confidence: "High" },
      { finding: "Recipients configured at account level, not per user", source: "session notes - unattributed", confidence: "Medium" },
    ],
    conflicts: [{ conflict: "Sarah wants webhooks soon, and engineering wants email-only for MVP" }],
    unknowns: [
      { unknown: "Email delivery failure handling (retry vs alert)", resolve: "Confirm with Marcus" },
      { unknown: "Notification history retention", resolve: "Confirm with Sarah" },
    ],
    nextSteps: [
      { action: "Confirm Kafka consumer for payment events", owner: "Marcus", by: "2026-06-03" },
      { action: "Circulate charter for sign-off", owner: "PM", by: "2026-06-02" },
    ],
    readiness: "Not ready for charter and requirements. Blocked on the webhook-versus-email scope conflict and unconfirmed email failure handling. Resolve both before requirements are written.",
    attendees: ["PM", "Tech lead", "QA lead", "Sponsor"],
  },
  prd: {
    scopeChanges: [
      { change: "In-app notification centre added", original: "SOW scoped email only", updated: "Email MVP + optional in-app centre (Could)", reason: "Confirmed by Sarah on kickoff call" },
      { change: "SMS deferred", original: "Brief implied SMS at launch", updated: "SMS moved to phase 2", reason: "Confirmed by Marcus, capacity" },
    ],
    background: "Enterprise clients need proactive notification of payment failures. This PRD covers the email MVP delivered on the existing Kafka event bus, with configurable recipients per account.",
    goals: [
      { goal: "Proactive failure notifications", metric: "Event-to-email time", baseline: "No proactive alert today", target: "< 60s" },
      { goal: "Reduce support tickets", metric: "Payment-confusion tickets", baseline: "~900 per month", target: "-40% in 60 days" },
    ],
    users: [
      { role: "Enterprise admin", who: "Manages the client's account settings", need: "Configure who receives notifications" },
      { role: "Finance contact", who: "Named billing owner at the client", need: "Know about failures immediately" },
    ],
    assumptions: [
      { assumption: "The Kafka payment_failed event fires reliably for all failure types." },
      { assumption: "Clients keep recipient lists current in account settings." },
    ],
    constraints: [
      { constraint: "Must reuse the existing Kafka event bus (no new infrastructure)." },
      { constraint: "Launch before the industry conference in 6 weeks." },
    ],
    journeys: [
      { journey: "Configure recipients", steps: "1. Admin opens account settings\n2. Adds or edits the notification recipient list\n3. Saves, and the change takes effect on the next event" },
      { journey: "Receive a failure alert", steps: "1. A payment_failed event fires on Kafka\n2. The service sends an email to the configured recipients within 60s\n3. The recipient opens the email and sees the failure detail and next step" },
    ],
    functional: [
      { requirement: "Send email within 60s of payment_failed", priority: "Must", notes: "Kafka consumer triggers this" },
      { requirement: "Configurable recipients per account", priority: "Must", notes: "Account settings screen" },
      { requirement: "Dedupe on event replay", priority: "Should", notes: "Redis dedup layer" },
      { requirement: "In-app notification centre (last 30 days)", priority: "Could", notes: "Stretch" },
    ],
    nonFunctional: [
      { category: "Performance", requirement: "Event to email latency", target: "< 60s p95" },
      { category: "Reliability", requirement: "No duplicate sends on replay", target: "100%" },
    ],
    outOfScope: [{ item: "SMS / push" }, { item: "Webhook delivery (phase 2)" }, { item: "Custom templates per client" }],
    dependencies: [
      { dependency: "Kafka payment topic", type: "Internal platform", owner: "Platform", status: "Confirmed" },
      { dependency: "SendGrid prod API key", type: "Third-party API", owner: "Infra", status: "Pending" },
    ],
    openQuestions: [
      { question: "Email delivery failure: retry or alert?", owner: "Marcus", by: "Week 1" },
      { question: "Is a notification history view required?", owner: "Sarah", by: "Week 1" },
    ],
    signOff: [
      { role: "Product Owner", name: "Sarah Chen", status: "Pending", date: "" },
      { role: "Tech Lead", name: "Marcus R", status: "Pending", date: "" },
    ],
  },
  stories: {
    epics: [
      { name: "Payment Event Notification Engine", stories: [
        {
          title: "Consume payment events from Kafka", priority: "Must", linkedRequirement: "FR-01", points: "5", status: "In Progress",
          asA: "notification service", iWant: "consume payment_failed, retried and resolved events", soThat: "I can trigger notifications in real time",
          criteria: "Given a payment_failed event is published, when the consumer reads it, then a notification job is queued within 5 seconds\nGiven a duplicate event id, when read again, then no second job is queued (Redis dedup)\nGiven the consumer reconnects, then it resumes from its last committed offset without skipping events",
        },
        {
          title: "Send email via SendGrid", priority: "Must", linkedRequirement: "FR-03", points: "TBD", status: "To Do",
          asA: "enterprise client contact", iWant: "receive an email when a payment event occurs", soThat: "I learn about failures before my customers call",
          criteria: "Given a queued notification job, when processed, then an email is sent within 60 seconds of the event\nGiven SendGrid returns a 5xx, then the job retries up to 3 times then dead-letters\nError: on permanent failure, log the event id and surface it in the delivery report",
        },
        {
          title: "Recipient lookup service", priority: "Must", linkedRequirement: "FR-02", points: "3", status: "To Do",
          asA: "notification service", iWant: "resolve the configured recipients for an account", soThat: "emails reach the right people",
          criteria: "Given an account id, when looked up, then all active recipients are returned\nGiven no recipients configured, then the event is logged and no email is sent",
        },
        {
          title: "Email templates", priority: "Should", linkedRequirement: "None", points: "2", status: "To Do",
          asA: "client contact", iWant: "a clear, branded failure email", soThat: "I can act quickly",
          criteria: "Given a payment_failed event, then the email shows amount, account, failure reason and timestamp\nCopy is approved by Sarah before release",
        },
      ]},
      { name: "Notification Recipient Management", stories: [
        {
          title: "Account settings screen", priority: "Must", linkedRequirement: "FR-05", points: "3", status: "To Do",
          asA: "enterprise admin", iWant: "add or remove notification recipients", soThat: "the right team is alerted",
          criteria: "Given the settings screen, when I add a valid email, then it appears in the recipient list\nGiven an invalid email, then show \"Enter a valid email address\" and do not save\nGiven I remove a recipient, then they stop receiving notifications immediately",
        },
      ]},
      { name: "Notification History (stretch)", stories: [
        {
          title: "Notification history endpoint", priority: "Could", linkedRequirement: "None", points: "3", status: "To Do",
          asA: "enterprise admin", iWant: "see the last 30 days of notifications", soThat: "I can audit what was sent",
          criteria: "Given the history view, then notifications from the last 30 days are listed newest first\nGiven zero notifications, then show \"No notifications in the last 30 days\"",
        },
      ]},
    ],
  },
  "sprint-sow": {
    preparedBy: "Nadia Rahman",
    version: "1.0",
    status: "Draft",
    jiraBoard: "https://finwave.atlassian.net/jira/software/projects/NOTIF/boards/12",
    sprintGoal: "Deliver a working payment notification engine that sends emails within 60s, with deduplication.",
    overview: "Sprint 1 establishes the Kafka consumer, the SendGrid email path, and Redis deduplication. Recipient management and the in-app centre are out of scope for this sprint.",
    startDate: "2026-06-09",
    endDate: "2026-06-20",
    team: [
      { member: "Marcus Webb", role: "Backend Engineer", tickets: "NOTIF-2, NOTIF-4" },
      { member: "Aiko Tanaka", role: "Backend Engineer", tickets: "NOTIF-3" },
      { member: "Priya Nair", role: "QA Engineer", tickets: "NOTIF-8" },
    ],
    deliverables: [
      { theme: "Event Consumption", ticket: "NOTIF-2", deliverable: "Kafka consumer", description: "Consumes payment events and dedups via Redis", assignee: "Marcus Webb", estimate: "5" },
      { theme: "Email Delivery", ticket: "NOTIF-3", deliverable: "SendGrid integration", description: "Sends event emails with retry and bounce handling", assignee: "Aiko Tanaka", estimate: "5" },
      { theme: "Email Delivery", ticket: "NOTIF-4", deliverable: "Recipient lookup service", description: "Resolves the account recipients for each event", assignee: "Marcus Webb", estimate: "3" },
      { theme: "Quality Assurance", ticket: "NOTIF-8", deliverable: "End-to-end test plan", description: "Covers consumption, dedup, and delivery across all event types", assignee: "Priya Nair", estimate: "" },
    ],
    outOfScope: [
      { item: "Recipient management UI - deferred to Sprint 2 (NOTIF-7)" },
      { item: "In-app notification centre - stretch (NOTIF-10)" },
    ],
    dependencies: [
      { item: "SendGrid production API key - owed by Infra, needed before sprint start" },
      { item: "Kafka payment topic access is confirmed and stable" },
    ],
    dod: [
      { condition: "Code reviewed and merged to main" },
      { condition: "Unit and integration tests passing in CI" },
      { condition: "Email delivery confirmed in staging for all 3 event types" },
      { condition: "Redis dedup verified - no duplicate sends on replay" },
      { condition: "QA sign-off from Priya Nair" },
    ],
    approver: "Sarah Chen",
  },
  "sprint-planning": {
    sprintName: "Sprint 1 - Notifications",
    sprintGoal: "Ship the payment notification engine so clients are emailed within 60s of a payment event.",
    startDate: "2026-06-09",
    endDate: "2026-06-20",
    velocityPoints: "20",
    velocitySprints: "3",
    team: [
      { person: "Marcus", availableDays: "8", workingDays: "10", points: "13", notes: "Full sprint, BE" },
      { person: "Aiko", availableDays: "7", workingDays: "10", points: "13", notes: "1 day PTO, BE" },
      { person: "Priya", availableDays: "6", workingDays: "10", points: "8", notes: "Part-time, QA" },
    ],
    backlog: [
      { priority: "P0", item: "NOTIF-2 Kafka consumer", points: "5", owner: "Marcus", dependencies: "Redis provisioned", servesGoal: "Yes" },
      { priority: "P0", item: "NOTIF-3 SendGrid integration", points: "5", owner: "Aiko", dependencies: "API key in prod - unconfirmed", servesGoal: "Yes" },
      { priority: "P1", item: "NOTIF-4 Recipient lookup", points: "3", owner: "Marcus", servesGoal: "Yes" },
      { priority: "P1", item: "NOTIF-5 Email templates", points: "TBD", owner: "Aiko", dependencies: "Copy from Sarah", servesGoal: "Yes" },
      { priority: "P1", item: "NOTIF-8 QA test plan", points: "3", owner: "Priya", servesGoal: "Yes" },
      { priority: "P1", item: "NOTIF-1 Auth bug fix (carryover)", points: "2", owner: "Aiko", servesGoal: "No" },
      { priority: "P2", item: "NOTIF-6 History endpoint", points: "8", owner: "Aiko" },
    ],
  },
  "release-checklist": {
    release: "Notifications v1 (email + webhooks)",
    releaseType: "planned",
    targetDate: "2026-07-03 18:00 AEST",
    items: [
      { category: "Feature Readiness", item: "All in-scope stories Done", status: "PASS", owner: "Priya" },
      { category: "Testing", item: "QA sign-off received (webhooks)", status: "UNCONFIRMED", owner: "Priya", due: "2026-07-03 16:00", note: "Webhooks outstanding" },
      { category: "Testing", item: "Security review of webhook signing", status: "UNCONFIRMED", owner: "Sofia (Security)", note: "Touches auth" },
      { category: "Testing", item: "Load testing under peak", status: "FAIL", owner: "Marcus", acceptedBy: "Sarah Chen", note: "SendGrid peak volume unproven" },
      { category: "Operational Readiness", item: "Rollback plan reviewed", status: "UNCONFIRMED", owner: "Marcus", due: "2026-07-02 EOD" },
      { category: "Operational Readiness", item: "Release window sane (Friday 18:00)", status: "RISK", owner: "Marcus", note: "Friday evening - on-call confirmed" },
      { category: "Operational Readiness", item: "Deploy owner named", status: "PASS", owner: "Marcus" },
      { category: "Operational Readiness", item: "Deploy sequence agreed (config, migration, code)", status: "PASS", owner: "Marcus" },
      { category: "Approvals", item: "PM sign-off", status: "PASS", owner: "PM" },
    ],
  },
  "sprint-report": {
    sprint: "Sprint 1 - Notifications",
    mode: "In flight",
    day: "7", totalDays: "10", status: "amber", confidence: "72", riskLevel: "High",
    committed: "18", completed: "7",
    goal: "Ship the email notification MVP for all three payment event types.",
    goalStatus: "At risk",
    forecast: "4 of 5 items likely complete (NOTIF-6 at risk).",
    summary: "Sprint 1 is on track for the P0 items but NOTIF-6 is blocked on an infra misconfiguration. NOTIF-4 has not started and must begin today to finish by sprint end.",
    movement: "Confidence down from 80% on Day 3 - the NOTIF-6 blocker is still open.",
    velocityHistory: [
      { sprint: "Sprint -2", points: "16" },
      { sprint: "Sprint -1", points: "14" },
    ],
    priorities: [
      { item: "Escalate the Redis region issue to infra (NOTIF-6 blocked)" },
      { item: "Confirm Marcus starts NOTIF-4 today (P1, no buffer)" },
      { item: "Confirm QA staging is ready for NOTIF-2 regression" },
    ],
    topRisks: [
      { risk: "NOTIF-6 blocked - Redis provisioned in wrong region" },
      { risk: "NOTIF-4 not started, P1 with no buffer" },
      { risk: "QA staging readiness for NOTIF-2 regression" },
    ],
    actionsToday: [
      { item: "Marcus to start NOTIF-4" },
      { item: "Raise infra ticket for the Redis region fix" },
    ],
    standup: [
      { item: "Marcus - can NOTIF-4 start today?" },
      { item: "Infra - ETA on the Redis region fix?" },
      { item: "Priya - is staging ready for NOTIF-2 sign-off?" },
    ],
    leadershipUpdate: "Sprint 1 is tracking behind plan on one blocked story. The team is unblocking it today and a scope call may be needed by Friday to keep the committed delivery achievable.",
  },
  "decision-log": {
    project: "Finwave Real-Time Notifications",
    preparedBy: "PM",
    version: "1.3",
    entries: [
      {
        date: "2026-06-15", title: "Webhook delivery pulled into Sprint 2",
        area: "Scope",
        originalPlan: "Webhook delivery in Phase 2 (post-MVP)",
        revisedPlan: "Webhook delivery moved into Sprint 2",
        reason: "Enterprise client request ahead of the Salesforce conference",
        changeProposedBy: "Sarah Chen",
        deliveryImpact: "Sprint 2 capacity reduced, NOTIF-6 deferred to Sprint 3",
        technicalImpact: "New webhook service required in Sprint 2",
        productOwnerImpact: "Notification history de-prioritised to Sprint 3",
        costImpact: "Neutral - within $80k budget",
        changeStatus: "Superseded",
        changeApprovedBy: "Sarah Chen",
      },
      {
        date: "2026-06-20", title: "Notification history deferred to Phase 2",
        area: "Scope",
        originalPlan: "Notification history in the launch scope",
        revisedPlan: "Notification history deferred to Phase 2",
        reason: "Protect the launch date after webhook scope was added",
        changeProposedBy: "PM",
        deliveryImpact: "Removes NOTIF-6 from the critical path",
        technicalImpact: "None",
        productOwnerImpact: "History drops off the launch roadmap",
        costImpact: "Neutral",
        changeStatus: "Under Review",
        changeApprovedBy: "[TBC]",
        followUps: "Needs a formal CR - outside the current SOW. The PRD is now stale.",
      },
      {
        date: "2026-06-28", title: "Webhooks descoped to a post-launch fast-follow",
        area: "Scope",
        originalPlan: "Webhook delivery in Sprint 2 (per D-001)",
        revisedPlan: "Webhooks moved to a fast-follow release after launch",
        reason: "Sprint 2 could not absorb webhooks without slipping the launch (cutting QA was considered and rejected)",
        changeProposedBy: "PM",
        deliveryImpact: "Protects the launch date, webhooks land two weeks later",
        technicalImpact: "Webhook service built behind a disabled flag",
        productOwnerImpact: "Enterprise client notified of the fast-follow date",
        costImpact: "Neutral",
        changeStatus: "Approved",
        changeApprovedBy: "Sarah Chen",
        supersedes: "D-001",
      },
    ],
    discussed: [
      { item: "Adding SMS notifications - floated by Sarah, no decision taken" },
    ],
  },
  "meeting-notes": {
    title: "Notifications discovery kick-off",
    date: "2026-06-01",
    duration: "45 min",
    attendees: ["Sarah Chen", "Marcus Reid", "Priya Sharma", "PM"],
    summary: "Kick-off for real-time notifications. The team aligned on an email + in-app MVP, confirmed the Kafka event layer exists, and agreed the 6-week deadline covers email only.",
    agenda: [
      { item: "Confirm MVP scope" },
      { item: "Validate event streaming approach" },
      { item: "Agree definition of real-time" },
    ],
    notes: [
      { note: "Kafka event layer already exists and can be reused for payment events." },
      { note: "MVP is email only. The in-app notification centre is a stretch goal." },
      { note: "Recipients are configured at the account level, not per user." },
    ],
    decisions: [
      { decision: "MVP = email notifications only" },
      { decision: "Real-time defined as within 60 seconds of the event" },
    ],
    actions: [
      { who: "Marcus", what: "Confirm Kafka consumer for payment events", when: "2026-06-03" },
      { who: "PM", what: "Update charter and circulate for sign-off", when: "2026-06-02" },
      { who: "Priya", what: "Define QA approach for delivery testing", when: "2026-06-05" },
      { who: "Unassigned", what: "Decide whether a notification history view is in MVP scope", when: "TBD" },
    ],
    openQuestions: [
      { question: "Email delivery failure: retry silently or alert the ops channel?" },
      { question: "Is a notification history view required for MVP? (unassigned action above)" },
      { question: "A speaker after the crosstalk was labelled \"Speaker 4\" (attribution unclear) - confirm who owns the SendGrid account." },
    ],
    followUps: [
      { question: "What is the fallback if a payment event never reaches the Kafka consumer?" },
      { question: "Who signs off that within 60 seconds is the right SLA for enterprise clients?" },
      { question: "Does the in-app stretch need design input before Sprint 1 planning?" },
    ],
  },
  "tech-review": {
    project: "Finwave Real-Time Notifications",
    documentType: "Architecture proposal",
    verdict: "Feasible with conditions",
    summary: "A Kafka event bus feeds a new notification microservice that sends emails via SendGrid, with Redis preventing duplicate sends on event replay and a feature flag gating per-client rollout. It replaces the current manual notification process.",
    implications: [
      { item: "Timeline: 6 weeks feasible for email only - Kafka already in place" },
      { item: "Scope: Redis deduplication adds ~3 days not in the original estimate" },
      { item: "Third-party: SendGrid production API key needed before Week 3" },
      { item: "Operational: a new service to monitor and run on-call for" },
    ],
    estimate: "The SA's 6 weeks covers build and unit test only. It excludes QA, UAT, environment setup, and production hardening. Basis is the SA's prior experience on a similar consumer, not a spike, so treat it as indicative.",
    cost: "SendGrid is usage-based and the current tier is unproven at enterprise volume, and Redis adds a managed-instance cost. The document is silent on both, so they are raised as SA questions rather than estimated here.",
    risks: [
      { risk: "Redis not in current prod stack", likelihood: "M", impact: "H", note: "Blocks delivery if provisioning slips past Week 3" },
      { risk: "SendGrid rate limits under peak volume", likelihood: "L", impact: "M", note: "Needs a load test the document does not mention" },
      { risk: "No rollback path for a bad notification batch", likelihood: "M", impact: "M", note: "Not addressed in the document (a checked omission)" },
    ],
    topRisk: "R1 - confirm Redis is provisioned in production before the Week 3 build start, or the email path cannot ship.",
    dependencies: [{ dependency: "Redis provisioned in prod before Week 3" }, { dependency: "SendGrid prod API key issued and the tier confirmed" }],
    questions: [
      { question: "Is Redis already provisioned in prod, and who owns it?" },
      { question: "Does the SendGrid tier support enterprise peak volume?" },
      { question: "Is there a rollback plan if a bad batch of notifications is sent?" },
      { question: "Was data residency for notification payloads considered?" },
    ],
    scopeImplications: "The Redis dedup and the rollback gap imply more work than the original estimate shows. Flag roughly 3 extra days at Sprint 1 planning and hold the in-app stretch until the email path is proven.",
  },
  "retrospective": {
    sprint: "Sprint 1 - Notifications",
    outcome: "Partially met goal",
    sprintFacts: "Committed 18 points, delivered 15, one carryover (NOTIF-6), zero incidents",
    attendees: ["BE", "QA", "PM"],
    priorActions: [
      { action: "Add a pre-merge build check", owner: "BE lead", done: "No" },
      { action: "Book QA staging a sprint ahead", owner: "QA", done: "Yes" },
    ],
    wentWell: [
      { item: "Kafka consumer landed early, which unblocked the email path" },
      { item: "Daily async standup kept the remote team aligned without a long call" },
    ],
    didnt: [
      { theme: "Build broke twice - no pre-merge check", whatHappened: "The build failed after merges with no gate, twice in the sprint", impact: "Roughly half a day lost re-running CI", recurring: "Yes" },
      { theme: "Redis provisioned in the wrong region", whatHappened: "NOTIF-6 blocked mid-sprint on an infra misconfiguration", impact: "One story carried over", recurring: "No" },
      { theme: "Client sign-off slipped", whatHappened: "The sponsor did not review the charter within the agreed window", impact: "Sprint 2 planning started without confirmed scope", recurring: "No" },
    ],
    actions: [
      { action: "Add a required pre-merge build check in CI", owner: "BE lead", by: "Sprint 2 start", addresses: "1", escalation: "No" },
      { action: "Add a Redis region check to the environment runbook", owner: "Infra", by: "2026-06-25", addresses: "2", escalation: "No" },
      { action: "Agree a 48-hour sponsor review SLA", owner: "PM", by: "2026-06-24", addresses: "3", escalation: "Yes" },
    ],
    parked: [
      { item: "Test data setup is manual and slow, raised but not prioritised this sprint" },
    ],
    sentiment: "Morale is steady. The recurring build breakage is the main frustration to watch.",
  },
  "stakeholder-update": {
    audience: "Sarah Chen (Sponsor)",
    status: "At risk",
    previousStatus: "On track",
    headline: "The email MVP is still on track for the 3 July launch, but added webhook scope put Sprint 2 at risk. Recovery is to descope webhooks to a fast-follow. Ask: confirm the fast-follow date by Friday.",
    progress: [
      { item: "Promised the email engine to staging - delivered, all three event types sending" },
      { item: "Promised recipient management - delivered behind a feature flag" },
    ],
    comingNext: [{ item: "Production launch of the email MVP on 3 July" }, { item: "Webhook delivery as a fast-follow the week of 14 July" }],
    budget: "Spend is $54.5k of the $80k budget, on trajectory. No change requested this period.",
    risks: [{ risk: "SendGrid tier unproven at peak volume", impact: "Possible throttling at enterprise volume", action: "Load test booked before launch" }],
    asks: [{ ask: "Confirm the webhook fast-follow date", owner: "Sarah", by: "Friday" }],
    keyDates: [
      { milestone: "Email MVP launch", date: "2026-07-03", was: "" },
      { milestone: "Webhook delivery", date: "2026-07-14", was: "2026-07-03" },
    ],
    nextUpdate: "2026-07-04",
  },
  roadmap: {
    goal: "Ship real-time notifications before the Salesforce conference",
    horizon: "Next 2 quarters",
    confidence: "Near-term firm, later directional",
    nextReview: "Post-Q2 close",
    items: [
      { bucket: "Now", initiative: "Email notification MVP", theme: "Retention", confidence: "High", size: "M", note: "Top priority - enterprise churn signal" },
      { bucket: "Now", initiative: "Recipient management", theme: "Retention", confidence: "High", size: "S", note: "Depends on the account-settings API" },
      { bucket: "Next", initiative: "Webhook delivery", theme: "Enterprise", confidence: "Medium", size: "M", note: "Depends on the email engine shipping" },
      { bucket: "Later", initiative: "In-app notification centre", theme: "Engagement", confidence: "Low", size: "L", note: "Open question - is there demand?" },
    ],
    weeks: "8",
    tasks: [
      { name: "Email notification MVP", lane: "Now", startWeek: "1", endWeek: "3", startDate: "2026-06-09", endDate: "2026-06-27" },
      { name: "Recipient management", lane: "Now", startWeek: "3", endWeek: "4", startDate: "2026-06-16", endDate: "2026-06-27" },
      { name: "Webhook delivery", lane: "Next", startWeek: "5", endWeek: "6", startDate: "2026-06-30", endDate: "2026-07-11" },
    ],
  },
  "budget-tracker": {
    project: "Finwave Notifications",
    budget: "80000",
    approvedChanges: "5000",
    approvedChangesRef: "D-002",
    committed: "4000",
    commercialModel: "time-and-materials",
    scopeComplete: "60",
    timeElapsed: "55",
    plannedStart: "2026-06-01",
    plannedEnd: "2026-07-25",
    developers: [
      { name: "Marcus (BE)", hours: "160", rate: "120" },
      { name: "Aiko (BE)", hours: "150", rate: "110" },
      { name: "Lin (FE)", hours: "80", rate: "100" },
      { name: "Priya (QA)", hours: "120", rate: "90" },
    ],
  },
  onboarding: {
    // Only the human-input fields are seeded. Everything else in the brief
    // auto-fills from this project's other artefacts (see src/lib/onboarding.ts).
    role: "Backend Engineer",
    sensitivities: "Ask Sarah (account lead) before discussing the timeline history with the client.",
    howWeWork: [
      { item: "Ceremonies: daily async standup, 2-week sprints, review and retro on the last Friday" },
      { item: "Comms: #finwave-notifications on Slack" },
      { item: "Where the work lives: Jira NOTIF, Confluence FIN space, the finwave-notifications repo" },
    ],
    roleStart: [
      { item: "Start on NOTIF-4 (recipient lookup service), pair with Marcus" },
      { item: "Local env: the Kafka consumer and a Redis instance, see the repo README" },
    ],
    checklist: [
      { item: "GitHub repo access", grantedBy: "Marcus" },
      { item: "Jira NOTIF board access", grantedBy: "PM" },
      { item: "Client VPN and staging access", grantedBy: "Finwave IT (lead time: 3-5 days, request day one)" },
      { item: "Read the three docs above", grantedBy: "" },
      { item: "Intro to Sarah, Marcus, and Priya", grantedBy: "" },
    ],
  },
};
