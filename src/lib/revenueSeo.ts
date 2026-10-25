export type RevenueSeoPage = {
  slug: string;
  metadataTitle: string;
  description: string;
  eyebrow: string;
  title: string;
  lead: string;
  serviceType: string;
  audience: string;
  problems: string[];
  outcomes: string[];
  workflow: string[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  faqs: { question: string; answer: string }[];
};

export const REVENUE_SEO_PAGES: Record<string, RevenueSeoPage> = {
  "pay-per-hire": {
    slug: "pay-per-hire",
    metadataTitle: "Pay Per Hire Recruitment India | 8.33% & Flat Fix Charge | HireGo AI",
    description: "HireGo AI Pay Per Hire Managed Recruitment: Job-ready candidates delivered in minutes with video resumes and proctored code. 8.33% success fee (or Flat Fix Charge), 45-day replacement, invoice on Day 25, Net-30 payment.",
    eyebrow: "Managed hiring",
    title: "Pay Per Hire recruitment built around a successful hiring outcome.",
    lead: "Share your hiring requirements. HireGo matches job-ready, video-screened, and code-proctored candidates in just minutes. Choose our standard 8.33% contingent model (with 45-day replacement guarantee and Net-30 payment terms) or discuss a Fixed Flat Charge plan tailored in a meeting with our team.",
    serviceType: "Pay Per Hire recruitment and managed hiring",
    audience: "Employers, startups and enterprises that need high-velocity hiring with zero upfront risk and flexible commercial models (8.33% or Fixed Flat Charge).",
    problems: [
      "Traditional agency retainers demand high upfront fees with zero outcome guarantee.",
      "Delays in receiving unvetted keyword resumes without verification.",
      "Rigid percentage structures that inflate hiring budgets during salary negotiations."
    ],
    outcomes: [
      "Calibrated, job-ready candidates delivered in minutes with verified video resumes.",
      "Fair 8.33% success fee (or custom Fixed Flat Charge) strictly payable after joining.",
      "45-day free replacement guarantee covering two full development sprint cycles.",
      "Invoices raised on Day 25 post-joining with standard 30-day payment clearance."
    ],
    workflow: [
      "Define role requirements & select commercial model (8.33% or Flat Fix Charge in meeting)",
      "Job-ready candidates delivered in minutes with 2-minute video resumes & proctored coding scores",
      "Company HR conducts final interviews and retains 100% hiring authority",
      "Candidate accepts offer and joins with ₹0 upfront fees",
      "Invoice raised on Day 25 post-joining; payment strictly due within 30 days (delay modifies terms)",
      "45-day free replacement guarantee active across all placements"
    ],
    primaryCta: { label: "Discuss a role", href: "/contact" },
    secondaryCta: { label: "See employer plans", href: "/pricing" },
    faqs: [
      {
        question: "What does Pay Per Hire mean on HireGo AI?",
        answer: "Pay Per Hire is a managed hiring model where you pay strictly upon successful joining. We offer a standard 8.33% success fee (1-month CTC equivalent) backed by a 45-day free replacement warranty, as well as an optional Fixed Flat Charge plan discussed in a meeting with our leadership."
      },
      {
        question: "How fast does HireGo deliver candidate shortlists?",
        answer: "HireGo delivers job-ready, calibrated candidates in just minutes rather than 72 hours. Our autonomous hiring OS continuously pre-screens software engineers with verified video resumes and anti-cheat coding sandboxes."
      },
      {
        question: "When is the invoice raised and what are the payment terms?",
        answer: "The invoice is officially raised on Day 25 post-joining. Payment is strictly due within 30 days of the candidate's joining date. Across all Managed Hiring plans, payment terms are strictly within 30 days; if payment is delayed, commercial terms and warranties are subject to change."
      },
      {
        question: "How does the Fixed Flat Charge plan work?",
        answer: "For companies hiring cohorts or needing predictable recruiting budgets, HireGo offers a Flat Fix Charge instead of a CTC percentage. The exact flat fee is discussed, calibrated, and finalized in a meeting with the HireGo team based on role type, tech stack, and volume."
      },
      {
        question: "Does HireGo decide who gets hired?",
        answer: "No. HireGo executes sourcing, proctoring, video screening, and calendar dispatch, while your company HR and engineering leaders conduct final interviews and make all consequential hiring decisions."
      }
    ]
  },
  "ai-hiring-copilot": {
    slug: "ai-hiring-copilot",
    metadataTitle: "AI Hiring Co-Pilot for Employers | HireGo AI",
    description: "HireGo AI Employer Co-Pilot supports sourcing, screening, assessments, scheduling and follow-up while people make consequential hiring decisions.",
    eyebrow: "Recruiting operations",
    title: "An AI hiring Co-Pilot that keeps the recruiting workflow moving.",
    lead: "Employer Co-Pilot is designed to reduce repetitive coordination between jobs, candidates, assessments, interview rounds and follow-up while preserving human approvals for consequential actions.",
    serviceType: "AI hiring copilot and recruitment workflow automation",
    audience: "Startups, recruiting teams and growing companies that want automation without handing hiring decisions to software.",
    problems: [
      "Recruiters spend time checking stages and chasing next actions.",
      "Scheduling, reminders and assessment routing create operational drag.",
      "Hiring context gets lost between separate tools and team members."
    ],
    outcomes: [
      "One connected operational view around the hiring requirement.",
      "Permitted workflow actions can move without repeated manual coordination.",
      "Human approval remains at consequential hiring checkpoints."
    ],
    workflow: [
      "Create or connect the hiring requirement",
      "Configure the permitted workflow and limits",
      "Organize candidates and screening evidence",
      "Route configured assessments and interview operations",
      "Surface actions that require human review",
      "Keep workflow history and next steps connected"
    ],
    primaryCta: { label: "Start as an employer", href: "/register?type=employer" },
    secondaryCta: { label: "Compare plans", href: "/pricing" },
    faqs: [
      { question: "Is HireGo Co-Pilot an autonomous hiring decision maker?", answer: "No. It is an operations layer for permitted recruiting work. Selection, rejection, offers and other consequential actions remain subject to authorized human control." },
      { question: "What can a hiring Co-Pilot automate?", answer: "Depending on configuration, it can help coordinate workflow tasks such as candidate organization, assessment routing, interview scheduling, reminders and follow-up." },
      { question: "Who is Employer Co-Pilot for?", answer: "It is designed for employers that already know how they want to hire but need less manual coordination between stages, tools and participants." }
    ]
  },
  "candidate-screening-software": {
    slug: "candidate-screening-software",
    metadataTitle: "Candidate Screening Software | HireGo AI",
    description: "Structure candidate screening around role requirements, experience, skills and assessment evidence. People remain responsible for hiring decisions.",
    eyebrow: "Candidate screening",
    title: "Candidate screening software that organizes evidence before the interview.",
    lead: "HireGo helps employers bring role requirements, candidate experience, skills and available assessment evidence into a structured review workflow instead of relying on disconnected resume checks.",
    serviceType: "Candidate screening and structured recruitment workflow",
    audience: "Employers that need faster, more consistent first-stage review without fabricated fit scores or automatic rejection.",
    problems: [
      "High application volume makes first-stage review slow.",
      "Recruiters compare resumes without a consistent role-specific structure.",
      "Evidence from assessments and prior stages is scattered."
    ],
    outcomes: [
      "Screening criteria tied to the actual role requirement.",
      "Relevant candidate evidence organized for human review.",
      "Clear progression into assessments and interviews where configured."
    ],
    workflow: [
      "Define job requirements",
      "Collect candidate applications and relevant evidence",
      "Organize role-aligned screening signals",
      "Route configured assessments when needed",
      "Human reviewer checks the evidence",
      "Move qualified candidates into the employer interview process"
    ],
    primaryCta: { label: "Start screening candidates", href: "/register?type=employer" },
    secondaryCta: { label: "Explore hiring services", href: "/services#screening" },
    faqs: [
      { question: "Does HireGo automatically reject candidates?", answer: "The public HireGo workflow is designed around human-controlled hiring decisions. Screening evidence can support review, but consequential decisions should remain with authorized people." },
      { question: "What information can be used in screening?", answer: "The workflow can organize job-relevant information such as experience, skills, application details and configured assessment evidence where available." },
      { question: "Can screening connect to interviews?", answer: "Yes. HireGo is designed as a connected hiring workflow so screening, assessments and interview stages can remain attached to the same hiring requirement." }
    ]
  },
  "interview-proctoring-software": {
    slug: "interview-proctoring-software",
    metadataTitle: "Interview Proctoring & Evidence for Hiring Teams | HireGo AI",
    description: "Use HireGo AI proctoring evidence to support human review of configured remote interview and assessment stages without automatic rejection.",
    eyebrow: "Interview integrity",
    title: "Interview proctoring evidence for remote hiring workflows.",
    lead: "HireGo can collect configured proctoring and session evidence around remote assessment or interview stages so reviewers have context when something needs attention. Evidence is for review, not an automatic hiring verdict.",
    serviceType: "Interview and assessment proctoring evidence",
    audience: "Hiring teams running remote assessments or interviews where session integrity and reviewable evidence matter.",
    problems: [
      "Remote hiring makes it harder to understand what happened during a session.",
      "Teams need reviewable evidence instead of unexplained automated flags.",
      "Interview operations and integrity evidence often live in separate systems."
    ],
    outcomes: [
      "Proctoring evidence stays connected to the relevant hiring stage.",
      "Reviewers can inspect recorded signals and context where configured.",
      "Human decision makers determine what the evidence means for the role."
    ],
    workflow: [
      "Configure the relevant assessment or interview stage",
      "Present candidate notices and required acknowledgements",
      "Collect permitted session evidence",
      "Attach evidence to the relevant attempt or interview context",
      "Reviewer examines any flagged or relevant events",
      "Employer follows its human-controlled decision process"
    ],
    primaryCta: { label: "Discuss interview workflows", href: "/contact" },
    secondaryCta: { label: "See interview orchestration", href: "/services#interview-orchestration" },
    faqs: [
      { question: "Does proctoring automatically reject a candidate?", answer: "No. Proctoring evidence should be reviewed in context by an authorized person. A flag alone should not be treated as a hiring verdict." },
      { question: "Where does proctoring fit in HireGo?", answer: "It can support configured assessment and interview stages inside the broader employer hiring workflow." },
      { question: "Can employers use HireGo for multi-round interviews?", answer: "HireGo is designed to coordinate multiple rounds, interviewers, feedback and progression under the employer's configured process." }
    ]
  },
  "ai-mock-interview": {
    slug: "ai-mock-interview",
    metadataTitle: "AI Mock Interview Practice by Role | HireGo AI",
    description: "Practice role-specific interview questions with HireGo AI in structured text-based mock interview sessions before a real interview.",
    eyebrow: "Candidate preparation",
    title: "AI mock interview practice built around the role you want.",
    lead: "Practice job-relevant questions in a structured text-based session, review feedback and improve how you explain your experience before the interview that matters.",
    serviceType: "AI mock interview practice",
    audience: "Candidates preparing for role-specific interviews who want structured practice and feedback.",
    problems: [
      "Generic question lists do not recreate the pressure of answering in sequence.",
      "Candidates know the topic but struggle to structure a clear response.",
      "Preparation is often disconnected from the target role."
    ],
    outcomes: [
      "Role-specific question practice instead of a generic quiz.",
      "A repeatable way to improve answer structure and relevance.",
      "Preparation feedback without turning practice into a hiring decision."
    ],
    workflow: [
      "Choose the target role",
      "Start a mock interview session",
      "Answer the role-related questions",
      "Complete the session",
      "Review preparation feedback",
      "Practice again where you need improvement"
    ],
    primaryCta: { label: "Start candidate account", href: "/register?type=candidate" },
    secondaryCta: { label: "Browse current jobs", href: "/jobs" },
    faqs: [
      { question: "Is the HireGo mock interview a real employer interview?", answer: "No. It is a candidate preparation experience designed to help you practice before a real interview." },
      { question: "Is mock interview feedback used to automatically reject me from jobs?", answer: "No. Mock interview practice is a preparation feature and should not be treated as an employer hiring decision." },
      { question: "Can I practice for a specific role?", answer: "Yes. HireGo can organize mock interview practice around supported target roles so the questions and preparation focus are more relevant." }
    ]
  }
};

export const MOCK_INTERVIEW_ROLES = [
  {
    slug: "software-engineer",
    name: "Software Engineer",
    intro: "Practice explaining technical decisions, debugging trade-offs, project ownership and collaboration in a clear interview-ready structure.",
    focusAreas: ["Technical problem solving", "Project decisions", "Debugging approach", "Collaboration"],
    scenarios: ["Explain a difficult bug you solved", "Describe a system or feature you designed", "Discuss a technical trade-off", "Handle a production issue"]
  },
  {
    slug: "data-analyst",
    name: "Data Analyst",
    intro: "Practice turning data work into clear business explanations across SQL, analysis choices, dashboards and stakeholder questions.",
    focusAreas: ["SQL and analysis", "Business reasoning", "Data quality", "Stakeholder communication"],
    scenarios: ["Explain an analysis from question to recommendation", "Handle missing or inconsistent data", "Defend a metric choice", "Present an insight to a non-technical stakeholder"]
  },
  {
    slug: "sales-executive",
    name: "Sales Executive",
    intro: "Practice prospecting, qualification, objection handling, pipeline discipline and examples of how you moved opportunities forward.",
    focusAreas: ["Prospecting", "Qualification", "Objection handling", "Closing"],
    scenarios: ["Respond to a price objection", "Explain how you qualify a lead", "Recover a stalled opportunity", "Describe a target you achieved"]
  },
  {
    slug: "customer-support",
    name: "Customer Support",
    intro: "Practice customer scenarios that test communication, ownership, de-escalation and the way you balance policy with a useful resolution.",
    focusAreas: ["Customer communication", "De-escalation", "Ownership", "Escalation judgment"],
    scenarios: ["Handle an angry customer", "Explain a complex issue simply", "Prioritize multiple urgent tickets", "Escalate an issue responsibly"]
  },
  {
    slug: "business-analyst",
    name: "Business Analyst",
    intro: "Practice requirement discovery, process analysis, stakeholder alignment and examples that show how you move from ambiguity to a usable solution.",
    focusAreas: ["Requirements", "Process analysis", "Stakeholder alignment", "Documentation"],
    scenarios: ["Clarify an ambiguous requirement", "Resolve stakeholder disagreement", "Map a broken process", "Explain a recommendation with evidence"]
  },
  {
    slug: "product-manager",
    name: "Product Manager",
    intro: "Practice product sense, prioritization, metrics, trade-offs and cross-functional stories without relying on memorized frameworks alone.",
    focusAreas: ["Product sense", "Prioritization", "Metrics", "Cross-functional leadership"],
    scenarios: ["Prioritize competing roadmap requests", "Define success for a feature", "Handle a launch that missed expectations", "Explain a customer-driven product decision"]
  },
  {
    slug: "hr-recruiter",
    name: "HR Recruiter",
    intro: "Practice sourcing, candidate screening, stakeholder management, hiring metrics and difficult recruiting situations.",
    focusAreas: ["Candidate sourcing", "Screening", "Hiring-manager alignment", "Recruiting operations"],
    scenarios: ["Fill a difficult role", "Handle a hiring-manager disagreement", "Improve a weak candidate pipeline", "Explain how you measure recruiting effectiveness"]
  },
  {
    slug: "fresher",
    name: "Fresher",
    intro: "Practice introducing yourself, explaining projects, showing learning ability and answering situational questions when you have limited full-time experience.",
    focusAreas: ["Self introduction", "Projects", "Learning ability", "Situational answers"],
    scenarios: ["Tell me about yourself", "Explain your strongest project", "Describe a challenge you learned from", "Explain why this role fits your goals"]
  }
] as const;

export function findMockInterviewRole(slug: string) {
  return MOCK_INTERVIEW_ROLES.find((role) => role.slug === slug);
}
