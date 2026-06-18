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
}
export interface ListField {
  name: string;
  label: string;
  kind: "list";
  addLabel: string;
  required?: boolean;
  itemFields: ScalarField[];
}
export interface EpicsField {
  name: string;
  label: string;
  kind: "epics";
  required?: boolean;
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
  "Communications", "Dependencies", "Approvals", "Post-Release Readiness",
];
const RAG = ["green", "amber", "red"];
const WEEKS = ["4", "6", "8", "10", "12"];
const WEEKNUM = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const DECISION_AREA = ["Scope", "Timeline", "Budget", "Architecture", "Team", "Process", "Other"];
const CHANGE_STATUS = ["Proposed", "Under Review", "Approved", "Rejected"];
const RISK_CATEGORY = ["Delivery", "Technical", "Stakeholder", "Business"];
const RISK_RESPONSE = ["Mitigate", "Transfer", "Avoid", "Accept", "Escalate"];
const RISK_PROXIMITY = ["Week 1-2", "Month 1", "Month 2-3", "Later"];
const DETECT = ["Easy", "Moderate", "Hard"];
const VELOCITY = ["Fast", "Medium", "Slow"];
const RELEASE_TYPE = ["planned", "hotfix", "phased", "feature-flag"];
const UPDATE_STATUS = ["On track", "At risk", "Off track"];

export const STEPS: OnbStep[] = [
  { id: "triage", title: "Triage", intro: "Structure the raw request.", fields: [
    { name: "requestSummary", label: "Request summary", kind: "textarea", required: true },
    { name: "businessGoal", label: "Likely business goal", kind: "textarea", required: true },
    { name: "stakeholderNeed", label: "Primary stakeholder need", kind: "textarea" },
    { name: "whatIsClear", label: "What is clear", kind: "list", addLabel: "Add point", itemFields: [
      { name: "point", label: "Point", kind: "text", placeholder: "Something we already know" },
    ]},
    { name: "missingInfo", label: "Missing information", kind: "list", addLabel: "Add question", itemFields: [
      { name: "point", label: "Question", kind: "text", placeholder: "Something to clarify" },
    ]},
    { name: "concerns", label: "Risks / concerns", kind: "list", addLabel: "Add concern", itemFields: [
      { name: "point", label: "Concern", kind: "text" },
    ]},
    { name: "classification", label: "Intake classification", kind: "text" },
    { name: "nextStep", label: "Recommended next step", kind: "textarea" },
  ]},
  { id: "risk-scan", title: "Risk Scan", intro: "List the early risks; likelihood and impact build the matrix.", fields: [
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
    ]},
    { name: "findings", label: "Key findings", kind: "list", addLabel: "Add finding", itemFields: [
      { name: "finding", label: "Finding", kind: "text" },
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
      { name: "status", label: "Status", kind: "text" },
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
  { id: "stories", title: "User Stories", intro: "Add epics; each holds its own stories.", fields: [
    { name: "epics", label: "Epics", kind: "epics", required: true, storyFields: [
      { name: "title", label: "Story title", kind: "text", placeholder: "Short goal" },
      { name: "asA", label: "As a", kind: "text", placeholder: "persona" },
      { name: "iWant", label: "I want to", kind: "text", placeholder: "goal" },
      { name: "soThat", label: "So that", kind: "text", placeholder: "outcome" },
      { name: "points", label: "Points", kind: "select", options: POINTS },
      { name: "status", label: "Status", kind: "select", options: STORY_STATUS },
      { name: "criteria", label: "Acceptance criteria (one per line)", kind: "textarea", placeholder: "Given a payment fails, when the event arrives, then an email is sent within 60s" },
    ]},
  ]},
  { id: "sprint-sow", title: "Sprint SOW", intro: "Scope the sprint as a statement of work.", fields: [
    { name: "sprintGoal", label: "Sprint goal", kind: "text", required: true },
    { name: "overview", label: "Overview", kind: "textarea" },
    { name: "startDate", label: "Start date", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "endDate", label: "End date", kind: "text", placeholder: "YYYY-MM-DD" },
    { name: "team", label: "Sprint team", kind: "list", addLabel: "Add member", itemFields: [
      { name: "member", label: "Team member", kind: "text" },
      { name: "role", label: "Role", kind: "text" },
      { name: "tickets", label: "Assigned tickets", kind: "text" },
    ]},
    { name: "deliverables", label: "Deliverables", kind: "list", addLabel: "Add deliverable", required: true, itemFields: [
      { name: "deliverable", label: "Deliverable", kind: "text" },
      { name: "description", label: "Description", kind: "text" },
      { name: "assignee", label: "Assignee", kind: "text" },
    ]},
    { name: "outOfScope", label: "Out of scope", kind: "list", addLabel: "Add exclusion", itemFields: [
      { name: "item", label: "Excluded", kind: "text" },
    ]},
    { name: "dod", label: "Definition of Done", kind: "list", addLabel: "Add condition", itemFields: [
      { name: "condition", label: "Condition", kind: "text" },
    ]},
  ]},
  { id: "sprint-planning", title: "Sprint Planning", intro: "Per-person capacity; committed load is P0 + P1.", fields: [
    { name: "team", label: "Team capacity", kind: "list", addLabel: "Add person", required: true, itemFields: [
      { name: "person", label: "Person", kind: "text", placeholder: "Name" },
      { name: "availableDays", label: "Available days", kind: "text" },
      { name: "points", label: "Usable points", kind: "select", options: POINTS },
      { name: "notes", label: "Notes", kind: "text" },
    ]},
    { name: "backlog", label: "Backlog", kind: "list", addLabel: "Add item", required: true, itemFields: [
      { name: "priority", label: "Priority", kind: "select", options: PRIORITY },
      { name: "item", label: "Item", kind: "text" },
      { name: "points", label: "Points", kind: "select", options: POINTS },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "dependencies", label: "Dependencies", kind: "text" },
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
      { name: "note", label: "Note", kind: "text" },
    ]},
  ]},
  { id: "sprint-report", title: "Sprint Report", intro: "Mid-sprint status snapshot.", fields: [
    { name: "sprint", label: "Sprint", kind: "text", required: true },
    { name: "day", label: "Day of sprint", kind: "text", placeholder: "e.g. 7" },
    { name: "totalDays", label: "Sprint length (days)", kind: "text", placeholder: "e.g. 10" },
    { name: "status", label: "RAG status", kind: "select", options: RAG },
    { name: "confidence", label: "Confidence (%)", kind: "text", placeholder: "0-100" },
    { name: "committed", label: "Committed points", kind: "text" },
    { name: "completed", label: "Completed points", kind: "text" },
    { name: "forecast", label: "Forecast", kind: "textarea" },
    { name: "summary", label: "Executive summary", kind: "textarea" },
    { name: "priorities", label: "Top PM priorities", kind: "list", addLabel: "Add priority", itemFields: [
      { name: "item", label: "Priority", kind: "text" },
    ]},
    { name: "topRisks", label: "Main risks / blockers", kind: "list", addLabel: "Add risk", itemFields: [
      { name: "risk", label: "Risk", kind: "text" },
    ]},
    { name: "actionsToday", label: "Actions today", kind: "list", addLabel: "Add action", itemFields: [
      { name: "item", label: "Action", kind: "text" },
    ]},
    { name: "standup", label: "Questions for standup", kind: "list", addLabel: "Add question", itemFields: [
      { name: "item", label: "Question", kind: "text" },
    ]},
  ]},
  { id: "decision-log", title: "Decision Log", intro: "Record scope/plan changes with impact.", fields: [
    { name: "project", label: "Project", kind: "text" },
    { name: "entries", label: "Decisions", kind: "list", addLabel: "Add decision", required: true, itemFields: [
      { name: "area", label: "Area", kind: "select", options: DECISION_AREA },
      { name: "originalPlan", label: "Original plan", kind: "text" },
      { name: "revisedPlan", label: "Revised plan", kind: "text" },
      { name: "reason", label: "Reason", kind: "text" },
      { name: "changeProposedBy", label: "Proposed by", kind: "text" },
      { name: "deliveryImpact", label: "Delivery impact", kind: "text" },
      { name: "technicalImpact", label: "Technical impact", kind: "text" },
      { name: "productOwnerImpact", label: "PO impact", kind: "text" },
      { name: "costImpact", label: "Cost impact", kind: "text" },
      { name: "changeStatus", label: "Status", kind: "select", options: CHANGE_STATUS },
      { name: "changeApprovedBy", label: "Approved by", kind: "text" },
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
    { name: "notes", label: "Notes / discussion", kind: "list", addLabel: "Add note", itemFields: [
      { name: "note", label: "Description", kind: "textarea" },
    ]},
    { name: "decisions", label: "Decisions", kind: "list", addLabel: "Add decision", itemFields: [
      { name: "decision", label: "Decision", kind: "text" },
    ]},
    { name: "actions", label: "Action items", kind: "list", addLabel: "Add action", itemFields: [
      { name: "who", label: "Who", kind: "text" },
      { name: "what", label: "What", kind: "text" },
      { name: "when", label: "By when", kind: "text" },
    ]},
    { name: "openQuestions", label: "Open questions", kind: "list", addLabel: "Add question", itemFields: [
      { name: "question", label: "Question", kind: "text" },
    ]},
  ]},
  { id: "tech-review", title: "Tech Review", intro: "Feasibility, delivery risks, SA questions.", fields: [
    { name: "documentType", label: "Document type", kind: "text", placeholder: "e.g. Architecture proposal" },
    { name: "summary", label: "Plain-English summary", kind: "textarea", required: true },
    { name: "implications", label: "Delivery implications", kind: "list", addLabel: "Add implication", itemFields: [
      { name: "item", label: "Implication", kind: "text" },
    ]},
    { name: "risks", label: "Risks surfaced", kind: "list", addLabel: "Add risk", itemFields: [
      { name: "risk", label: "Risk", kind: "text" },
      { name: "likelihood", label: "Likelihood", kind: "select", options: HML },
      { name: "impact", label: "Impact", kind: "select", options: HML },
    ]},
    { name: "dependencies", label: "Dependencies", kind: "list", addLabel: "Add dependency", itemFields: [
      { name: "dependency", label: "Dependency", kind: "text" },
    ]},
    { name: "questions", label: "Questions for the SA", kind: "list", addLabel: "Add question", itemFields: [
      { name: "question", label: "Question", kind: "text" },
    ]},
    { name: "scopeImplications", label: "Scope implications", kind: "textarea" },
    { name: "verdict", label: "Feasibility verdict", kind: "text" },
  ]},
  { id: "retrospective", title: "Retrospective", intro: "What went well, what didn't, owned actions.", fields: [
    { name: "sprint", label: "Sprint", kind: "text" },
    { name: "outcome", label: "Sprint outcome", kind: "text" },
    { name: "attendees", label: "Attendees", kind: "tags", placeholder: "Type a name and press Enter" },
    { name: "wentWell", label: "What went well", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Item", kind: "text" },
    ]},
    { name: "didnt", label: "What didn't", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Theme / what happened", kind: "text" },
      { name: "impact", label: "Impact", kind: "text" },
    ]},
    { name: "actions", label: "Action items", kind: "list", addLabel: "Add action", itemFields: [
      { name: "action", label: "Action", kind: "text" },
      { name: "owner", label: "Owner", kind: "text" },
      { name: "by", label: "By when", kind: "text" },
    ]},
    { name: "sentiment", label: "Team sentiment", kind: "text" },
  ]},
  { id: "stakeholder-update", title: "Stakeholder Update", intro: "Audience-ready status comms.", fields: [
    { name: "audience", label: "Audience", kind: "text" },
    { name: "status", label: "Overall status", kind: "select", options: UPDATE_STATUS },
    { name: "headline", label: "Headline", kind: "textarea", required: true },
    { name: "progress", label: "Progress since last update", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Update", kind: "text" },
    ]},
    { name: "comingNext", label: "Coming next", kind: "list", addLabel: "Add item", itemFields: [
      { name: "item", label: "Next", kind: "text" },
    ]},
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
    ]},
  ]},
  { id: "roadmap", title: "Roadmap", intro: "Sprint/week timeline; tasks render as bars.", fields: [
    { name: "goal", label: "Goal", kind: "text", required: true },
    { name: "horizon", label: "Horizon", kind: "text", placeholder: "e.g. Next 8 weeks" },
    { name: "weeks", label: "Total weeks", kind: "select", options: WEEKS },
    { name: "tasks", label: "Tasks", kind: "list", addLabel: "Add task", required: true, itemFields: [
      { name: "name", label: "Task", kind: "text" },
      { name: "lane", label: "Sprint / lane", kind: "text", placeholder: "e.g. Sprint 1" },
      { name: "startWeek", label: "Start week", kind: "select", options: WEEKNUM },
      { name: "endWeek", label: "End week", kind: "select", options: WEEKNUM },
      { name: "startDate", label: "Start date", kind: "text", placeholder: "optional, e.g. 2026-06-09" },
      { name: "endDate", label: "End date", kind: "text", placeholder: "optional" },
    ]},
  ]},
  { id: "budget-tracker", title: "Budget Tracker", intro: "Developer costs mapped against the budget.", fields: [
    { name: "project", label: "Project", kind: "text" },
    { name: "budget", label: "Total approved budget", kind: "text", placeholder: "e.g. 80000" },
    { name: "developers", label: "Developers", kind: "list", addLabel: "Add developer", required: true, itemFields: [
      { name: "name", label: "Developer", kind: "text" },
      { name: "hours", label: "Hours", kind: "text" },
      { name: "rate", label: "Cost / hour", kind: "text" },
    ]},
  ]},
];

/** Pre-filled test data so every section is ready to view. */
export const TEST_DATA: OnbData = {
  triage: {
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
      { point: "Channels (email / SMS / webhook / in-app)?" },
      { point: "Events beyond failures (partial, reversals, retries)?" },
      { point: "Who receives the notification?" },
      { point: "Existing infra to build on?" },
      { point: "Is 6 weeks for MVP or full feature?" },
    ],
    concerns: [
      { point: '"Real-time" undefined (30s vs 5min)' },
      { point: "6 weeks is aggressive" },
      { point: "$80k may not cover full scope" },
    ],
    classification: "New Feature - Medium/High complexity",
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
    outOfScope: [{ item: "SMS and push notifications" }, { item: "Webhook delivery (phase 2)" }, { item: "End-user notifications" }],
    deliverables: [
      { deliverable: "Notification engine (email)", due: "Sprint 1" },
      { deliverable: "Recipient management", due: "Sprint 2" },
    ],
    milestones: [
      { milestone: "Charter sign-off", date: "2026-06-02" },
      { milestone: "Email MVP to staging", date: "2026-06-20" },
      { milestone: "Conference demo", date: "2026-07-13" },
    ],
    budget: [{ item: "Engineering (4 people, 6 weeks)", amount: "$72k" }, { item: "SendGrid + infra", amount: "$8k" }],
    risks: [
      { risk: "Event streaming infra not in place", likelihood: "M", impact: "H", response: "Spike in Week 1" },
      { risk: "6-week deadline for MVP only", likelihood: "H", impact: "H", response: "Confirm scope with Sarah" },
    ],
    approvals: [{ role: "Sponsor", name: "Sarah Chen" }, { role: "Tech Lead", name: "Marcus Reid" }, { role: "Project Manager", name: "" }],
  },
  discovery: {
    problem: "Enterprise clients have no proactive signal for payment failures; they learn from their own customers. The root need is a timely, configurable alert, not a dashboard.",
    success: "A notification is delivered within 60 seconds of a payment event to the right account contacts.",
    affected: [
      { stakeholder: "Enterprise finance teams", pain: "Find out about failures from angry customers" },
      { stakeholder: "Finwave support", pain: "High volume of avoidable tickets" },
    ],
    findings: [
      { finding: "Kafka event layer already exists and can be reused", confidence: "High" },
      { finding: "MVP is email + in-app; in-app is a stretch", confidence: "High" },
      { finding: "Recipients configured at account level, not per user", confidence: "Medium" },
    ],
    conflicts: [{ conflict: "Sarah wants webhooks soon; engineering wants email-only for MVP" }],
    unknowns: [
      { unknown: "Email delivery failure handling (retry vs alert)", resolve: "Confirm with Marcus" },
      { unknown: "Notification history retention", resolve: "Confirm with Sarah" },
    ],
    nextSteps: [
      { action: "Confirm Kafka consumer for payment events", owner: "Marcus", by: "2026-06-03" },
      { action: "Circulate charter for sign-off", owner: "PM", by: "2026-06-02" },
    ],
    attendees: ["PM", "Tech lead", "QA lead", "Sponsor"],
  },
  prd: {
    scopeChanges: [
      { change: "In-app notification centre added", original: "SOW scoped email only", updated: "Email MVP + optional in-app centre (Could)", reason: "Confirmed by Sarah on kickoff call" },
      { change: "SMS deferred", original: "Brief implied SMS at launch", updated: "SMS moved to phase 2", reason: "Confirmed by Marcus, capacity" },
    ],
    background: "Enterprise clients need proactive notification of payment failures. This PRD covers the email MVP delivered on the existing Kafka event bus, with configurable recipients per account.",
    goals: [
      { goal: "Proactive failure notifications", metric: "Event-to-email time", target: "< 60s" },
      { goal: "Reduce support tickets", metric: "Payment-confusion tickets", target: "-40% in 60 days" },
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
      { dependency: "Kafka payment topic", type: "Internal platform", owner: "Platform", status: "Available" },
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
          title: "Consume payment events from Kafka", points: "5", status: "In Progress",
          asA: "notification service", iWant: "consume payment_failed, retried and resolved events", soThat: "I can trigger notifications in real time",
          criteria: "Given a payment_failed event is published, when the consumer reads it, then a notification job is queued within 5 seconds\nGiven a duplicate event id, when read again, then no second job is queued (Redis dedup)\nGiven the consumer reconnects, then it resumes from its last committed offset without skipping events",
        },
        {
          title: "Send email via SendGrid", points: "5", status: "To Do",
          asA: "enterprise client contact", iWant: "receive an email when a payment event occurs", soThat: "I learn about failures before my customers call",
          criteria: "Given a queued notification job, when processed, then an email is sent within 60 seconds of the event\nGiven SendGrid returns a 5xx, then the job retries up to 3 times then dead-letters\nError: on permanent failure, log the event id and surface it in the delivery report",
        },
        {
          title: "Recipient lookup service", points: "3", status: "To Do",
          asA: "notification service", iWant: "resolve the configured recipients for an account", soThat: "emails reach the right people",
          criteria: "Given an account id, when looked up, then all active recipients are returned\nGiven no recipients configured, then the event is logged and no email is sent",
        },
        {
          title: "Email templates", points: "2", status: "To Do",
          asA: "client contact", iWant: "a clear, branded failure email", soThat: "I can act quickly",
          criteria: "Given a payment_failed event, then the email shows amount, account, failure reason and timestamp\nCopy is approved by Sarah before release",
        },
      ]},
      { name: "Notification Recipient Management", stories: [
        {
          title: "Account settings screen", points: "3", status: "To Do",
          asA: "enterprise admin", iWant: "add or remove notification recipients", soThat: "the right team is alerted",
          criteria: "Given the settings screen, when I add a valid email, then it appears in the recipient list\nGiven an invalid email, then show \"Enter a valid email address\" and do not save\nGiven I remove a recipient, then they stop receiving notifications immediately",
        },
      ]},
      { name: "Notification History (stretch)", stories: [
        {
          title: "Notification history endpoint", points: "3", status: "To Do",
          asA: "enterprise admin", iWant: "see the last 30 days of notifications", soThat: "I can audit what was sent",
          criteria: "Given the history view, then notifications from the last 30 days are listed newest first\nGiven zero notifications, then show \"No notifications in the last 30 days\"",
        },
      ]},
    ],
  },
  "sprint-sow": {
    sprintGoal: "Deliver a working payment notification engine that sends emails within 60s, with deduplication.",
    overview: "Sprint 1 establishes the Kafka consumer, the SendGrid email path, and Redis deduplication. Recipient management and the in-app centre are out of scope for this sprint.",
    startDate: "2026-06-09",
    endDate: "2026-06-20",
    team: [
      { member: "Marcus", role: "BE", tickets: "NOTIF-2, NOTIF-4" },
      { member: "Aiko", role: "BE", tickets: "NOTIF-3, NOTIF-5" },
      { member: "Priya", role: "QA", tickets: "All" },
    ],
    deliverables: [
      { deliverable: "Kafka consumer", description: "Consumes payment events, dedups via Redis", assignee: "Marcus" },
      { deliverable: "SendGrid integration", description: "Sends event emails with retry", assignee: "Aiko" },
      { deliverable: "Recipient lookup service", description: "Resolves account recipients", assignee: "Marcus" },
    ],
    outOfScope: [{ item: "Recipient management UI (Sprint 2)" }, { item: "In-app notification centre (stretch)" }],
    dod: [
      { condition: "Code reviewed and merged to main" },
      { condition: "Unit and integration tests passing in CI" },
      { condition: "Email delivery confirmed in staging for all 3 event types" },
      { condition: "Redis dedup verified - no duplicate sends on replay" },
      { condition: "QA sign-off from Priya" },
    ],
  },
  "sprint-planning": {
    team: [
      { person: "Marcus (BE)", availableDays: "10", points: "13", notes: "Full availability" },
      { person: "Aiko (BE)", availableDays: "9", points: "13", notes: "1 day PTO" },
      { person: "Priya (QA)", availableDays: "10", points: "8", notes: "QA, not story points" },
      { person: "Lin (FE, 50%)", availableDays: "5", points: "5", notes: "50% allocated" },
    ],
    backlog: [
      { priority: "P0", item: "NOTIF-2 Kafka consumer", points: "5", owner: "Marcus", dependencies: "Redis provisioned" },
      { priority: "P0", item: "NOTIF-3 SendGrid integration", points: "5", owner: "Aiko", dependencies: "API key in prod" },
      { priority: "P1", item: "NOTIF-4 Recipient lookup", points: "3", owner: "Marcus" },
      { priority: "P1", item: "NOTIF-5 Email templates", points: "2", owner: "Aiko", dependencies: "Copy from Sarah" },
      { priority: "P2", item: "NOTIF-6 History endpoint", points: "3", owner: "Lin" },
    ],
  },
  "release-checklist": {
    release: "Notifications v1 (email + webhooks)",
    releaseType: "planned",
    targetDate: "2026-07-03",
    items: [
      { category: "Feature Readiness", item: "All in-scope stories Done", status: "FAIL", note: "NOTIF-7, NOTIF-8 still in QA" },
      { category: "Testing", item: "QA sign-off received", status: "RISK", note: "Webhooks outstanding" },
      { category: "Operational Readiness", item: "Rollback plan reviewed", status: "UNCONFIRMED", note: "Exists but unreviewed" },
      { category: "Approvals", item: "PM sign-off", status: "PASS" },
    ],
  },
  "sprint-report": {
    sprint: "Sprint 1 - Notifications",
    day: "7", totalDays: "10", status: "amber", confidence: "72",
    committed: "18", completed: "7",
    forecast: "4 of 5 items likely complete (NOTIF-6 at risk).",
    summary: "Sprint 1 is on track for the P0 items but NOTIF-6 is blocked on an infra misconfiguration. NOTIF-4 has not started and must begin today to finish by sprint end.",
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
  },
  "decision-log": {
    project: "Finwave Real-Time Notifications",
    entries: [
      {
        area: "Scope",
        originalPlan: "Webhook delivery in Phase 2 (post-MVP)",
        revisedPlan: "Webhook delivery moved into Sprint 2",
        reason: "Enterprise client request ahead of the Salesforce conference",
        changeProposedBy: "Sarah Chen",
        deliveryImpact: "Sprint 2 capacity reduced; NOTIF-6 deferred to Sprint 3",
        technicalImpact: "New webhook service required in Sprint 2",
        productOwnerImpact: "Notification history de-prioritised to Sprint 3",
        costImpact: "Neutral - within $80k budget",
        changeStatus: "Approved",
        changeApprovedBy: "Sarah Chen",
      },
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
      { note: "MVP is email only; in-app notification centre is a stretch goal." },
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
    ],
    openQuestions: [
      { question: "Email delivery failure: retry or alert?" },
      { question: "Is a notification history view required?" },
    ],
  },
  "tech-review": {
    documentType: "Architecture proposal",
    summary: "Kafka event bus to a new notification microservice, emails via SendGrid, Redis to prevent duplicate sends, feature flag for per-client rollout.",
    implications: [
      { item: "6 weeks feasible for email only - Kafka already in place" },
      { item: "Redis deduplication adds ~3 days not in the original estimate" },
      { item: "SendGrid API key needed in prod before Week 3" },
    ],
    risks: [
      { risk: "Redis not in current prod stack", likelihood: "M", impact: "H" },
      { risk: "SendGrid rate limits under peak volume", likelihood: "L", impact: "M" },
    ],
    dependencies: [{ dependency: "Redis provisioned in prod" }, { dependency: "SendGrid prod API key before Week 3" }],
    questions: [
      { question: "Is Redis already provisioned in prod?" },
      { question: "Does the SendGrid tier support enterprise volume?" },
      { question: "How does the feature flag interact with account settings?" },
    ],
    scopeImplications: "Redis deduplication adds ~3 days not in the original estimate; flag this against the 6-week deadline.",
    verdict: "Feasible with conditions - resolve Redis provisioning before Week 3.",
  },
  retrospective: {
    sprint: "Sprint 1",
    outcome: "Shipped the email engine to staging; one stretch item carried over.",
    attendees: ["Marcus", "Aiko", "Priya", "Lin", "PM"],
    wentWell: [{ item: "Kafka reuse saved a week" }, { item: "Daily QA pairing caught issues early" }],
    didnt: [
      { item: "Redis region misconfig blocked NOTIF-6", impact: "Lost two days; stretch slipped" },
      { item: "Email copy arrived late", impact: "Template build started a day late" },
    ],
    actions: [
      { action: "Add infra readiness check to sprint planning", owner: "PM", by: "Sprint 2 planning" },
      { action: "Lock content deadlines in the SOW", owner: "Sarah", by: "Sprint 2 SOW" },
    ],
    sentiment: "Positive - team felt the MVP was achievable and momentum is good.",
  },
  "stakeholder-update": {
    audience: "Sarah Chen (Sponsor)",
    status: "At risk",
    headline: "Notification engine on track for email MVP; one infra blocker being resolved.",
    progress: [
      { item: "Kafka consumer and dedup complete (NOTIF-2)" },
      { item: "Email templates approved (NOTIF-5)" },
    ],
    comingNext: [{ item: "SendGrid integration to staging" }, { item: "Start webhook spike for Sprint 2" }],
    risks: [{ risk: "NOTIF-6 blocked on Redis region", impact: "Stretch item at risk", action: "Infra ticket raised, chasing ETA" }],
    asks: [{ ask: "Confirm webhook scope for Sprint 2", owner: "Sarah", by: "Friday" }],
    keyDates: [{ milestone: "Email MVP to staging", date: "2026-06-20" }, { milestone: "Conference demo", date: "2026-07-13" }],
  },
  roadmap: {
    goal: "Ship real-time notifications before the Salesforce conference",
    horizon: "Next 8 weeks",
    weeks: "8",
    tasks: [
      { name: "Discovery + charter", lane: "Sprint 0", startWeek: "1", endWeek: "1", startDate: "2026-06-01", endDate: "2026-06-05" },
      { name: "Notification engine (email)", lane: "Sprint 1", startWeek: "2", endWeek: "3", startDate: "2026-06-09", endDate: "2026-06-20" },
      { name: "Recipient management", lane: "Sprint 1", startWeek: "3", endWeek: "4", startDate: "2026-06-16", endDate: "2026-06-27" },
      { name: "Webhook delivery", lane: "Sprint 2", startWeek: "5", endWeek: "6", startDate: "2026-06-30", endDate: "2026-07-11" },
      { name: "Hardening + release", lane: "Sprint 2", startWeek: "7", endWeek: "8", startDate: "2026-07-14", endDate: "2026-07-25" },
    ],
  },
  "budget-tracker": {
    project: "Finwave Notifications",
    budget: "80000",
    developers: [
      { name: "Marcus (BE)", hours: "160", rate: "120" },
      { name: "Aiko (BE)", hours: "150", rate: "110" },
      { name: "Lin (FE)", hours: "80", rate: "100" },
      { name: "Priya (QA)", hours: "120", rate: "90" },
    ],
  },
};
