// Universal Candidate Profile — Mock Data
// All candidate profile data for the UCP page

export const candidateProfile = {
  id: "HGCA-2024-78291",
  name: "Rohit Kumar",
  headline: "Senior Frontend Developer",
  currentCompany: "Infosys Ltd.",
  experience: "5.2 Years",
  location: "Bengaluru, Karnataka, India",
  preferredLocation: "Remote / Bengaluru",
  expectedSalary: "₹18 LPA",
  noticePeriod: "2 Months",
  availability: "Available Immediately",
  preferredJobType: "Full-time",
  email: "rohit.kumar@example.com",
  phone: "+91 98765 43210",
  linkedIn: "linkedin.com/in/rohitkumar",
  github: "github.com/rohitkumar",
  portfolio: "rohitkumar.dev",
  profileLink: "hirego.ai/u/rohitkumar",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=280",
  isVerified: true,
  isEliteCandidate: true,
  isOpenToWork: true,
  appliedJob: "Senior Frontend Developer",
  appliedDate: "15 May 2024",
  source: "Direct Application",
  about: "Results-driven Frontend Developer with 5+ years of experience building responsive and scalable web applications using React, Next.js, TypeScript and modern UI libraries. Passionate about creating performant, accessible, and visually polished user interfaces for enterprise SaaS platforms. Strong collaborator with cross-functional teams and a proven track record of delivering complex features on tight timelines.",
};

export const candidateScores = {
  overallMatch: 92,
  profileCompletion: 88,
  recruiterViews: 147,
  interviewInvites: 12,
  hiringScore: {
    technical: 94,
    leadership: 78,
    communication: 91,
    problemSolving: 93,
    adaptability: 86,
    learning: 92,
    cultureFit: 88,
    risk: 15,
    growth: 90,
    overall: 92,
  },
  matchBreakdown: [
    { label: "Skills Match", pct: 95 },
    { label: "Experience Match", pct: 90 },
    { label: "Education Match", pct: 88 },
    { label: "Role Match", pct: 93 },
    { label: "Industry Match", pct: 90 },
    { label: "Location Match", pct: 85 },
    { label: "Salary Match", pct: 80 },
    { label: "Notice Period Match", pct: 95 },
    { label: "Soft Skills Match", pct: 92 },
    { label: "Communication Score", pct: 94 },
  ],
};

export const candidateVideoAnalysis = {
  duration: "1:58",
  language: "English",
  uploadDate: "25 May 2026",
  quality: "1080P HD",
  overallReadinessScore: 93,
  metrics: [
    { name: "Communication", score: 94, rating: "Excellent", icon: "record_voice_over" },
    { name: "Confidence", score: 92, rating: "Excellent", icon: "psychology" },
    { name: "Eye Contact", score: 88, rating: "Good", icon: "visibility" },
    { name: "Grammar", score: 95, rating: "Excellent", icon: "spellcheck" },
    { name: "Voice Quality", score: 89, rating: "Good", icon: "graphic_eq" },
    { name: "Professionalism", score: 93, rating: "Excellent", icon: "badge" },
    { name: "Speaking Speed", score: 82, rating: "Moderate", icon: "speed" },
    { name: "Energy", score: 87, rating: "Good", icon: "bolt" },
    { name: "Overall Readiness", score: 93, rating: "Interview Ready", icon: "task_alt" },
  ],
  transcriptData: [
    { timestamp: "00:00 - 00:15", text: "Hello! My name is Rohit Kumar. I am a Senior Frontend Engineer with over 5 years of experience building modern web applications." },
    { timestamp: "00:15 - 00:45", text: "At Infosys, I lead a frontend team of 4 engineers developing real-time data analytics dashboards using React, Next.js, and TypeScript, serving 50,000+ daily active users." },
    { timestamp: "00:45 - 01:15", text: "I specialize in micro-frontend architecture, state management with Redux and Zustand, web performance optimization, and building accessible UI component libraries." },
    { timestamp: "01:15 - 01:45", text: "My core motivation is building high-impact products that solve complex user problems cleanly. I enjoy mentoring junior engineers and contributing to open-source UI libraries." },
    { timestamp: "01:45 - 01:58", text: "Thank you for reviewing my profile! I look forward to connecting and discussing how I can contribute to your team." },
  ],
  insights: {
    communicationSummary: "Rohit demonstrates outstanding verbal clarity, structured thought process, and professional demeanor. Speech pace is steady and highly understandable.",
    strengths: [
      "Articulates complex architectural concepts with ease",
      "Maintains direct eye contact throughout the 2-minute video presentation",
      "Uses clear professional technical terminology without hesitation",
      "Confident posture and natural facial expressions",
    ],
    weaknesses: [
      "Slight acceleration during technical stack description (00:45 - 01:15)",
      "Could incorporate more quantifiable metric results in verbal introduction",
    ],
    speakingPattern: "Average 135 words per minute (WPM). Pitch fluctuation is natural and engaging. Filler words detected: 0.",
    confidenceAnalysis: "92/100 Confidence Index. Eye gazes remained centered 88% of total duration with zero visual distraction.",
    interviewReadiness: "Rohit is fully ready for Senior/Lead Frontend technical and behavioral interviews. Recommended for fast-tracking.",
    suggestedImprovements: [
      "Highlight 1-2 specific revenue or performance impact numbers during project overviews",
      "Maintain a slightly slower pace when listing multiple technology stacks in sequence",
    ],
  },
};

export const candidateSkills = {
  technical: [
    { name: "React.js", level: "Expert", years: 5, verified: true },
    { name: "Next.js", level: "Expert", years: 4, verified: true },
    { name: "TypeScript", level: "Advanced", years: 3, verified: true },
    { name: "JavaScript", level: "Expert", years: 5, verified: true },
    { name: "HTML5/CSS3", level: "Expert", years: 5, verified: false },
    { name: "Tailwind CSS", level: "Advanced", years: 3, verified: true },
    { name: "Redux", level: "Intermediate", years: 2, verified: false },
    { name: "Node.js", level: "Intermediate", years: 2, verified: false },
  ],
  softSkills: [
    { name: "Communication", level: "Strong", years: 5, verified: true },
    { name: "Problem Solving", level: "Strong", years: 5, verified: true },
    { name: "Team Leadership", level: "Growing", years: 2, verified: false },
    { name: "Agile/Scrum", level: "Strong", years: 4, verified: false },
  ],
  languages: [
    { name: "English", level: "Fluent", years: 10, verified: true },
    { name: "Hindi", level: "Native", years: 20, verified: false },
  ],
  tools: [
    { name: "Git/GitHub", level: "Expert", years: 5, verified: true },
    { name: "Figma", level: "Advanced", years: 3, verified: false },
    { name: "VS Code", level: "Expert", years: 5, verified: false },
    { name: "Vercel", level: "Advanced", years: 3, verified: false },
  ],
  cloud: [
    { name: "AWS (S3, CloudFront)", level: "Intermediate", years: 2, verified: false },
    { name: "Firebase", level: "Intermediate", years: 2, verified: false },
    { name: "Google Cloud", level: "Beginner", years: 1, verified: false },
  ],
};

export const candidateExperience = [
  {
    company: "Infosys Ltd.",
    role: "Senior Frontend Developer",
    type: "Full-time",
    duration: "Jan 2022 – Present",
    durationYears: "2.5 yrs",
    location: "Bengaluru, India",
    achievements: [
      "Led a team of 4 developers to build a real-time analytics dashboard serving 50K+ daily users",
      "Reduced page load time by 40% through code splitting and lazy loading optimizations",
      "Introduced TypeScript across the frontend codebase, reducing bug count by 35%",
    ],
    skills: ["React", "Next.js", "TypeScript", "Redux", "Tailwind CSS"],
    aiImpact: "High performer. Consistently exceeded sprint velocity targets by 20%. Strong mentorship qualities emerging.",
  },
  {
    company: "TCS Digital",
    role: "Frontend Developer",
    type: "Full-time",
    duration: "Jun 2019 – Dec 2021",
    durationYears: "2.5 yrs",
    location: "Pune, India",
    achievements: [
      "Built 12+ responsive web applications for banking and insurance clients",
      "Implemented design system used across 3 product teams",
      "Won 'Best Innovation Award' for building an internal component library",
    ],
    skills: ["React", "JavaScript", "CSS3", "REST API", "Git"],
    aiImpact: "Strong contributor during formative years. Rapid skill acquisition observed.",
  },
];

export const candidateProjects = [
  {
    title: "Enterprise Analytics Dashboard",
    description: "Real-time data visualization platform for enterprise clients with 50K+ daily active users.",
    techStack: ["React", "Next.js", "D3.js", "TypeScript", "PostgreSQL"],
    role: "Lead Developer",
    duration: "6 months",
    github: "github.com/rohitkumar/analytics-dash",
    liveDemo: "analytics-demo.vercel.app",
    aiScore: 94,
  },
  {
    title: "Component Design System",
    description: "Reusable UI component library with 60+ components, Storybook documentation, and automated testing.",
    techStack: ["React", "TypeScript", "Storybook", "Jest", "Styled Components"],
    role: "Creator & Maintainer",
    duration: "4 months",
    github: "github.com/rohitkumar/ui-system",
    liveDemo: null,
    aiScore: 91,
  },
  {
    title: "AI Resume Parser",
    description: "Machine learning-powered resume parsing tool that extracts structured data from PDF resumes.",
    techStack: ["Python", "FastAPI", "React", "TensorFlow", "Docker"],
    role: "Full Stack Developer",
    duration: "3 months",
    github: "github.com/rohitkumar/resume-parser",
    liveDemo: "resume-parser.herokuapp.com",
    aiScore: 87,
  },
];

export const candidateEducation = [
  {
    institution: "Bangalore Institute of Technology",
    degree: "B.Tech in Computer Science",
    year: "2015 – 2019",
    cgpa: "8.4 / 10",
    achievements: ["Dean's List (3 semesters)", "Published paper on React Performance Optimization"],
  },
  {
    institution: "Delhi Public School, Bengaluru",
    degree: "Higher Secondary (XII)",
    year: "2013 – 2015",
    cgpa: "92%",
    achievements: ["School Topper in Computer Science"],
  },
];

export const candidateCertifications = [
  {
    name: "Meta Front-End Developer Professional Certificate",
    issuer: "Meta (Coursera)",
    issuedDate: "Mar 2023",
    expiry: "No Expiry",
    credentialLink: "coursera.org/verify/ABCDE12345",
    verified: true,
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    issuedDate: "Jul 2023",
    expiry: "Jul 2026",
    credentialLink: "aws.amazon.com/verification",
    verified: true,
  },
  {
    name: "Google UX Design Certificate",
    issuer: "Google (Coursera)",
    issuedDate: "Nov 2022",
    expiry: "No Expiry",
    credentialLink: "coursera.org/verify/FGHIJ67890",
    verified: true,
  },
];

export const candidateAssessments = {
  technical: { score: 92, percentile: 96, rank: 342, total: 8500, attempts: 1, validity: "Valid until Dec 2024" },
  coding: { score: 88, percentile: 91, rank: 765, total: 8500, attempts: 1, validity: "Valid until Dec 2024" },
  communication: { score: 94, percentile: 98, rank: 170, total: 8500, attempts: 1, validity: "Valid until Dec 2024" },
  behaviour: { score: 85, percentile: 88, rank: 1020, total: 8500, attempts: 1, validity: "Valid until Dec 2024" },
  aptitude: { score: 90, percentile: 94, rank: 510, total: 8500, attempts: 1, validity: "Valid until Dec 2024" },
};

export const candidateAICareerSummary = {
  careerSummary: "Rohit is a proven frontend specialist with consistent growth across his 5-year career. He has transitioned from a junior contributor to a team lead, demonstrating strong technical depth and emerging leadership capabilities.",
  leadershipPotential: "Moderate-High. Currently leading a team of 4. Shows mentorship instincts and strategic thinking in sprint planning.",
  communicationStyle: "Clear, structured, and empathetic communicator. Scores in the top 2% for verbal clarity in video assessments.",
  learningAbility: "Fast learner. Adopted TypeScript across an entire codebase within 3 months of joining current role.",
  strengths: [
    "Deep React/Next.js expertise",
    "Strong visual design intuition",
    "Excellent written and verbal communication",
    "Fast learner and self-motivated",
    "Good at mentoring junior developers",
  ],
  weaknesses: [
    "Limited backend/infrastructure experience",
    "System design skills need development",
    "Performance optimization knowledge is growing but not expert-level",
  ],
  recommendedRoles: ["Senior Frontend Engineer", "Lead UI Developer", "Frontend Architect", "Design System Engineer"],
  careerGrowthPrediction: "With targeted system design training, Rohit is on track for a Staff Engineer / Frontend Architect role within 2–3 years.",
};

export const candidateRecommendations = [
  { type: "Recommended Job", title: "Senior Frontend Engineer at Stripe", match: 96, reason: "Perfect skills and experience alignment" },
  { type: "Recommended Job", title: "Lead UI Developer at Figma", match: 92, reason: "Strong design system background" },
  { type: "Salary Prediction", title: "₹22–26 LPA", reason: "Based on skills, experience, and market benchmarks" },
  { type: "Skill Gap", title: "System Design", reason: "Would unlock Staff Engineer roles" },
  { type: "Learning Course", title: "Advanced System Design (Educative)", reason: "Directly addresses primary skill gap" },
  { type: "Career Roadmap", title: "Frontend Architect in 2–3 years", reason: "Current trajectory with recommended training" },
  { type: "Interview Tips", title: "Focus on System Design questions", reason: "Most common gap area for senior frontend interviews" },
];

export const candidateActivity = [
  { event: "Profile Updated", date: "2 hours ago", icon: "edit", color: "text-secondary" },
  { event: "Technical Assessment Completed — Score: 92%", date: "3 days ago", icon: "assignment_turned_in", color: "text-green" },
  { event: "Interview Scheduled with Infosys (Round 2)", date: "5 days ago", icon: "calendar_today", color: "text-[#7C4DFF]" },
  { event: "Recruiter Viewed Profile (Alex Rivera, HireGo)", date: "1 week ago", icon: "visibility", color: "text-yellow" },
  { event: "Applied for Senior Frontend Developer at Stripe", date: "2 weeks ago", icon: "send", color: "text-secondary" },
  { event: "Shortlisted by 3 Employers", date: "2 weeks ago", icon: "star", color: "text-yellow" },
  { event: "Video Resume Uploaded", date: "3 weeks ago", icon: "videocam", color: "text-primary" },
  { event: "Offer Received from TCS Digital", date: "1 month ago", icon: "card_giftcard", color: "text-green" },
];

export const candidateAnalytics = {
  recruiterViews: { value: 147, trend: "+23% this month" },
  profileVisits: { value: 892, trend: "+12% this month" },
  applicationRate: { value: "68%", trend: "+5% vs last month" },
  interviewConversion: { value: "42%", trend: "+8% vs last month" },
  selectionRate: { value: "18%", trend: "Above industry average" },
  aiMatchTrend: { value: "92%", trend: "Stable" },
  weeklyActivity: { value: 12, trend: "Active" },
  monthlyGrowth: { value: "+15%", trend: "Profile strength improving" },
};
