import type { Prisma } from "@prisma/client";

export type SeoJobCategory = {
  slug: string;
  name: string;
  title: string;
  intro: string;
  titleTerms: string[];
  departmentTerms?: string[];
  requirementTerms?: string[];
  experienceTerms?: string[];
};

export const SEO_JOB_CATEGORIES: SeoJobCategory[] = [
  {
    slug: "customer-support",
    name: "Customer Support",
    title: "Customer Support Jobs",
    intro: "Customer support roles can include voice, non-voice, chat, email and customer service operations depending on the employer and shift.",
    titleTerms: ["customer support", "customer care", "customer service", "support executive", "support specialist", "call centre", "call center"],
    departmentTerms: ["Customer Support", "Customer Service"],
    requirementTerms: ["Customer Support", "Communication", "Email Support", "Chat Support", "CRM"],
  },
  {
    slug: "bpo",
    name: "BPO",
    title: "BPO Jobs",
    intro: "BPO opportunities can include domestic and international voice, non-voice, process associate and customer operations roles.",
    titleTerms: ["bpo", "voice process", "non voice", "non-voice", "process associate", "process executive", "international process", "domestic process"],
    departmentTerms: ["BPO"],
    requirementTerms: ["BPO", "Voice Process", "Non Voice", "Customer Support"],
  },
  {
    slug: "sales",
    name: "Sales",
    title: "Sales Jobs",
    intro: "Sales hiring spans inside sales, field sales, business development, account management and revenue-focused roles.",
    titleTerms: ["sales", "business development", "account executive", "inside sales", "field sales", "relationship manager"],
    departmentTerms: ["Sales", "Business Development"],
    requirementTerms: ["B2B Sales", "Lead Generation", "Negotiation", "CRM"],
  },
  {
    slug: "software-development",
    name: "Software Development",
    title: "Software Development Jobs",
    intro: "Software roles can include frontend, backend, full stack, mobile, platform and application engineering positions.",
    titleTerms: ["software", "developer", "frontend", "front end", "backend", "back end", "full stack", "fullstack", "web developer", "application engineer"],
    requirementTerms: ["React", "Next.js", "Node.js", "TypeScript", "Java", "Python", "PostgreSQL", "Software Development"],
  },
  {
    slug: "fresher",
    name: "Fresher",
    title: "Fresher Jobs",
    intro: "Entry-level opportunities can include fresher, graduate, trainee and early-career roles where employers accept limited prior experience.",
    titleTerms: ["fresher", "graduate", "trainee", "intern", "entry level", "entry-level"],
    experienceTerms: ["Entry-level", "Fresher"],
  },
  {
    slug: "finance",
    name: "Finance & Accounts",
    title: "Finance & Accounts Jobs",
    intro: "Finance roles can include accounting, banking, reconciliation, audit, taxation and financial operations positions.",
    titleTerms: ["finance", "account", "accounting", "banking", "financial", "audit", "tax", "gst", "reconciliation"],
    departmentTerms: ["Finance", "Accounts", "Accounting"],
    requirementTerms: ["Accounting", "Tally", "GST", "Reconciliation", "Microsoft Excel"],
  },
  {
    slug: "data-analytics",
    name: "Data & Analytics",
    title: "Data & Analytics Jobs",
    intro: "Data roles can include data analyst, business intelligence, analytics, data science and applied AI positions.",
    titleTerms: ["data analyst", "data scientist", "analytics", "business analyst", "business intelligence", "machine learning", "ai engineer", "artificial intelligence"],
    departmentTerms: ["Analytics", "Data"],
    requirementTerms: ["SQL", "Data Analysis", "Power BI", "Data Visualization", "Machine Learning", "Python"],
  },
  {
    slug: "digital-marketing",
    name: "Digital Marketing",
    title: "Digital Marketing Jobs",
    intro: "Digital marketing hiring can span SEO, paid acquisition, social media, content, performance marketing and campaign analytics.",
    titleTerms: ["digital marketing", "seo", "performance marketing", "social media", "content marketing", "paid media", "growth marketing"],
    departmentTerms: ["Marketing"],
    requirementTerms: ["Digital Marketing", "SEO", "Google Ads", "Social Media Marketing", "Analytics"],
  },
  {
    slug: "operations",
    name: "Operations",
    title: "Operations Jobs",
    intro: "Operations roles can include business operations, back office, logistics, supply chain, warehouse and process coordination.",
    titleTerms: ["operations", "back office", "logistics", "supply chain", "warehouse", "process coordinator"],
    departmentTerms: ["Operations", "Logistics", "Supply Chain"],
  },
  {
    slug: "engineering",
    name: "Core Engineering",
    title: "Engineering Jobs",
    intro: "Core engineering roles can include mechanical, electrical, civil, automotive, quality and industrial engineering positions.",
    titleTerms: ["mechanical", "electrical", "civil", "automotive", "quality engineer", "industrial engineer", "production engineer"],
    requirementTerms: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Automotive"],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    title: "Manufacturing Jobs",
    intro: "Manufacturing opportunities can include production, plant, quality, maintenance and factory operations roles.",
    titleTerms: ["manufacturing", "production", "plant", "factory", "quality", "maintenance"],
    departmentTerms: ["Manufacturing", "Production"],
  },
  {
    slug: "product",
    name: "Product",
    title: "Product Jobs",
    intro: "Product roles can include product management, product ownership, product operations and product design.",
    titleTerms: ["product manager", "product management", "product owner", "product operations", "product designer"],
    departmentTerms: ["Product"],
  },
  {
    slug: "cloud-devops",
    name: "Cloud & DevOps",
    title: "Cloud & DevOps Jobs",
    intro: "Cloud and DevOps roles can include platform engineering, infrastructure, site reliability and cloud operations.",
    titleTerms: ["devops", "cloud engineer", "site reliability", "sre", "platform engineer", "cloud architect"],
    requirementTerms: ["AWS", "Azure", "GCP", "DevOps", "Kubernetes", "Docker"],
  },
  {
    slug: "hr-recruitment",
    name: "HR & Recruitment",
    title: "HR & Recruitment Jobs",
    intro: "HR and recruitment roles can include talent acquisition, sourcing, recruiter, HR operations and interview coordination.",
    titleTerms: ["recruiter", "recruitment", "talent acquisition", "human resources", "hr executive", "hr operations"],
    departmentTerms: ["Human Resources", "HR", "Recruitment"],
    requirementTerms: ["Recruitment", "Candidate Sourcing", "Screening", "Interview Coordination"],
  },
  {
    slug: "design",
    name: "Design",
    title: "Design Jobs",
    intro: "Design opportunities can include UI, UX, product design, graphic design and design systems roles.",
    titleTerms: ["ui/ux", "ux designer", "ui designer", "product designer", "graphic designer", "visual designer"],
    departmentTerms: ["Design"],
    requirementTerms: ["Figma", "UI Design", "UX Design", "Wireframing", "Design Systems"],
  },
];

export const SEO_JOB_CATEGORY_BY_SLUG = Object.fromEntries(
  SEO_JOB_CATEGORIES.map((category) => [category.slug, category]),
) as Record<string, SeoJobCategory>;

export const SEO_CITY_CATEGORY_PRIORITY: Record<string, string[]> = {
  "delhi-ncr": ["customer-support", "bpo", "sales", "software-development", "fresher", "finance"],
  noida: ["customer-support", "bpo", "software-development", "sales", "fresher", "hr-recruitment"],
  gurugram: ["sales", "finance", "software-development", "customer-support", "digital-marketing", "hr-recruitment"],
  bengaluru: ["software-development", "data-analytics", "product", "cloud-devops", "design", "sales"],
  hyderabad: ["software-development", "data-analytics", "cloud-devops", "customer-support", "finance"],
  pune: ["software-development", "engineering", "finance", "customer-support", "sales"],
  mumbai: ["finance", "sales", "operations", "digital-marketing", "hr-recruitment", "customer-support"],
  chennai: ["software-development", "customer-support", "engineering", "manufacturing", "finance"],
  ahmedabad: ["sales", "finance", "manufacturing", "software-development", "digital-marketing"],
};

export function findSeoJobCategory(slug: string) {
  return SEO_JOB_CATEGORY_BY_SLUG[slug];
}

export function categoriesForCity(citySlug: string) {
  return (SEO_CITY_CATEGORY_PRIORITY[citySlug] ?? [])
    .map((slug) => findSeoJobCategory(slug))
    .filter((category): category is SeoJobCategory => Boolean(category));
}

export type SeoJobComparable = {
  title: string;
  department?: string | null;
  requirements?: string[];
  experienceLevel?: string | null;
};

export function matchesSeoCategory(job: SeoJobComparable, category: SeoJobCategory) {
  const title = job.title.toLowerCase();
  const department = (job.department ?? "").toLowerCase();
  const experience = (job.experienceLevel ?? "").toLowerCase();
  const requirements = (job.requirements ?? []).map((item) => item.toLowerCase());

  if (category.titleTerms.some((term) => title.includes(term.toLowerCase()))) return true;
  if (category.departmentTerms?.some((term) => department.includes(term.toLowerCase()))) return true;
  if (category.experienceTerms?.some((term) => experience.includes(term.toLowerCase()))) return true;
  if (category.requirementTerms?.some((term) => requirements.includes(term.toLowerCase()))) return true;
  return false;
}

export function categoryPrismaOr(category: SeoJobCategory) {
  const filters: Prisma.JobListingWhereInput[] = [];

  for (const term of category.titleTerms) {
    filters.push({ title: { contains: term, mode: "insensitive" } });
  }
  for (const term of category.departmentTerms ?? []) {
    filters.push({ department: { contains: term, mode: "insensitive" } });
  }
  for (const term of category.experienceTerms ?? []) {
    filters.push({ experienceLevel: { contains: term, mode: "insensitive" } });
  }
  if ((category.requirementTerms ?? []).length > 0) {
    filters.push({ requirements: { hasSome: category.requirementTerms } });
  }

  return filters;
}
