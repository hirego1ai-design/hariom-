export type SeoJobCity = {
  slug: string;
  name: string;
  regionLabel: string;
  dbTerms: string[];
  industries: string[];
  areas: string[];
  employerIntro: string;
  candidateIntro: string;
};

export const SEO_JOB_CITIES: SeoJobCity[] = [
  {
    slug: "delhi-ncr",
    name: "Delhi NCR",
    regionLabel: "Delhi NCR",
    dbTerms: ["Delhi", "Noida", "Gurugram", "Gurgaon", "Faridabad", "Ghaziabad"],
    industries: ["BPO & customer support", "sales", "IT & software", "finance", "logistics"],
    areas: ["Delhi", "Noida", "Gurugram", "Faridabad", "Ghaziabad"],
    employerIntro: "Reach candidates across the wider Delhi NCR hiring market with a structured role, clear screening signals and an employer workflow that keeps applications organised.",
    candidateIntro: "Browse current roles across Delhi, Noida, Gurugram, Faridabad and Ghaziabad from employers publishing opportunities on HireGo AI.",
  },
  {
    slug: "noida",
    name: "Noida",
    regionLabel: "Noida, Uttar Pradesh",
    dbTerms: ["Noida"],
    industries: ["IT & software", "BPO & customer support", "electronics", "e-commerce", "sales"],
    areas: ["Sector 62", "Sector 63", "Sector 125", "Sector 132", "Sector 135"],
    employerIntro: "Hire in Noida with role-based screening, candidate evidence and a structured workflow for technology, support, operations, sales and other local hiring needs.",
    candidateIntro: "Explore current jobs in Noida across technology, support, operations, sales and other functions from employers hiring through HireGo AI.",
  },
  {
    slug: "gurugram",
    name: "Gurugram",
    regionLabel: "Gurugram, Haryana",
    dbTerms: ["Gurugram", "Gurgaon"],
    industries: ["SaaS & technology", "sales", "finance", "consulting", "customer success"],
    areas: ["Cyber City", "Golf Course Road", "Udyog Vihar", "Sohna Road", "Sector 44"],
    employerIntro: "Post roles for Gurugram and manage applicants with structured screening, interview coordination and evidence that helps hiring teams compare relevant candidates.",
    candidateIntro: "Find current Gurugram and Gurgaon opportunities in technology, sales, finance, consulting, customer success and other functions.",
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    regionLabel: "Bengaluru, Karnataka",
    dbTerms: ["Bengaluru", "Bangalore"],
    industries: ["software engineering", "data & AI", "product", "cloud & DevOps", "design"],
    areas: ["Whitefield", "Electronic City", "Koramangala", "HSR Layout", "Manyata Tech Park"],
    employerIntro: "Publish Bengaluru roles with clear requirements and use structured candidate evidence to support faster screening for software, product, data, cloud and design hiring.",
    candidateIntro: "Browse live Bengaluru and Bangalore jobs across software, data, product, cloud, design and other professional roles.",
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    regionLabel: "Hyderabad, Telangana",
    dbTerms: ["Hyderabad", "Secunderabad"],
    industries: ["software engineering", "cloud", "analytics", "pharma & life sciences", "customer support"],
    areas: ["HITEC City", "Gachibowli", "Madhapur", "Financial District", "Kondapur"],
    employerIntro: "Reach Hyderabad candidates with structured job requirements and a workflow that connects sourcing, screening, assessments and interviews in one place.",
    candidateIntro: "Explore current Hyderabad jobs in software, cloud, analytics, life sciences, support and other functions.",
  },
  {
    slug: "pune",
    name: "Pune",
    regionLabel: "Pune, Maharashtra",
    dbTerms: ["Pune", "Pimpri", "Chinchwad"],
    industries: ["IT & software", "automotive", "engineering", "finance", "BPO & support"],
    areas: ["Hinjawadi", "Kharadi", "Magarpatta", "Baner", "Pimpri-Chinchwad"],
    employerIntro: "Post Pune roles and organise candidate screening for technology, engineering, automotive, finance and support hiring with structured evidence and interview workflows.",
    candidateIntro: "Browse current jobs in Pune across IT, engineering, automotive, finance, support and other growing functions.",
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    regionLabel: "Mumbai, Maharashtra",
    dbTerms: ["Mumbai", "Navi Mumbai", "Thane"],
    industries: ["banking & finance", "sales", "media", "operations", "logistics"],
    areas: ["BKC", "Andheri", "Powai", "Lower Parel", "Navi Mumbai"],
    employerIntro: "Publish Mumbai roles with clear job requirements and keep high-volume applicant screening, interview coordination and hiring evidence organised.",
    candidateIntro: "Find current opportunities across Mumbai, Navi Mumbai and Thane in finance, sales, media, operations, logistics and other functions.",
  },
  {
    slug: "chennai",
    name: "Chennai",
    regionLabel: "Chennai, Tamil Nadu",
    dbTerms: ["Chennai"],
    industries: ["IT & software", "automotive", "manufacturing", "finance", "customer support"],
    areas: ["OMR", "Guindy", "Ambattur", "Taramani", "Sholinganallur"],
    employerIntro: "Hire in Chennai with structured role requirements, candidate evidence and interview coordination for technology, manufacturing, automotive, finance and support roles.",
    candidateIntro: "Browse current Chennai jobs across technology, manufacturing, automotive, finance, support and other professional categories.",
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    regionLabel: "Ahmedabad, Gujarat",
    dbTerms: ["Ahmedabad", "Gandhinagar"],
    industries: ["manufacturing", "pharma", "sales", "finance", "IT services"],
    areas: ["SG Highway", "Prahlad Nagar", "Navrangpura", "Satellite", "Gandhinagar"],
    employerIntro: "Post Ahmedabad roles and manage candidate screening with structured evidence for manufacturing, pharma, sales, finance, IT services and other hiring needs.",
    candidateIntro: "Explore current jobs in Ahmedabad and nearby Gandhinagar across manufacturing, pharma, sales, finance, IT services and more.",
  },
];

export const SEO_JOB_CITY_BY_SLUG = Object.fromEntries(
  SEO_JOB_CITIES.map((city) => [city.slug, city]),
) as Record<string, SeoJobCity>;

export function findSeoJobCity(slug: string) {
  return SEO_JOB_CITY_BY_SLUG[slug];
}

export function matchesSeoCity(location: string, city: SeoJobCity) {
  const normalized = location.toLowerCase();
  return city.dbTerms.some((term) => normalized.includes(term.toLowerCase()));
}
