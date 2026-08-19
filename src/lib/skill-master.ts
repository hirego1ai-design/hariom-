export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type SkillPriority = "required" | "preferred";

export type RoleDefinition = {
  title: string;
  department: string;
  industry: string;
  aliases?: string[];
};

export type RoleSkillSuggestion = {
  name: string;
  category: "Technical" | "Domain" | "Tools" | "Soft skills";
  priority: SkillPriority;
  recommendedLevel: SkillLevel;
};

// This is the bootstrap catalog. The database models mirror this structure so
// administrators can manage mappings without changing any form code.
export const ROLE_MASTER: RoleDefinition[] = [
  { title: "Software Developer", department: "Engineering", industry: "Technology", aliases: ["Software Engineer", "Full Stack Engineer"] },
  { title: "Frontend Developer", department: "Engineering", industry: "Technology" },
  { title: "Backend Developer", department: "Engineering", industry: "Technology" },
  { title: "Mobile App Developer", department: "Engineering", industry: "Technology", aliases: ["iOS Developer", "Android Developer"] },
  { title: "QA Automation Engineer", department: "Engineering", industry: "Technology", aliases: ["Test Automation Engineer"] },
  { title: "Manual QA Tester", department: "Engineering", industry: "Technology" },
  { title: "Cloud Architect", department: "Engineering", industry: "Technology" },
  { title: "Solutions Architect", department: "Engineering", industry: "Technology" },
  { title: "Site Reliability Engineer", department: "Engineering", industry: "Technology", aliases: ["SRE (Site Reliability Engineer)"] },
  { title: "Cybersecurity Engineer", department: "Engineering", industry: "Technology", aliases: ["Security Engineer"] },
  { title: "Database Administrator", department: "Engineering", industry: "Technology" },
  { title: "Systems Administrator", department: "Engineering", industry: "Technology" },
  { title: "Network Engineer", department: "Engineering", industry: "Technology" },
  { title: "IT Support Specialist", department: "Engineering", industry: "Technology" },
  { title: "Embedded Systems Engineer", department: "Engineering", industry: "Technology" },
  { title: "Blockchain Developer", department: "Engineering", industry: "Technology" },
  { title: "Data Analyst", department: "Data & Analytics", industry: "Cross-industry" },
  { title: "Data Scientist", department: "Data & Analytics", industry: "Technology" },
  { title: "Data Engineer", department: "Data & Analytics", industry: "Technology" },
  { title: "Business Intelligence Analyst", department: "Data & Analytics", industry: "Cross-industry" },
  { title: "Machine Learning Engineer", department: "Data & Analytics", industry: "Technology" },
  { title: "AI Researcher", department: "Data & Analytics", industry: "Technology" },
  { title: "Quantitative Analyst", department: "Data & Analytics", industry: "Finance" },
  { title: "AI Engineer", department: "Engineering", industry: "Technology" },
  { title: "DevOps Engineer", department: "Engineering", industry: "Technology" },
  { title: "UI/UX Designer", department: "Design", industry: "Cross-industry", aliases: ["Product Designer"] },
  { title: "Graphic Designer", department: "Design", industry: "Cross-industry" },
  { title: "Visual Designer", department: "Design", industry: "Cross-industry" },
  { title: "Motion Designer", department: "Design", industry: "Cross-industry" },
  { title: "UX Researcher", department: "Design", industry: "Cross-industry" },
  { title: "Interaction Designer", department: "Design", industry: "Cross-industry" },
  { title: "Product Manager", department: "Product", industry: "Cross-industry" },
  { title: "Associate Product Manager", department: "Product", industry: "Cross-industry" },
  { title: "Technical Product Manager", department: "Product", industry: "Technology" },
  { title: "Program Manager", department: "Product", industry: "Cross-industry" },
  { title: "Scrum Master", department: "Product", industry: "Cross-industry" },
  { title: "Agile Coach", department: "Product", industry: "Cross-industry" },
  { title: "Project Manager", department: "Operations", industry: "Cross-industry" },
  { title: "HR Recruiter", department: "Human Resources", industry: "Cross-industry", aliases: ["Talent Acquisition Specialist", "Recruiter"] },
  { title: "HR Manager", department: "Human Resources", industry: "Cross-industry" },
  { title: "HR Generalist", department: "Human Resources", industry: "Cross-industry" },
  { title: "HR Business Partner", department: "Human Resources", industry: "Cross-industry" },
  { title: "Learning and Development Specialist", department: "Human Resources", industry: "Cross-industry" },
  { title: "Sales Executive", department: "Sales", industry: "Cross-industry", aliases: ["Account Executive", "Sales Development Representative (SDR)"] },
  { title: "Business Development Manager", department: "Sales", industry: "Cross-industry" },
  { title: "Sales Manager", department: "Sales", industry: "Cross-industry" },
  { title: "Key Account Manager", department: "Sales", industry: "Cross-industry" },
  { title: "Customer Success Manager", department: "Customer Success", industry: "Cross-industry" },
  { title: "Digital Marketing Specialist", department: "Marketing", industry: "Cross-industry" },
  { title: "SEO Specialist", department: "Marketing", industry: "Cross-industry" },
  { title: "Content Strategist", department: "Marketing", industry: "Cross-industry" },
  { title: "Copywriter", department: "Marketing", industry: "Cross-industry" },
  { title: "Social Media Manager", department: "Marketing", industry: "Cross-industry" },
  { title: "Brand Manager", department: "Marketing", industry: "Cross-industry" },
  { title: "Accountant", department: "Finance", industry: "Cross-industry" },
  { title: "Financial Analyst", department: "Finance", industry: "Cross-industry" },
  { title: "Controller", department: "Finance", industry: "Cross-industry" },
  { title: "Auditor", department: "Finance", industry: "Cross-industry" },
  { title: "Tax Consultant", department: "Finance", industry: "Cross-industry" },
  { title: "Operations Manager", department: "Operations", industry: "Cross-industry" },
  { title: "Customer Support Executive", department: "Customer Support", industry: "Cross-industry" },
  { title: "Office Administrator", department: "Operations", industry: "Cross-industry" },
  { title: "BPO Associate", department: "BPO & Customer Operations", industry: "Business Services", aliases: ["BPO Executive"] },
  { title: "International Call Center Executive", department: "BPO & Customer Operations", industry: "Business Services", aliases: ["International Voice Process Executive"] },
  { title: "Call Center Representative", department: "BPO & Customer Operations", industry: "Business Services", aliases: ["Contact Center Representative"] },
  { title: "Non-Voice Process Executive", department: "BPO & Customer Operations", industry: "Business Services" },
  { title: "KPO Research Associate", department: "BPO & Customer Operations", industry: "Business Services" },
  { title: "Process Trainer", department: "BPO & Customer Operations", industry: "Business Services" },
  { title: "Quality Analyst - BPO", department: "BPO & Customer Operations", industry: "Business Services" },
  { title: "Travel Consultant", department: "Travel & Hospitality", industry: "Travel & Tourism" },
  { title: "Travel Operations Executive", department: "Travel & Hospitality", industry: "Travel & Tourism" },
  { title: "GDS Travel Consultant", department: "Travel & Hospitality", industry: "Travel & Tourism", aliases: ["GDS Executive"] },
  { title: "Airline Ticketing Executive", department: "Travel & Hospitality", industry: "Travel & Tourism" },
  { title: "Hotel Reservation Executive", department: "Travel & Hospitality", industry: "Hospitality & Tourism" },
  { title: "Tour Operations Manager", department: "Travel & Hospitality", industry: "Travel & Tourism" },
  { title: "Loan Collection Executive", department: "Banking & Financial Operations", industry: "Banking & Financial Services", aliases: ["Collections Executive"] },
  { title: "Collections Manager", department: "Banking & Financial Operations", industry: "Banking & Financial Services" },
  { title: "Credit Analyst", department: "Banking & Financial Operations", industry: "Banking & Financial Services" },
  { title: "Fraud Analyst", department: "Risk & Compliance", industry: "Banking & Financial Services" },
  { title: "Fraud Investigation Specialist", department: "Risk & Compliance", industry: "Banking & Financial Services" },
  { title: "Risk Analyst", department: "Risk & Compliance", industry: "Banking & Financial Services" },
  { title: "AML Analyst", department: "Risk & Compliance", industry: "Banking & Financial Services" },
  { title: "MIS Executive", department: "Data & Analytics", industry: "Cross-industry" },
  { title: "Reporting Analyst", department: "Data & Analytics", industry: "Cross-industry" },
  { title: "Business Analyst", department: "Data & Analytics", industry: "Cross-industry" },
  { title: "Data Science Manager", department: "Data & Analytics", industry: "Technology" },
  { title: "Data Architect", department: "Data & Analytics", industry: "Technology" },
  { title: "Business Intelligence Developer", department: "Data & Analytics", industry: "Technology" },
  { title: "Statistician", department: "Data & Analytics", industry: "Cross-industry" },
  { title: "Travel Agent", department: "Travel & Hospitality", industry: "Travel & Tourism" },
  { title: "Visa Consultant", department: "Travel & Hospitality", industry: "Travel & Tourism" },
  { title: "Reservations Agent", department: "Travel & Hospitality", industry: "Travel & Tourism" },
  { title: "Supply Chain Manager", department: "Operations", industry: "Logistics" },
  { title: "Logistics Coordinator", department: "Operations", industry: "Logistics" },
  { title: "Procurement Specialist", department: "Operations", industry: "Cross-industry" },
  { title: "Legal Counsel", department: "Legal", industry: "Cross-industry" },
  { title: "Paralegal", department: "Legal", industry: "Cross-industry" },
  { title: "Registered Nurse", department: "Healthcare", industry: "Healthcare" },
  { title: "Medical Sales Representative", department: "Healthcare", industry: "Healthcare" },
  { title: "Teacher", department: "Education", industry: "Education" },
  { title: "Customer Service Representative", department: "Customer Support", industry: "Cross-industry" },
];

const mapping = (required: string[], preferred: string[], level: SkillLevel = "intermediate"): RoleSkillSuggestion[] => [
  ...required.map((name) => ({ name, category: "Technical" as const, priority: "required" as const, recommendedLevel: level })),
  ...preferred.map((name) => ({ name, category: "Tools" as const, priority: "preferred" as const, recommendedLevel: level })),
];

export const ROLE_SKILL_MAPPINGS: Record<string, RoleSkillSuggestion[]> = {
  "Software Developer": mapping(
    ["Java", "Python", "JavaScript", "React.js", "Node.js", "SQL", "Git", "REST API"],
    ["Docker", "AWS", "TypeScript", "Testing"]
  ),
  "Frontend Developer": mapping(
    ["HTML", "CSS", "JavaScript", "React.js", "TypeScript", "Git", "REST API"],
    ["Next.js", "Tailwind CSS", "Jest", "Figma"]
  ),
  "Backend Developer": mapping(
    ["Java", "Python", "Node.js", "SQL", "REST API", "Git", "Data Structures"],
    ["Docker", "AWS", "Redis", "PostgreSQL"]
  ),
  "Data Analyst": mapping(
    ["SQL", "Microsoft Excel", "Data Visualization", "Power BI", "Statistics"],
    ["Python", "Tableau", "Google Analytics", "Stakeholder Management"]
  ),
  "Data Scientist": mapping(
    ["Python", "SQL", "Statistics", "Machine Learning", "Data Visualization"],
    ["Pandas", "Scikit-learn", "TensorFlow", "Tableau"]
  ),
  "AI Engineer": mapping(
    ["Python", "Machine Learning", "LLM", "SQL", "Git", "REST API"],
    ["PyTorch", "TensorFlow", "Vector Databases", "Docker", "AWS"]
  ),
  "DevOps Engineer": mapping(
    ["Linux", "Git", "Docker", "CI/CD", "AWS", "Networking"],
    ["Kubernetes", "Terraform", "Python", "Monitoring"]
  ),
  "UI/UX Designer": mapping(
    ["Figma", "Wireframing", "Prototyping", "User Research", "Design Systems"],
    ["Adobe Creative Suite", "Usability Testing", "HTML", "CSS"]
  ),
  "Product Manager": mapping(
    ["Product Strategy", "Roadmapping", "User Research", "Agile", "Stakeholder Management"],
    ["Jira", "Data Analysis", "A/B Testing", "SQL"]
  ),
  "Project Manager": mapping(
    ["Project Planning", "Agile", "Risk Management", "Stakeholder Management", "Budget Management"],
    ["Jira", "Microsoft Project", "Scrum", "Reporting"]
  ),
  "HR Recruiter": mapping(
    ["Talent Sourcing", "Interviewing", "Applicant Tracking Systems", "Candidate Screening", "Communication"],
    ["LinkedIn Recruiter", "Employer Branding", "Offer Negotiation", "HR Analytics"]
  ),
  "HR Manager": mapping(
    ["Employee Relations", "Recruitment", "Performance Management", "Labour Law", "Communication"],
    ["HRIS", "Compensation Planning", "HR Analytics", "Training & Development"]
  ),
  "Sales Executive": mapping(
    ["Lead Generation", "Sales Prospecting", "CRM", "Negotiation", "Communication"],
    ["Salesforce", "Cold Calling", "Account Management", "Sales Reporting"]
  ),
  "Customer Success Manager": mapping(
    ["Customer Onboarding", "Account Management", "Communication", "Problem Solving", "CRM"],
    ["Customer Retention", "Salesforce", "Product Training", "Data Analysis"]
  ),
  "Digital Marketing Specialist": mapping(
    ["Digital Marketing", "SEO", "Content Marketing", "Google Analytics", "Social Media Marketing"],
    ["Google Ads", "Email Marketing", "Canva", "Meta Ads"]
  ),
  Accountant: mapping(
    ["Accounting", "Bookkeeping", "Microsoft Excel", "Financial Reporting", "Taxation"],
    ["Tally", "QuickBooks", "GST", "ERP"]
  ),
  "Financial Analyst": mapping(
    ["Financial Modeling", "Microsoft Excel", "Financial Reporting", "Budgeting", "Data Analysis"],
    ["Power BI", "SQL", "Forecasting", "ERP"]
  ),
  "Operations Manager": mapping(
    ["Operations Management", "Process Improvement", "Reporting", "Team Management", "Problem Solving"],
    ["Microsoft Excel", "ERP", "Project Management", "Data Analysis"]
  ),
  "Customer Support Executive": mapping(
    ["Customer Support", "Communication", "Problem Solving", "Ticketing Systems"],
    ["CRM", "Zendesk", "Email Support", "Chat Support"]
  ),
  "BPO Associate": mapping(
    ["Customer Support", "Communication", "Active Listening", "CRM", "Ticketing Systems"],
    ["International Voice Process", "Email Support", "Chat Support", "Typing", "English Fluency"]
  ),
  "International Call Center Executive": mapping(
    ["Communication", "Active Listening", "Customer Support", "CRM", "English Fluency"],
    ["Inbound Calling", "Outbound Calling", "Ticketing Systems", "Quality Assurance", "Call Handling"]
  ),
  "Call Center Representative": mapping(
    ["Communication", "Active Listening", "Customer Support", "Problem Solving"],
    ["CRM", "Call Handling", "Ticketing Systems", "English Fluency", "Typing"]
  ),
  "Non-Voice Process Executive": mapping(
    ["Written Communication", "Typing", "Customer Support", "Ticketing Systems"],
    ["Email Support", "Chat Support", "CRM", "Data Entry", "English Fluency"]
  ),
  "KPO Research Associate": mapping(
    ["Research", "Data Analysis", "Written Communication", "Microsoft Excel"],
    ["Market Research", "Report Writing", "Internet Research", "PowerPoint", "English Fluency"]
  ),
  "Process Trainer": mapping(
    ["Training & Development", "Communication", "Presentation", "Process Improvement"],
    ["Quality Assurance", "Coaching", "Reporting", "Microsoft PowerPoint"]
  ),
  "Quality Analyst - BPO": mapping(
    ["Quality Assurance", "Call Quality Monitoring", "Data Analysis", "Reporting"],
    ["Customer Support", "Microsoft Excel", "Root Cause Analysis", "Process Improvement"]
  ),
  "Travel Consultant": mapping(
    ["Travel Consulting", "Customer Service", "Itinerary Planning", "Communication"],
    ["Amadeus", "Sabre", "Galileo", "GDS", "Fare Rules", "Ticketing"]
  ),
  "Travel Operations Executive": mapping(
    ["Travel Operations", "Itinerary Planning", "Customer Service", "Ticketing"],
    ["Amadeus", "Sabre", "Galileo", "Travelport", "Visa Processing", "Hotel Booking"]
  ),
  "GDS Travel Consultant": mapping(
    ["GDS", "Ticketing", "Fare Rules", "Airline Reservations", "Customer Service"],
    ["Amadeus", "Sabre", "Galileo", "Travelport", "Reissue & Refunds", "PNR Management"]
  ),
  "Airline Ticketing Executive": mapping(
    ["Airline Reservations", "Ticketing", "GDS", "Fare Rules", "Customer Service"],
    ["Amadeus", "Sabre", "Galileo", "PNR Management", "Reissue & Refunds"]
  ),
  "Hotel Reservation Executive": mapping(
    ["Hotel Reservations", "Customer Service", "Booking Management", "Communication"],
    ["Opera PMS", "CRM", "Revenue Management", "Upselling", "Email Support"]
  ),
  "Loan Collection Executive": mapping(
    ["Loan Collections", "Telecalling", "Negotiation", "Customer Communication", "CRM"],
    ["Debt Recovery", "Payment Processing", "Financial Regulations", "Skip Tracing", "Microsoft Excel"]
  ),
  "Collections Manager": mapping(
    ["Collections Management", "Debt Recovery", "Negotiation", "Team Management", "Reporting"],
    ["CRM", "Financial Regulations", "Portfolio Management", "Microsoft Excel"]
  ),
  "Credit Analyst": mapping(
    ["Credit Analysis", "Financial Analysis", "Risk Assessment", "Microsoft Excel", "Financial Reporting"],
    ["SQL", "Loan Underwriting", "Credit Scoring", "Banking", "Power BI"]
  ),
  "Fraud Analyst": mapping(
    ["Fraud Detection", "Transaction Monitoring", "Risk Analysis", "Data Analysis", "Microsoft Excel"],
    ["AML", "KYC", "SQL", "Python", "Case Management", "Machine Learning"]
  ),
  "Fraud Investigation Specialist": mapping(
    ["Fraud Investigation", "Fraud Detection", "Case Management", "Transaction Monitoring"],
    ["AML", "KYC", "Risk Assessment", "Digital Forensics", "Report Writing"]
  ),
  "Risk Analyst": mapping(
    ["Risk Analysis", "Risk Assessment", "Data Analysis", "Microsoft Excel", "Reporting"],
    ["SQL", "Python", "Financial Modeling", "AML", "KYC", "Power BI"]
  ),
  "AML Analyst": mapping(
    ["AML", "KYC", "Transaction Monitoring", "Fraud Detection", "Case Management"],
    ["Risk Assessment", "Compliance", "SQL", "Microsoft Excel", "Report Writing"]
  ),
  "MIS Executive": mapping(
    ["Microsoft Excel", "Data Analysis", "Reporting", "Data Entry"],
    ["SQL", "Power BI", "Tableau", "VLOOKUP", "Pivot Tables"]
  ),
  "Reporting Analyst": mapping(
    ["Data Analysis", "Reporting", "Microsoft Excel", "Data Visualization"],
    ["SQL", "Power BI", "Tableau", "Python", "Dashboard Development"]
  ),
  "Business Analyst": mapping(
    ["Business Analysis", "Requirements Gathering", "Data Analysis", "Stakeholder Management"],
    ["SQL", "Microsoft Excel", "Power BI", "Process Mapping", "Agile"]
  ),
};

const DEPARTMENT_SKILL_FALLBACKS: Record<string, RoleSkillSuggestion[]> = {
  Engineering: mapping(["Git", "Problem Solving", "REST API", "Testing"], ["Docker", "Cloud Computing", "Agile"]),
  "Data & Analytics": mapping(["Data Analysis", "SQL", "Microsoft Excel", "Statistics"], ["Python", "Data Visualization", "Power BI"]),
  Design: mapping(["Figma", "Wireframing", "Prototyping", "Communication"], ["User Research", "Design Systems", "Adobe Creative Suite"]),
  Product: mapping(["Agile", "Stakeholder Management", "Roadmapping", "Communication"], ["Jira", "Data Analysis", "User Research"]),
  "Human Resources": mapping(["Communication", "Recruitment", "Employee Relations", "HRIS"], ["Interviewing", "HR Analytics", "Labour Law"]),
  Sales: mapping(["Communication", "Negotiation", "CRM", "Lead Generation"], ["Salesforce", "Account Management", "Sales Reporting"]),
  Marketing: mapping(["Content Marketing", "Digital Marketing", "Communication", "Google Analytics"], ["SEO", "Social Media Marketing", "Google Ads"]),
  Finance: mapping(["Microsoft Excel", "Financial Reporting", "Data Analysis", "Attention to Detail"], ["ERP", "Budgeting", "Power BI"]),
  Operations: mapping(["Operations Management", "Process Improvement", "Communication", "Reporting"], ["Microsoft Excel", "Project Management", "ERP"]),
  "Customer Support": mapping(["Customer Support", "Communication", "Problem Solving", "Ticketing Systems"], ["CRM", "Email Support", "Chat Support"]),
  "BPO & Customer Operations": mapping(["Customer Support", "Communication", "CRM", "Ticketing Systems"], ["English Fluency", "Quality Assurance", "Reporting", "Typing"]),
  "Travel & Hospitality": mapping(["Customer Service", "Communication", "Booking Management", "Itinerary Planning"], ["GDS", "Ticketing", "Amadeus", "Sabre", "Hotel Booking"]),
  "Banking & Financial Operations": mapping(["Financial Analysis", "Customer Communication", "Microsoft Excel", "Reporting"], ["CRM", "Banking", "Risk Assessment", "Collections"]),
  "Risk & Compliance": mapping(["Risk Assessment", "Compliance", "Data Analysis", "Reporting"], ["AML", "KYC", "Fraud Detection", "SQL"]),
  Legal: mapping(["Legal Research", "Legal Writing", "Contract Management", "Attention to Detail"], ["Compliance", "Communication", "Document Management"]),
  Healthcare: mapping(["Patient Care", "Communication", "Documentation", "Attention to Detail"], ["Healthcare Compliance", "EMR", "Teamwork"]),
  Education: mapping(["Teaching", "Communication", "Lesson Planning", "Classroom Management"], ["Assessment", "Learning Management Systems", "Student Engagement"]),
};

export function findRole(role: string) {
  const normalized = role.trim().toLowerCase();
  return ROLE_MASTER.find((item) =>
    [item.title, ...(item.aliases || [])].some((name) => name.toLowerCase() === normalized)
  );
}

export function searchRoles(query = "") {
  const normalized = query.trim().toLowerCase();
  return ROLE_MASTER.filter((role) =>
    !normalized || [role.title, role.department, ...(role.aliases || [])].some((value) => value.toLowerCase().includes(normalized))
  ).slice(0, 12);
}

export function getRoleSkillSuggestions(role: string): RoleSkillSuggestion[] {
  const foundRole = findRole(role);
  return ROLE_SKILL_MAPPINGS[foundRole?.title || role] || (foundRole ? DEPARTMENT_SKILL_FALLBACKS[foundRole.department] || [] : []);
}

export function searchSkills(query = "") {
  const normalized = query.trim().toLowerCase();
  const all = [...new Set(Object.values(ROLE_SKILL_MAPPINGS).flat().map((skill) => skill.name))];
  return all.filter((skill) => !normalized || skill.toLowerCase().includes(normalized)).slice(0, 12);
}
