import type { OnbData } from "@/components/onboarding/steps";

/**
 * Pre-built stub for Finwave / Customer Portal. Seeded so the project ships
 * populated (a self-service portal where enterprise clients manage their
 * account, view statements and payment history, manage users, and raise
 * support tickets).
 */
export const PORTAL_DATA: OnbData = {
  triage: {
    requestSummary: "Finwave's enterprise clients have no self-service portal, so they email account managers for statements, user changes, and payment history. The team wants a customer portal to cut that load.",
    businessGoal: "Reduce account-management workload and improve client satisfaction by letting clients self-serve common account tasks.",
    stakeholderNeed: "Enterprise client admins need to view statements, manage their users, and see payment history without contacting Finwave.",
    whatIsClear: [
      { point: "Audience: enterprise client admins" },
      { point: "Core needs: statements, user management, payment history" },
      { point: "Must reuse the existing auth and billing systems" },
    ],
    missingInfo: [
      { point: "Is SSO / SAML required for enterprise clients?" },
      { point: "Which roles and permissions are needed inside a client account?" },
      { point: "Do clients need to download statements as PDF or CSV?" },
    ],
    concerns: [
      { point: "Access control across client tenants must be airtight" },
      { point: "Statement data volume could be large for big clients" },
    ],
    classification: "New product surface - Medium/High complexity",
    nextStep: "Run a discovery session with two pilot clients and the account-management team.",
  },
  "risk-scan": {
    risks: [
      { risk: "Cross-tenant data leakage (one client sees another's data)", category: "Technical", likelihood: "M", impact: "H", detectability: "Hard", velocity: "Fast", priority: "Act now", response: "Mitigate", proximity: "Week 1-2", owner: "Tech Lead" },
      { risk: "SSO/SAML scope underestimated", category: "Technical", likelihood: "M", impact: "M", detectability: "Moderate", velocity: "Medium", priority: "Monitor", response: "Mitigate", proximity: "Month 1", owner: "PM" },
      { risk: "Statement data volume slows the portal", category: "Technical", likelihood: "M", impact: "M", detectability: "Moderate", velocity: "Slow", priority: "Monitor", response: "Mitigate", proximity: "Month 2-3", owner: "BE Lead" },
      { risk: "Pilot clients delay feedback", category: "Stakeholder", likelihood: "H", impact: "M", detectability: "Easy", velocity: "Medium", priority: "Contingency", response: "Escalate", proximity: "Month 1", owner: "PM" },
    ],
  },
  charter: {
    purpose: "Finwave clients depend on account managers for routine account tasks. This project delivers a secure self-service portal so client admins can do those tasks themselves.",
    sponsor: "Head of Client Success, Finwave",
    inScope: [{ item: "Statements and payment history" }, { item: "Client user management" }, { item: "Support ticket creation" }],
    objectives: [
      { objective: "Self-service statements and payment history" },
      { objective: "Client-side user and role management" },
      { objective: "Reduce account-management tickets by 35%" },
    ],
    outOfScope: [{ item: "End-customer (payer) access" }, { item: "In-portal payments (handled by the notifications project)" }, { item: "Mobile app" }],
    deliverables: [
      { deliverable: "Authenticated portal shell + tenant isolation", due: "Sprint 1" },
      { deliverable: "Statements + payment history", due: "Sprint 2" },
      { deliverable: "User management + support tickets", due: "Sprint 3" },
    ],
    milestones: [
      { milestone: "Charter sign-off", date: "2026-06-10" },
      { milestone: "Pilot with 2 clients", date: "2026-07-15" },
      { milestone: "GA", date: "2026-08-12" },
    ],
    budget: [{ item: "Engineering (3 sprints)", amount: "$95k" }, { item: "Security review", amount: "$10k" }],
    risks: [
      { risk: "Cross-tenant data leakage", likelihood: "M", impact: "H", response: "Tenant isolation review + pen test" },
      { risk: "SSO scope underestimated", likelihood: "M", impact: "M", response: "Spike SAML in Week 1" },
    ],
    approvals: [{ role: "Sponsor", name: "Head of Client Success" }, { role: "Security", name: "CISO office" }, { role: "Project Manager", name: "" }],
  },
  discovery: {
    problem: "Client admins cannot self-serve, so every statement request or user change becomes an account-manager ticket, which is slow for clients and costly for Finwave.",
    success: "Pilot clients complete statement retrieval and user management in the portal without raising a ticket.",
    affected: [
      { stakeholder: "Client admins", pain: "Wait days for statements and user changes" },
      { stakeholder: "Account managers", pain: "Swamped with routine requests" },
    ],
    findings: [
      { finding: "Auth and billing systems can be reused via internal APIs", confidence: "High" },
      { finding: "SSO is a hard requirement for the two largest clients", confidence: "Medium" },
      { finding: "Statements are the most-requested item", confidence: "High" },
    ],
    conflicts: [{ conflict: "Security wants SSO at launch, and delivery wants it in phase 2" }],
    unknowns: [
      { unknown: "Role model inside a client account", resolve: "Workshop with two pilot clients" },
      { unknown: "Statement export format (PDF vs CSV)", resolve: "Confirm with Client Success" },
    ],
    nextSteps: [
      { action: "Run the pilot-client discovery workshop", owner: "PM", by: "2026-06-12" },
      { action: "Spike tenant isolation approach", owner: "Tech Lead", by: "2026-06-13" },
    ],
    attendees: ["Head of Client Success", "Security", "BE Lead", "PM"],
  },
  prd: {
    background: "A secure, multi-tenant self-service portal for Finwave's enterprise clients, reusing the existing auth and billing systems.",
    goals: [
      { goal: "Fast self-service statements", metric: "Statement retrieval time", target: "< 3s" },
      { goal: "Reduce account tickets", metric: "Routine account tickets", target: "-35% in 90 days" },
    ],
    users: [
      { role: "Client admin", need: "Manage users and view statements" },
      { role: "Client viewer", need: "View statements and payment history only" },
    ],
    functional: [
      { requirement: "Authenticated, tenant-isolated portal", priority: "Must", notes: "No cross-tenant access" },
      { requirement: "View and download statements", priority: "Must", notes: "PDF + CSV" },
      { requirement: "View payment history", priority: "Must" },
      { requirement: "Manage client users and roles", priority: "Must" },
      { requirement: "Raise and track support tickets", priority: "Should" },
      { requirement: "SSO / SAML login", priority: "Should", notes: "Phase 1 if feasible" },
    ],
    nonFunctional: [
      { category: "Security", requirement: "Tenant isolation verified by pen test", target: "Zero cross-tenant findings" },
      { category: "Performance", requirement: "Statement list load", target: "< 3s p95" },
    ],
    outOfScope: [{ item: "End-customer access" }, { item: "In-portal payments" }, { item: "Mobile app" }],
    dependencies: [
      { dependency: "Auth service (SSO)", owner: "Platform", status: "Available" },
      { dependency: "Billing/statements API", owner: "Billing", status: "Available" },
    ],
    openQuestions: [
      { question: "SSO at launch or phase 2?", owner: "Security", by: "Week 1" },
      { question: "Statement export format?", owner: "Client Success", by: "Week 1" },
    ],
  },
  stories: {
    epics: [
      { name: "Portal Access & Tenancy", stories: [
        {
          title: "Authenticated portal with tenant isolation", points: "8", status: "To Do",
          asA: "client admin", iWant: "log in and only see my organisation's data", soThat: "our data stays private",
          criteria: "Given I log in, then I only see my organisation's accounts and statements\nGiven I request another tenant's resource id, then the request is rejected with 403\nGiven my session expires, then I am redirected to sign-in",
        },
        {
          title: "Manage client users and roles", points: "5", status: "To Do",
          asA: "client admin", iWant: "add, remove, and assign roles to my users", soThat: "the right people have access",
          criteria: "Given I add a user with a valid email, then they receive an invite\nGiven I assign the Viewer role, then that user cannot manage users\nGiven I remove a user, then their access is revoked immediately",
        },
      ]},
      { name: "Statements & History", stories: [
        {
          title: "View and download statements", points: "5", status: "To Do",
          asA: "client admin", iWant: "view and download my statements", soThat: "I do not need to email my account manager",
          criteria: "Given the statements list, then statements are shown newest first\nGiven I click download, then a PDF or CSV downloads within 3 seconds\nGiven zero statements, then show \"No statements available yet\"",
        },
        {
          title: "View payment history", points: "3", status: "To Do",
          asA: "client viewer", iWant: "see past payments and their status", soThat: "I can reconcile our records",
          criteria: "Given the history view, then payments show date, amount, method and status\nGiven a failed payment, then it is clearly flagged",
        },
      ]},
    ],
  },
  "sprint-sow": {
    sprintGoal: "Ship the authenticated, tenant-isolated portal shell to staging",
    overview: "Sprint 1 stands up the portal shell, authentication, and tenant isolation. Statements and user management follow in later sprints.",
    deliverables: [
      { deliverable: "Portal shell + auth", description: "Login, session handling, navigation", assignee: "Dev B" },
      { deliverable: "Tenant isolation layer", description: "Scoped data access per organisation", assignee: "Dev A" },
      { deliverable: "Security review hooks", description: "Audit logging for access", assignee: "Dev A" },
    ],
    outOfScope: [{ item: "Statements (Sprint 2)" }, { item: "SSO (spike only this sprint)" }],
    dod: [
      { condition: "Code reviewed and merged to main" },
      { condition: "Tenant isolation covered by integration tests" },
      { condition: "Access audit logging in place" },
      { condition: "QA sign-off" },
    ],
  },
  "sprint-planning": {
    team: [
      { person: "Dev A (BE)", availableDays: "10", points: "13", notes: "Owns tenancy/security" },
      { person: "Dev B (FE)", availableDays: "10", points: "13", notes: "Owns portal shell" },
      { person: "Dev C (FE)", availableDays: "7", points: "5", notes: "3 days on another project" },
      { person: "QA", availableDays: "10", points: "5", notes: "QA, not story points" },
    ],
    backlog: [
      { priority: "P0", item: "Authenticated portal shell", points: "8", owner: "Dev B", dependencies: "Auth service" },
      { priority: "P0", item: "Tenant isolation layer", points: "8", owner: "Dev A", dependencies: "Billing API scopes" },
      { priority: "P1", item: "Access audit logging", points: "3", owner: "Dev A" },
      { priority: "P2", item: "SSO spike", points: "3", owner: "Dev A", dependencies: "Security input" },
    ],
  },
  roadmap: {
    goal: "Launch the enterprise self-service portal in three sprints",
    horizon: "Next 8 weeks",
    weeks: "8",
    tasks: [
      { name: "Discovery + tenancy spike", lane: "Sprint 0", startWeek: "1", endWeek: "1", startDate: "2026-06-08", endDate: "2026-06-12" },
      { name: "Portal shell + auth", lane: "Sprint 1", startWeek: "2", endWeek: "3", startDate: "2026-06-15", endDate: "2026-06-26" },
      { name: "Statements + history", lane: "Sprint 2", startWeek: "4", endWeek: "5", startDate: "2026-06-29", endDate: "2026-07-10" },
      { name: "User mgmt + tickets + launch", lane: "Sprint 3", startWeek: "6", endWeek: "8", startDate: "2026-07-13", endDate: "2026-07-31" },
    ],
  },
  "budget-tracker": {
    project: "Finwave Customer Portal",
    budget: "105000",
    developers: [
      { name: "Dev A (BE)", hours: "240", rate: "120" },
      { name: "Dev B (FE)", hours: "240", rate: "110" },
      { name: "Dev C (FE)", hours: "120", rate: "100" },
      { name: "QA", hours: "160", rate: "90" },
    ],
  },
};
