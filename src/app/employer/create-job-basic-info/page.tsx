"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { useJobCreationStore, JobType, WorkMode, ExperienceLevel } from "@/store/useJobCreationStore";
import { PageContainer } from "@/components/employer/LayoutSystem";

// Comprehensive Roles Taxonomy (Role Dictionary)
const COMPREHENSIVE_ROLES = [
  // Engineering & Tech
  { value: "Software Engineer", label: "Software Engineer", category: "Engineering" },
  { value: "Frontend Developer", label: "Frontend Developer", category: "Engineering" },
  { value: "Backend Developer", label: "Backend Developer", category: "Engineering" },
  { value: "Full Stack Engineer", label: "Full Stack Engineer", category: "Engineering" },
  { value: "AI Engineer", label: "AI Engineer", category: "Engineering" },
  { value: "Machine Learning Engineer", label: "Machine Learning Engineer", category: "Engineering" },
  { value: "Data Engineer", label: "Data Engineer", category: "Engineering" },
  { value: "DevOps Engineer", label: "DevOps Engineer", category: "Engineering" },
  { value: "SRE (Site Reliability Engineer)", label: "SRE (Site Reliability Engineer)", category: "Engineering" },
  { value: "Cloud Architect", label: "Cloud Architect", category: "Engineering" },
  { value: "Security Engineer", label: "Security Engineer", category: "Engineering" },
  { value: "Embedded Systems Engineer", label: "Embedded Systems Engineer", category: "Engineering" },
  { value: "QA Automation Engineer", label: "QA Automation Engineer", category: "Engineering" },
  { value: "Database Administrator", label: "Database Administrator", category: "Engineering" },
  { value: "Mobile App Developer (iOS/Android)", label: "Mobile App Developer", category: "Engineering" },
  { value: "Solutions Architect", label: "Solutions Architect", category: "Engineering" },
  { value: "Systems Administrator", label: "Systems Administrator", category: "Engineering" },
  { value: "Blockchain Developer", label: "Blockchain Developer", category: "Engineering" },
  // Product & Project Management
  { value: "Product Manager", label: "Product Manager", category: "Product Management" },
  { value: "Associate Product Manager", label: "Associate Product Manager", category: "Product Management" },
  { value: "Technical Product Manager", label: "Technical Product Manager", category: "Product Management" },
  { value: "Director of Product", label: "Director of Product", category: "Product Management" },
  { value: "Project Manager", label: "Project Manager", category: "Product Management" },
  { value: "Program Manager", label: "Program Manager", category: "Product Management" },
  { value: "Scrum Master", label: "Scrum Master", category: "Product Management" },
  { value: "Agile Coach", label: "Agile Coach", category: "Product Management" },
  // Data Science & Analytics
  { value: "Data Scientist", label: "Data Scientist", category: "Data & Analytics" },
  { value: "Data Analyst", label: "Data Analyst", category: "Data & Analytics" },
  { value: "Business Intelligence Analyst", label: "Business Intelligence Analyst", category: "Data & Analytics" },
  { value: "AI Researcher", label: "AI Researcher", category: "Data & Analytics" },
  { value: "Quantitative Analyst", label: "Quantitative Analyst", category: "Data & Analytics" },
  // Design & Creative
  { value: "UI/UX Designer", label: "UI/UX Designer", category: "Design" },
  { value: "Product Designer", label: "Product Designer", category: "Design" },
  { value: "Interaction Designer", label: "Interaction Designer", category: "Design" },
  { value: "Visual Designer", label: "Visual Designer", category: "Design" },
  { value: "Graphic Designer", label: "Graphic Designer", category: "Design" },
  { value: "Motion Designer", label: "Motion Designer", category: "Design" },
  { value: "UX Researcher", label: "UX Researcher", category: "Design" },
  // Marketing & Growth
  { value: "Growth Marketer", label: "Growth Marketer", category: "Marketing" },
  { value: "Digital Marketing Specialist", label: "Digital Marketing Specialist", category: "Marketing" },
  { value: "SEO Specialist", label: "SEO Specialist", category: "Marketing" },
  { value: "Content Strategist", label: "Content Strategist", category: "Marketing" },
  { value: "Copywriter", label: "Copywriter", category: "Marketing" },
  { value: "Social Media Manager", label: "Social Media Manager", category: "Marketing" },
  { value: "Brand Manager", label: "Brand Manager", category: "Marketing" },
  // Sales & Customer Success
  { value: "Account Executive", label: "Account Executive", category: "Sales" },
  { value: "Sales Development Representative (SDR)", label: "Sales Development Rep", category: "Sales" },
  { value: "Business Development Manager", label: "Business Development Manager", category: "Sales" },
  { value: "Customer Success Manager", label: "Customer Success Manager", category: "Sales" },
  { value: "Technical Account Manager", label: "Technical Account Manager", category: "Sales" },
  // Operations, HR & Finance
  { value: "HR Manager", label: "HR Manager", category: "Operations & HR" },
  { value: "Talent Acquisition Specialist", label: "Talent Acquisition Specialist", category: "Operations & HR" },
  { value: "HR Generalist", label: "HR Generalist", category: "Operations & HR" },
  { value: "Operations Manager", label: "Operations Manager", category: "Operations & HR" },
  { value: "Office Administrator", label: "Office Administrator", category: "Operations & HR" },
  { value: "Financial Analyst", label: "Financial Analyst", category: "Finance" },
  { value: "Accountant", label: "Accountant", category: "Finance" },
  { value: "Controller", label: "Controller", category: "Finance" }
];

// Group the roles by category for react-select
const getGroupedOptions = () => {
  const groups: Record<string, any[]> = {};
  COMPREHENSIVE_ROLES.forEach(role => {
    if (!groups[role.category]) {
      groups[role.category] = [];
    }
    groups[role.category].push({ value: role.value, label: role.label });
  });
  return Object.entries(groups).map(([category, options]) => ({
    label: category,
    options
  }));
};

const groupedOptions = getGroupedOptions();

// Comprehensive list of popular Indian locations & global tech hubs for autocomplete
const COMPREHENSIVE_LOCATIONS = [
  // India - Tier 1 & 2 Tech Hubs
  "Bangalore, Karnataka, India",
  "Hyderabad, Telangana, India",
  "Pune, Maharashtra, India",
  "Mumbai, Maharashtra, India",
  "Chennai, Tamil Nadu, India",
  "Gurgaon, Haryana, India",
  "Noida, Uttar Pradesh, India",
  "Delhi, NCR, India",
  "Kolkata, West Bengal, India",
  "Ahmedabad, Gujarat, India",
  "Jaipur, Rajasthan, India",
  "Chandigarh, India",
  "Kochi, Kerala, India",
  "Thiruvananthapuram, Kerala, India",
  "Coimbatore, Tamil Nadu, India",
  "Indore, Madhya Pradesh, India",
  "Bhubaneswar, Odisha, India",
  "Visakhapatnam, Andhra Pradesh, India",
  "Surat, Gujarat, India",
  "Lucknow, Uttar Pradesh, India",
  "Nagpur, Maharashtra, India",
  // Global Tech Hubs
  "Remote (Global)",
  "Remote (India Only)",
  "San Francisco, CA, USA",
  "New York, NY, USA",
  "Seattle, WA, USA",
  "Austin, TX, USA",
  "Boston, MA, USA",
  "Los Angeles, CA, USA",
  "Chicago, IL, USA",
  "London, United Kingdom",
  "Berlin, Germany",
  "Munich, Germany",
  "Paris, France",
  "Amsterdam, Netherlands",
  "Dublin, Ireland",
  "Singapore",
  "Tokyo, Japan",
  "Sydney, NSW, Australia",
  "Melbourne, VIC, Australia",
  "Toronto, ON, Canada",
  "Vancouver, BC, Canada",
  "Montreal, QC, Canada",
];

// React-Select custom styles for glassmorphic dark-mode with burned-red accent
const customSelectStyles = (hasError: boolean) => ({
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "#121215",
    borderColor: hasError ? "#FF5252" : state.isFocused ? "#FF5252" : "rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    minHeight: "48px",
    boxShadow: "none",
    "&:hover": {
      borderColor: hasError ? "#FF5252" : "rgba(255, 255, 255, 0.2)",
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "#1E1E24",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    zIndex: 50,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? "#FF5252" 
      : state.isFocused 
        ? "rgba(255, 82, 82, 0.15)" 
        : "transparent",
    color: "#F8FAFC",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#FF5252",
    },
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: "rgba(255, 82, 82, 0.15)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 82, 82, 0.3)",
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: "#FF8A80",
    fontSize: "11px",
    fontWeight: "bold",
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: "#FF8A80",
    "&:hover": {
      backgroundColor: "#FF5252",
      color: "#FFFFFF",
    },
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "#64748B",
    fontSize: "13px",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "#F8FAFC",
  }),
  input: (provided: any) => ({
    ...provided,
    color: "#F8FAFC",
  }),
});

// Location Typeahead/Autocomplete Component
function LocationTypeahead({ 
  value, 
  onChange, 
  error 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  error?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (val.trim()) {
      const filtered = COMPREHENSIVE_LOCATIONS.filter(loc =>
        loc.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions(COMPREHENSIVE_LOCATIONS);
      setIsOpen(true);
    }
  };

  const selectSuggestion = (loc: string) => {
    onChange(loc);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          location_on
        </span>
        <input 
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (!value) setSuggestions(COMPREHENSIVE_LOCATIONS);
            setIsOpen(true);
          }}
          placeholder="Search and choose location..." 
          className={`w-full h-12 bg-[#121215] border ${
            error ? 'border-[#FF5252] focus:border-[#FF5252]' : 'border-white/10 focus:border-[#FF5252]'
          } rounded-xl pl-12 pr-4 font-body-md text-[#F8FAFC] placeholder-slate-600 outline-none transition-all`}
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-[#1E1E24] border border-white/10 rounded-xl max-h-60 overflow-y-auto z-50 shadow-2xl">
          {suggestions.map((loc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectSuggestion(loc)}
              className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-[#FF5252]/10 hover:text-[#F8FAFC] transition-colors"
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmployerPageE6() {
  const router = useRouter();
  const store = useJobCreationStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobPostsLeft, setJobPostsLeft] = useState<number | null>(null);
  const [checkingCredits, setCheckingCredits] = useState(true);

  // Pre-flight check for available job credits
  useEffect(() => {
    async function checkCredits() {
      try {
        const res = await fetch("/api/employer/subscribe");
        const data = await res.json();
        if (data.success && data.credits) {
          setJobPostsLeft(data.credits.jobPostsLeft ?? 0);
        } else {
          setJobPostsLeft(0);
        }
      } catch {
        setJobPostsLeft(0);
      } finally {
        setCheckingCredits(false);
      }
    }
    checkCredits();
  }, []);

  // Form Validation logic
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (jobPostsLeft !== null && jobPostsLeft <= 0) {
      newErrors.credits = "You have 0 Job Posting Credits remaining. Please upgrade your plan before posting.";
      setErrors(newErrors);
      return false;
    }

    if (!store.selectedRoles || store.selectedRoles.length === 0) {
      newErrors.selectedRoles = "Please select at least one job role.";
    }

    if (!store.location.trim()) {
      newErrors.location = "Location is required (search and select from list).";
    }

    if (store.salaryMin && isNaN(Number(store.salaryMin))) {
      newErrors.salaryMin = "Minimum salary must be a valid number.";
    }

    if (store.salaryMax && isNaN(Number(store.salaryMax))) {
      newErrors.salaryMax = "Maximum salary must be a valid number.";
    }

    if (store.salaryMin && store.salaryMax && Number(store.salaryMax) < Number(store.salaryMin)) {
      newErrors.salaryMax = "Maximum salary cannot be lower than minimum salary.";
    }

    if (store.numberOfOpenings && (isNaN(Number(store.numberOfOpenings)) || Number(store.numberOfOpenings) < 1)) {
      newErrors.numberOfOpenings = "Number of openings must be at least 1.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setIsSubmitting(true);
    if (validateForm()) {
      router.push("/employer/create-job-ai-jd-writing");
    }
  };

  const selectedRolesOptions = store.selectedRoles 
    ? store.selectedRoles.map(role => ({ value: role, label: role }))
    : [];

  const handleRolesChange = (selected: any) => {
    const rolesArray = selected ? selected.map((opt: any) => opt.value) : [];
    store.updateField('selectedRoles', rolesArray);
    
    // Auto-populate jobTitle with the chosen roles joined by slashes
    store.updateField('jobTitle', rolesArray.join(" / "));
    
    // Auto-update categories based on selection
    const categoriesSet = new Set<string>();
    rolesArray.forEach((r: string) => {
      COMPREHENSIVE_ROLES.forEach(role => {
        if (role.value === r) {
          categoriesSet.add(role.category);
        }
      });
    });
    store.updateField('categories', Array.from(categoriesSet));
    
    // Automatically clear errors on select
    if (rolesArray.length > 0) {
      setErrors(prev => ({ ...prev, selectedRoles: "" }));
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Zero-Credits Paywall Overlay Banner */}
        {jobPostsLeft !== null && jobPostsLeft <= 0 && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-red-400">warning</span>
              <div>
                <h4 className="font-bold text-sm text-white">0 Job Posting Credits Remaining</h4>
                <p className="text-xs text-slate-300">You have exhausted your job posting quota. Upgrade your plan to publish new jobs.</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/employer/subscriptions")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5252] text-white shadow-lg whitespace-nowrap hover:bg-[#E53935] transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        )}

        {/* Stepper Header */}
        <div className="border-b border-white/5 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <p className="text-[#FF5252] font-mono text-xs uppercase tracking-widest mb-1">Step 1 of 3</p>
              <h2 className="text-3xl font-extrabold text-white font-display tracking-tight">Create New Job</h2>
              <p className="text-slate-400 text-xs mt-1">Start with the details candidates and your hiring team need first.</p>
            </div>
            <div className="flex items-center gap-2">
              {jobPostsLeft !== null && (
                <span className={`text-xs font-bold uppercase border px-3 py-1 rounded-full ${
                  jobPostsLeft > 0 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {jobPostsLeft} Job Credits Left
                </span>
              )}
              <span className="text-[#FF5252] text-xs font-bold uppercase bg-[#FF5252]/10 border border-[#FF5252]/20 px-3 py-1 rounded-full">
                Basic Information
              </span>
            </div>
          </div>
          <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-[#FF5252] rounded-full w-1/3 shadow-[0_0_10px_rgba(255,82,82,0.5)] transition-all duration-500"></div>
          </div>
        </div>

        {/* Form Container with 3 logical Card groupings */}
        <div className="space-y-6">
          
          {/* Card 1: Core Job Identification */}
          <div className="glass-card rounded-[20px] bg-[#16161B] border border-white/5 p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              1. Core Identification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Roles Selector */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Job Roles <span className="text-[#FF5252]">*</span>
                </label>
                <Select
                  isMulti
                  options={groupedOptions}
                  value={selectedRolesOptions}
                  onChange={handleRolesChange}
                  placeholder="Search and select job roles..."
                  styles={customSelectStyles(!!errors.selectedRoles)}
                  className="text-xs text-[#F8FAFC]"
                  classNamePrefix="select"
                />
                {errors.selectedRoles && (
                  <span className="text-[10px] font-bold text-[#FF5252] block animate-pulse">{errors.selectedRoles}</span>
                )}
                {store.categories && store.categories.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Mapped Categories:</span>
                    {store.categories.map(cat => (
                      <span key={cat} className="px-2 py-0.5 bg-[#FF5252]/10 text-[#FF5252] rounded text-[10px] font-bold border border-[#FF5252]/20">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Department
                </label>
                <div className="relative">
                  <select 
                    value={store.department}
                    onChange={(e) => store.updateField('department', e.target.value)}
                    className="w-full h-12 bg-[#121215] border border-white/10 focus:border-[#FF5252] rounded-xl px-4 text-xs text-[#F8FAFC] outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Department</option>
                    <option>Engineering</option>
                    <option>Product</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Operations</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">
                    unfold_more
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Location & Work Style */}
          <div className="glass-card rounded-[20px] bg-[#16161B] border border-white/5 p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              2. Location &amp; Work Style
            </h3>
            
            {/* Job Type Selection */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Job Type</label>
              <div className="flex flex-wrap gap-2.5">
                {(["Full-time", "Part-time", "Contract", "Internship"] as JobType[]).map((t) => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => store.updateField('jobType', t)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 ${
                      store.jobType === t 
                        ? 'border-[#FF5252]/40 bg-[#FF5252]/20 text-[#FF5252] shadow-[0_4px_12px_rgba(255,82,82,0.15)]' 
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Mode Selection */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Work Mode</label>
              <div className="flex flex-wrap gap-2.5">
                {(['On-site', 'Remote', 'Hybrid'] as WorkMode[]).map(mode => (
                  <button 
                    key={mode}
                    type="button"
                    onClick={() => store.updateField('workMode', mode)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 ${
                      store.workMode === mode 
                        ? 'border-[#FF5252]/40 bg-[#FF5252]/20 text-[#FF5252] shadow-[0_4px_12px_rgba(255,82,82,0.15)]' 
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Autocomplete */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Location <span className="text-[#FF5252]">*</span>
              </label>
              <LocationTypeahead 
                value={store.location} 
                onChange={(val) => {
                  store.updateField('location', val);
                  if (val.trim()) {
                    setErrors(prev => ({ ...prev, location: "" }));
                  }
                }} 
                error={errors.location}
              />
              {errors.location && (
                <span className="text-[10px] font-bold text-[#FF5252] block animate-pulse">{errors.location}</span>
              )}
            </div>
          </div>

          {/* Card 3: Compensation & Key Parameters */}
          <div className="glass-card rounded-[20px] bg-[#16161B] border border-white/5 p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              3. Compensation &amp; Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Salary Range */}
              <div className="space-y-2 md:col-span-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Salary Range</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Min" 
                    className={`w-full h-12 bg-[#121215] border ${
                      errors.salaryMin ? 'border-[#FF5252]' : 'border-white/10 focus:border-[#FF5252]'
                    } rounded-xl px-4 text-xs text-[#F8FAFC] placeholder-slate-600 outline-none transition-all`}
                    value={store.salaryMin}
                    onChange={e => {
                      store.updateField('salaryMin', e.target.value);
                      setErrors(prev => ({ ...prev, salaryMin: "", salaryMax: "" }));
                    }}
                  />
                  <span className="text-slate-500">-</span>
                  <input 
                    type="text" 
                    placeholder="Max" 
                    className={`w-full h-12 bg-[#121215] border ${
                      errors.salaryMax ? 'border-[#FF5252]' : 'border-white/10 focus:border-[#FF5252]'
                    } rounded-xl px-4 text-xs text-[#F8FAFC] placeholder-slate-600 outline-none transition-all`}
                    value={store.salaryMax}
                    onChange={e => {
                      store.updateField('salaryMax', e.target.value);
                      setErrors(prev => ({ ...prev, salaryMin: "", salaryMax: "" }));
                    }}
                  />
                </div>
                {(errors.salaryMin || errors.salaryMax) && (
                  <span className="text-[10px] font-bold text-[#FF5252] block animate-pulse">
                    {errors.salaryMin || errors.salaryMax}
                  </span>
                )}
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Experience Level</label>
                <div className="relative">
                  <select 
                    className="w-full h-12 bg-[#121215] border border-white/10 focus:border-[#FF5252] rounded-xl px-4 text-xs text-[#F8FAFC] outline-none transition-all appearance-none cursor-pointer"
                    value={store.experienceLevel}
                    onChange={e => store.updateField('experienceLevel', e.target.value as ExperienceLevel)}
                  >
                    <option>Entry-level</option>
                    <option>Mid-level</option>
                    <option>Senior</option>
                    <option>Lead</option>
                    <option>Director</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">
                    unfold_more
                  </span>
                </div>
              </div>

              {/* Openings count */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">No. of Openings</label>
                <input 
                  className={`w-full h-12 bg-[#121215] border ${
                    errors.numberOfOpenings ? 'border-[#FF5252]' : 'border-white/10 focus:border-[#FF5252]'
                  } rounded-xl px-4 text-xs text-[#F8FAFC] outline-none transition-all`} 
                  type="number" 
                  min="1"
                  value={store.numberOfOpenings}
                  onChange={e => {
                    store.updateField('numberOfOpenings', e.target.value);
                    setErrors(prev => ({ ...prev, numberOfOpenings: "" }));
                  }}
                />
                {errors.numberOfOpenings && (
                  <span className="text-[10px] font-bold text-[#FF5252] block animate-pulse">{errors.numberOfOpenings}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/5">
          <button
            type="button"
            onClick={() => router.push("/employer/dashboard")}
            className="h-12 px-8 bg-white/5 border border-white/10 rounded-full font-bold text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            Cancel
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push("/employer/job-listings-management")}
              className="h-12 px-8 bg-white/5 border border-white/10 rounded-full font-bold text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              Save Draft
            </button>
            <button 
              type="button"
              onClick={handleNext}
              className="h-12 px-10 bg-[#FF5252] hover:bg-[#FF5252]/90 rounded-full font-bold text-xs text-white shadow-lg shadow-[#FF5252]/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 group"
            >
              Save and Next
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-sm">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
