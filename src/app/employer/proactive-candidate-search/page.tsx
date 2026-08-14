"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import EmployerHeader from "@/components/employer/EmployerHeader";
import { useEmployer } from "@/context/EmployerContext";

/* ─── THEME ─── */
const T = {
  pageBg: "#0A0A0C", card: "#121215", cardAlt: "#16161B",
  border: "rgba(255,255,255,0.06)", red: "#FF5252", green: "#26A69A",
  blue: "#29B6F6", yellow: "#FFCA28", purple: "#AB47BC",
  slate: "#94A3B8", sky: "#00BCD4", orange: "#FF9800",
};

type ViewMode = "table" | "grid" | "list";
type Density = "compact" | "comfortable" | "detailed";
type PanelTab = "profile" | "ai" | "notes" | "timeline";

interface Tag { label: string; color: string }
interface Note { text: string; by: string; at: string }
interface SavedSearch { name: string; query: string; filters: Record<string, string> }
interface Collection { id: string; name: string; icon: string; candidateIds: string[] }

const TAG_PRESETS: Tag[] = [
  { label: "Priority", color: T.red }, { label: "Urgent", color: T.orange },
  { label: "CEO Review", color: T.purple }, { label: "Tech Round", color: T.blue },
  { label: "Good Communication", color: T.green }, { label: "Strong Backend", color: T.sky },
  { label: "Weak DSA", color: T.yellow },
];

const AVAILABILITY_CONFIG: Record<string, { color: string; bg: string }> = {
  "Immediate": { color: T.green, bg: `${T.green}20` },
  "Available next week": { color: T.green, bg: `${T.green}15` },
  "15 Days": { color: T.blue, bg: `${T.blue}15` },
  "30 Days": { color: T.yellow, bg: `${T.yellow}15` },
  "60 Days": { color: T.orange, bg: `${T.orange}15` },
  "Not Looking": { color: T.red, bg: `${T.red}15` },
};

const PIPELINE_STAGES = ["Applied", "AI Screening", "Technical Interview", "HR Interview", "Assessment", "Offer", "Hired", "Rejected"];

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "all", name: "All Candidates", icon: "groups", candidateIds: [] },
  { id: "shortlisted", name: "Shortlisted", icon: "star", candidateIds: [] },
  { id: "interview-week", name: "Interview This Week", icon: "event", candidateIds: [] },
  { id: "future-talent", name: "Future Talent", icon: "diamond", candidateIds: [] },
  { id: "priority", name: "Priority Candidates", icon: "priority_high", candidateIds: [] },
];

const PINNED_FILTER_PRESETS = [
  { label: "AI Match > 90%", key: "matchScore", value: "90" },
  { label: "Immediate Joiners", key: "noticePeriod", value: "Immediate" },
  { label: "Remote", key: "location", value: "Remote" },
  { label: "Notice < 30 Days", key: "noticePeriod", value: "30" },
];

/* ─── AI Explanation Generator ─── */
function getAIExplanation(c: any) {
  const factors = [];
  if (c.matchScore >= 90) factors.push({ label: "Skills matched", pct: Math.min(c.matchScore, 99), pass: true });
  else factors.push({ label: "Skills partially matched", pct: c.matchScore - 10, pass: false });
  factors.push({ label: "Experience matched", pct: c.experience?.includes("8") || c.experience?.includes("10") || c.experience?.includes("12") ? 100 : 75, pass: true });
  factors.push({ label: "Salary within range", pct: 90, pass: !c.expectedSalary?.includes("200") });
  factors.push({ label: "Notice period fits", pct: c.noticePeriod === "Immediate" ? 100 : 70, pass: c.noticePeriod === "Immediate" || c.noticePeriod?.includes("15") });
  if (c.assessmentScore > 80) factors.push({ label: "Assessment passed", pct: c.assessmentScore, pass: true });
  if (c.aiInterviewScore > 80) factors.push({ label: "Communication excellent", pct: c.aiInterviewScore, pass: true });
  return factors;
}

function getRecommendedAction(c: any): { text: string; icon: string; color: string } {
  if (c.matchScore >= 95 && c.assessmentScore >= 90) return { text: "Interview Now — Top Candidate", icon: "bolt", color: T.green };
  if (c.matchScore >= 90) return { text: "High response probability", icon: "trending_up", color: T.blue };
  if (c.matchScore >= 80 && c.assessmentScore < 80) return { text: "Recommend Skill Assessment", icon: "quiz", color: T.yellow };
  if (c.matchScore >= 70) return { text: "Likely to accept offer", icon: "handshake", color: T.sky };
  return { text: "Missing required skills", icon: "warning", color: T.orange };
}

function getActivityBadge(lastActivity: string): { text: string; color: string } {
  if (lastActivity?.includes("hour") || lastActivity?.includes("min")) return { text: `Active ${lastActivity}`, color: T.green };
  if (lastActivity?.includes("Yesterday") || lastActivity === "1 day ago") return { text: "Active yesterday", color: T.blue };
  return { text: `Last seen ${lastActivity}`, color: T.slate };
}

/* ─── MAIN COMPONENT ─── */
export default function CandidateMarketplace() {
  const router = useRouter();
  const { candidates } = useEmployer();

  // ─── Core State ───
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [density, setDensity] = useState<Density>("compact");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCol, setSortCol] = useState<string>("matchScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // ─── Filter State ───
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [pinnedFilters, setPinnedFilters] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  // ─── Selection & Interaction ───
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PanelTab>("profile");
  const [compareOpen, setCompareOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [tagDropdownId, setTagDropdownId] = useState<string | null>(null);
  const [noteInputId, setNoteInputId] = useState<string | null>(null);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState("all");
  const [aiExplainId, setAiExplainId] = useState<string | null>(null);

  // ─── Persistent Data (tags, notes, collections) ───
  const [candidateTags, setCandidateTags] = useState<Record<string, Tag[]>>({});
  const [candidateNotes, setCandidateNotes] = useState<Record<string, Note[]>>({});
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [newNoteTxt, setNewNoteTxt] = useState("");
  const [newCollName, setNewCollName] = useState("");

  // ─── Toast ───
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const searchRef = useRef<HTMLInputElement>(null);

  // ─── Load persisted state ───
  useEffect(() => {
    try {
      const d = localStorage.getItem("hg_density"); if (d) setDensity(d as Density);
      const v = localStorage.getItem("hg_view"); if (v) setViewMode(v as ViewMode);
      const pf = localStorage.getItem("hg_pinned"); if (pf) setPinnedFilters(JSON.parse(pf));
      const ss = localStorage.getItem("hg_saved"); if (ss) setSavedSearches(JSON.parse(ss));
      const tags = localStorage.getItem("hg_tags"); if (tags) setCandidateTags(JSON.parse(tags));
      const notes = localStorage.getItem("hg_notes"); if (notes) setCandidateNotes(JSON.parse(notes));
      const cols = localStorage.getItem("hg_collections"); if (cols) setCollections(JSON.parse(cols));
    } catch {}
  }, []);

  // ─── Persist on change ───
  useEffect(() => { localStorage.setItem("hg_density", density); }, [density]);
  useEffect(() => { localStorage.setItem("hg_view", viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem("hg_pinned", JSON.stringify(pinnedFilters)); }, [pinnedFilters]);
  useEffect(() => { localStorage.setItem("hg_saved", JSON.stringify(savedSearches)); }, [savedSearches]);
  useEffect(() => { localStorage.setItem("hg_tags", JSON.stringify(candidateTags)); }, [candidateTags]);
  useEffect(() => { localStorage.setItem("hg_notes", JSON.stringify(candidateNotes)); }, [candidateNotes]);
  useEffect(() => { localStorage.setItem("hg_collections", JSON.stringify(collections)); }, [collections]);

  // ─── Keyboard Shortcuts (Req #17) ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "s" || e.key === "S") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "f" || e.key === "F") { e.preventDefault(); /* focus filter - handled via search */ searchRef.current?.focus(); }
      if (e.key === "c" || e.key === "C") { if (selected.size >= 2) { e.preventDefault(); setCompareOpen(true); } }
      if (e.key === "a" || e.key === "A") { e.preventDefault(); setSelected(new Set(filteredCandidates.map(c => c.id))); }
      if (e.key === "Escape") { setPreviewId(null); setCompareOpen(false); setShortcutsOpen(false); setExportOpen(false); setTagDropdownId(null); }
      if (e.key === "?") { e.preventDefault(); setShortcutsOpen(true); }
      if (e.key === "i" || e.key === "I") { if (selected.size > 0) { e.preventDefault(); triggerToast(`Invited ${selected.size} candidates`); } }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ─── Filtering & Sorting ───
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Collection filter
    if (activeCollection !== "all") {
      const col = collections.find(c => c.id === activeCollection);
      if (col && col.candidateIds.length > 0) result = result.filter(c => col.candidateIds.includes(c.id));
    }

    // Pipeline stage filter
    if (stageFilter) result = result.filter(c => c.stage === stageFilter);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.currentRole.toLowerCase().includes(q) ||
        c.currentCompany.toLowerCase().includes(q) ||
        c.currentLocation.toLowerCase().includes(q) ||
        c.appliedJob.toLowerCase().includes(q) ||
        c.education.toLowerCase().includes(q)
      );
    }

    // Active filters
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (!val) return;
      if (key === "matchScore") result = result.filter(c => c.matchScore >= parseInt(val));
      if (key === "noticePeriod") {
        if (val === "Immediate") result = result.filter(c => c.noticePeriod === "Immediate");
        else if (val === "30") result = result.filter(c => c.noticePeriod === "Immediate" || c.noticePeriod?.includes("15") || c.noticePeriod?.includes("2 weeks"));
      }
      if (key === "location") {
        if (val === "Remote") result = result.filter(c => c.preferredLocation?.toLowerCase().includes("remote") || c.currentLocation?.toLowerCase().includes("remote"));
      }
      if (key === "stage") result = result.filter(c => c.stage === val);
    });

    // Tag search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const tagMatches = candidates.filter(c => {
        const tags = candidateTags[c.id] || [];
        return tags.some(t => t.label.toLowerCase().includes(q));
      });
      tagMatches.forEach(c => { if (!result.find(r => r.id === c.id)) result.push(c); });
    }

    // Sort
    result.sort((a: any, b: any) => {
      const aVal = a[sortCol]; const bVal = b[sortCol];
      if (typeof aVal === "number" && typeof bVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [candidates, searchQuery, activeFilters, stageFilter, sortCol, sortDir, activeCollection, collections, candidateTags]);

  // ─── Pagination ───
  const totalPages = Math.ceil(filteredCandidates.length / pageSize);
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── Pipeline counts ───
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(s => { counts[s] = candidates.filter(c => c.stage === s).length; });
    return counts;
  }, [candidates]);

  // ─── Handlers ───
  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(prev => prev.size === paginatedCandidates.length ? new Set() : new Set(paginatedCandidates.map(c => c.id)));
  const toggleSort = (col: string) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("desc"); } };
  const addTag = (cId: string, tag: Tag) => { setCandidateTags(prev => ({ ...prev, [cId]: [...(prev[cId] || []).filter(t => t.label !== tag.label), tag] })); setTagDropdownId(null); triggerToast(`Tag "${tag.label}" added`); };
  const removeTag = (cId: string, label: string) => { setCandidateTags(prev => ({ ...prev, [cId]: (prev[cId] || []).filter(t => t.label !== label) })); };
  const addNote = (cId: string) => { if (!newNoteTxt.trim()) return; setCandidateNotes(prev => ({ ...prev, [cId]: [{ text: newNoteTxt, by: "Alex Rivera", at: "Just now" }, ...(prev[cId] || [])] })); setNewNoteTxt(""); setNoteInputId(null); triggerToast("Note added"); };
  const saveSearch = () => { if (!saveSearchName.trim()) return; setSavedSearches(prev => [...prev, { name: saveSearchName, query: searchQuery, filters: { ...activeFilters } }]); setSaveSearchName(""); setSaveSearchOpen(false); triggerToast(`Search "${saveSearchName}" saved`); };
  const loadSearch = (s: SavedSearch) => { setSearchQuery(s.query); setActiveFilters(s.filters); triggerToast(`Loaded "${s.name}"`); };
  const togglePinFilter = (key: string) => { setPinnedFilters(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]); };
  const addToCollection = (colId: string, cIds: string[]) => { setCollections(prev => prev.map(c => c.id === colId ? { ...c, candidateIds: [...new Set([...c.candidateIds, ...cIds])] } : c)); triggerToast(`Added to collection`); };
  const createCollection = () => { if (!newCollName.trim()) return; setCollections(prev => [...prev, { id: `col-${Date.now()}`, name: newCollName, icon: "folder", candidateIds: [] }]); setNewCollName(""); triggerToast(`Collection "${newCollName}" created`); };

  const previewCandidate = previewId ? candidates.find(c => c.id === previewId) : null;
  const selectedCandidates = candidates.filter(c => selected.has(c.id));

  const rowH = density === "compact" ? "py-2.5" : density === "comfortable" ? "py-4" : "py-5";

  // ─── AI Insights (Req #16) ───
  const insights = useMemo(() => {
    const meetAll = candidates.filter(c => c.matchScore >= 85).length;
    const notReviewed = candidates.filter(c => c.stage === "Applied").length;
    const availableNow = candidates.filter(c => c.noticePeriod === "Immediate" || c.availability?.includes("next week")).length;
    return [
      { icon: "check_circle", text: `${meetAll} candidates meet all requirements`, color: T.green },
      { icon: "visibility_off", text: `${notReviewed} candidates not yet reviewed`, color: T.yellow },
      { icon: "schedule", text: `${availableNow} available immediately`, color: T.blue },
    ];
  }, [candidates]);

  return (
    <>
      <EmployerHeader title="Proactive Candidate Search" subtitle="Search, filter, and shortlist candidates across your database" />
      <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 space-y-5" style={{ backgroundColor: T.pageBg, fontFamily: "var(--font-body), system-ui, sans-serif" }}>

        {/* ═══ RECRUITER PRODUCTIVITY BAR (Req #14) ═══ */}
        <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl border overflow-x-auto" style={{ backgroundColor: T.card, borderColor: T.border }}>
          <span className="material-symbols-outlined text-sm" style={{ color: T.blue }}>task_alt</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Today&apos;s Tasks</span>
          <div className="h-4 w-px bg-white/10" />
          {[
            { label: "Review", count: candidates.filter(c => c.stage === "Applied").length, icon: "person_search", color: T.green },
            { label: "Interviews", count: candidates.filter(c => c.stage === "Technical Interview" || c.stage === "HR Interview").length, icon: "event", color: T.blue },
            { label: "Offers Pending", count: candidates.filter(c => c.stage === "Offer").length, icon: "mail", color: T.yellow },
            { label: "Follow-ups", count: 6, icon: "reply", color: T.purple },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px]" style={{ color: t.color }}>{t.icon}</span>
              <span className="text-[11px] font-bold text-white">{t.count}</span>
              <span className="text-[10px] text-slate-500">{t.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer hover:text-white" onClick={() => setShortcutsOpen(true)}>
            <span className="material-symbols-outlined text-[14px]">keyboard</span> Shortcuts
          </div>
        </div>

        {/* ═══ SEARCH + SAVED SEARCHES + PINNED FILTERS (Req #2, #3) ═══ */}
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <div className="flex-1 flex items-center gap-2 px-4 h-11 rounded-xl border" style={{ backgroundColor: T.card, borderColor: T.border }}>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input ref={searchRef} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder-slate-500" placeholder="Search candidates by name, role, company, skill, location, or tag... (S)" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>}
            </div>
            {/* Saved Searches */}
            <div className="relative">
              <button onClick={() => setSaveSearchOpen(!saveSearchOpen)} className="h-11 px-4 rounded-xl border text-[10px] font-bold text-slate-300 flex items-center gap-1.5 hover:bg-white/5" style={{ borderColor: T.border }}>
                <span className="material-symbols-outlined text-[16px]">bookmark</span>
                {savedSearches.length > 0 ? `${savedSearches.length} Saved` : "Save Search"}
              </button>
              {saveSearchOpen && (
                <div className="absolute top-full right-0 mt-1 w-64 rounded-xl border p-3 z-50 space-y-2" style={{ backgroundColor: T.card, borderColor: T.border }}>
                  <div className="flex gap-2">
                    <input value={saveSearchName} onChange={e => setSaveSearchName(e.target.value)} className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none" placeholder="Search name..." />
                    <button onClick={saveSearch} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: T.green }}>Save</button>
                  </div>
                  {savedSearches.map((s, i) => (
                    <button key={i} onClick={() => loadSearch(s)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: T.blue }}>search</span>{s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pinned Filters */}
          <div className="flex flex-wrap gap-2">
            {PINNED_FILTER_PRESETS.map(pf => (
              <button key={pf.label} onClick={() => { setActiveFilters(prev => prev[pf.key] === pf.value ? { ...prev, [pf.key]: "" } : { ...prev, [pf.key]: pf.value }); setCurrentPage(1); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                style={{ backgroundColor: activeFilters[pf.key] === pf.value ? `${T.green}15` : T.cardAlt, borderColor: activeFilters[pf.key] === pf.value ? T.green : T.border, color: activeFilters[pf.key] === pf.value ? T.green : T.slate }}>
                <span className="material-symbols-outlined text-[12px]">{activeFilters[pf.key] === pf.value ? "check_circle" : "filter_alt"}</span>{pf.label}
              </button>
            ))}
            {Object.entries(activeFilters).filter(([_, v]) => v).length > 0 && (
              <button onClick={() => { setActiveFilters({}); setStageFilter(null); }} className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">close</span>Clear All
              </button>
            )}
          </div>
        </div>

        {/* ═══ HIRING PIPELINE SNAPSHOT (Req #15) ═══ */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage}>
              {i > 0 && <div className="w-4 h-px" style={{ backgroundColor: T.border }} />}
              <button onClick={() => { setStageFilter(stageFilter === stage ? null : stage); setCurrentPage(1); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border"
                style={{ backgroundColor: stageFilter === stage ? `${T.blue}15` : "transparent", borderColor: stageFilter === stage ? T.blue : "transparent", color: stageFilter === stage ? T.blue : T.slate }}>
                {stage}
                <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: stageFilter === stage ? `${T.blue}25` : `${T.slate}15` }}>{pipelineCounts[stage] || 0}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* ═══ AI INSIGHTS BAR (Req #16) ═══ */}
        <div className="flex gap-3 overflow-x-auto">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap" style={{ backgroundColor: `${ins.color}08`, borderColor: `${ins.color}20` }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: ins.color }}>{ins.icon}</span>
              <span className="text-[10px] font-bold" style={{ color: ins.color }}>{ins.text}</span>
            </div>
          ))}
        </div>

        {/* ═══ TOOLBAR: View Switch + Density + Results Count + Collections + Export (Req #1, #4, #19) ═══ */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white">{filteredCandidates.length} <span className="text-slate-400 font-normal">candidates</span></span>
            {stageFilter && <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${T.blue}15`, color: T.blue }}>Stage: {stageFilter}</span>}
            {activeCollection !== "all" && <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${T.purple}15`, color: T.purple }}>Collection: {collections.find(c => c.id === activeCollection)?.name}</span>}
          </div>
          <div className="flex items-center gap-2">
            {/* Collections Toggle */}
            <div className="relative">
              <button onClick={() => setCollectionsOpen(!collectionsOpen)} className="h-8 px-3 rounded-lg border text-[10px] font-bold text-slate-300 flex items-center gap-1.5 hover:bg-white/5" style={{ borderColor: T.border }}>
                <span className="material-symbols-outlined text-[14px]">folder</span>Collections
              </button>
              {collectionsOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 rounded-xl border p-2 z-50 space-y-1" style={{ backgroundColor: T.card, borderColor: T.border }}>
                  {collections.map(col => (
                    <button key={col.id} onClick={() => { setActiveCollection(col.id); setCollectionsOpen(false); setCurrentPage(1); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all"
                      style={{ backgroundColor: activeCollection === col.id ? `${T.purple}15` : "transparent", color: activeCollection === col.id ? T.purple : T.slate }}>
                      <span className="material-symbols-outlined text-[14px]">{col.icon}</span>{col.name}
                      <span className="ml-auto text-[9px] opacity-60">{col.id === "all" ? candidates.length : col.candidateIds.length}</span>
                    </button>
                  ))}
                  <div className="border-t pt-2 mt-1 flex gap-1" style={{ borderColor: T.border }}>
                    <input value={newCollName} onChange={e => setNewCollName(e.target.value)} className="flex-1 bg-transparent border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none" placeholder="New collection..." />
                    <button onClick={createCollection} className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ backgroundColor: T.purple, color: "white" }}>+</button>
                  </div>
                </div>
              )}
            </div>

            {/* Export */}
            <div className="relative">
              <button onClick={() => setExportOpen(!exportOpen)} className="h-8 px-3 rounded-lg border text-[10px] font-bold text-slate-300 flex items-center gap-1.5 hover:bg-white/5" style={{ borderColor: T.border }}>
                <span className="material-symbols-outlined text-[14px]">download</span>Export
              </button>
              {exportOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 rounded-xl border p-2 z-50 space-y-1" style={{ backgroundColor: T.card, borderColor: T.border }}>
                  {["CSV", "Excel", "PDF", "Shareable Link"].map(fmt => (
                    <button key={fmt} onClick={() => { triggerToast(`Exporting as ${fmt}...`); setExportOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-slate-300">{fmt}</button>
                  ))}
                  <div className="border-t pt-1 mt-1" style={{ borderColor: T.border }}>
                    <span className="text-[9px] text-slate-500 px-3">Scope: {selected.size > 0 ? `${selected.size} selected` : "All results"}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* Density Switch (Req #1) */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
              {(["compact", "comfortable", "detailed"] as Density[]).map(d => (
                <button key={d} onClick={() => setDensity(d)} className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all"
                  style={{ backgroundColor: density === d ? T.blue : "transparent", color: density === d ? "white" : T.slate }}>{d.slice(0, 4)}</button>
              ))}
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
              {([["table", "view_list"], ["grid", "grid_view"], ["list", "view_agenda"]] as [ViewMode, string][]).map(([m, icon]) => (
                <button key={m} onClick={() => setViewMode(m)} className="p-1.5 rounded-md transition-all"
                  style={{ backgroundColor: viewMode === m ? T.blue : "transparent" }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: viewMode === m ? "white" : T.slate }}>{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <div className="flex gap-5">
          {/* Main content */}
          <div className={`flex-1 min-w-0 ${previewId ? "max-w-[calc(100%-420px)]" : ""}`}>
            {/* ─── TABLE VIEW ─── */}
            {viewMode === "table" && (
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: T.card, borderColor: T.border }}>
                {/* Table Header */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b text-[9px] font-bold uppercase tracking-widest text-slate-500" style={{ borderColor: T.border }}>
                  <div className="w-6"><input type="checkbox" checked={selected.size === paginatedCandidates.length && paginatedCandidates.length > 0} onChange={selectAll} className="rounded" /></div>
                  <button onClick={() => toggleSort("name")} className="w-44 flex items-center gap-1 hover:text-white cursor-pointer">Candidate {sortCol === "name" && <span className="material-symbols-outlined text-[10px]">{sortDir === "asc" ? "arrow_upward" : "arrow_downward"}</span>}</button>
                  <button onClick={() => toggleSort("matchScore")} className="w-20 flex items-center gap-1 hover:text-white cursor-pointer">AI Match {sortCol === "matchScore" && <span className="material-symbols-outlined text-[10px]">{sortDir === "asc" ? "arrow_upward" : "arrow_downward"}</span>}</button>
                  <div className="w-24">Stage</div>
                  {density !== "compact" && <div className="flex-1">Skills / Tags</div>}
                  <div className="w-20">Availability</div>
                  {density === "detailed" && <div className="w-32">Recommendation</div>}
                  <div className="w-24">Activity</div>
                  <div className="w-8"></div>
                </div>

                {/* Table Rows */}
                {paginatedCandidates.map(c => {
                  const avail = AVAILABILITY_CONFIG[c.noticePeriod] || AVAILABILITY_CONFIG[c.availability] || { color: T.slate, bg: `${T.slate}15` };
                  const action = getRecommendedAction(c);
                  const activity = getActivityBadge(c.lastActivity);
                  const tags = candidateTags[c.id] || [];
                  return (
                    <div key={c.id} className={`border-b hover:bg-white/[0.02] transition-colors ${rowH}`} style={{ borderColor: T.border }}>
                      <div className="flex items-center gap-3 px-4" style={{ minHeight: density === "compact" ? 56 : density === "comfortable" ? 72 : 80 }}>
                        <div className="w-6"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" /></div>
                        {/* Candidate identity */}
                        <button onClick={() => { setPreviewId(c.id); setPreviewTab("profile"); }} className="w-44 flex items-center gap-2.5 text-left group">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                            <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">{c.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{c.currentRole}</p>
                          </div>
                        </button>
                        {/* AI Match with explanation (Req #11) */}
                        <div className="w-20">
                          <button onClick={() => setAiExplainId(aiExplainId === c.id ? null : c.id)} className="flex items-center gap-1 group">
                            <span className="text-xs font-bold" style={{ color: c.matchScore >= 90 ? T.green : c.matchScore >= 75 ? T.yellow : T.orange }}>{c.matchScore}%</span>
                            <span className="material-symbols-outlined text-[12px] text-slate-600 group-hover:text-white transition-colors">expand_more</span>
                          </button>
                        </div>
                        {/* Stage */}
                        <div className="w-24">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{
                            backgroundColor: c.stage === "Offer" ? `${T.green}15` : c.stage === "Rejected" ? `${T.red}15` : c.stage.includes("Interview") ? `${T.blue}15` : `${T.slate}15`,
                            color: c.stage === "Offer" ? T.green : c.stage === "Rejected" ? T.red : c.stage.includes("Interview") ? T.blue : T.slate,
                          }}>{c.stage}</span>
                        </div>
                        {/* Skills + Tags (Req #6) */}
                        {density !== "compact" && (
                          <div className="flex-1 flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{c.education?.split(",")[0]}</span>
                            {tags.map(t => (
                              <span key={t.label} className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer" style={{ backgroundColor: `${t.color}20`, color: t.color }}
                                onClick={() => removeTag(c.id, t.label)}>
                                {t.label} ×
                              </span>
                            ))}
                            <button onClick={() => setTagDropdownId(tagDropdownId === c.id ? null : c.id)} className="text-slate-600 hover:text-white">
                              <span className="material-symbols-outlined text-[12px]">sell</span>
                            </button>
                          </div>
                        )}
                        {/* Availability (Req #10) */}
                        <div className="w-20">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: avail.bg, color: avail.color }}>{c.noticePeriod}</span>
                        </div>
                        {/* Recommendation (Req #12) */}
                        {density === "detailed" && (
                          <div className="w-32">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]" style={{ color: action.color }}>{action.icon}</span>
                              <span className="text-[9px] font-semibold" style={{ color: action.color }}>{action.text}</span>
                            </div>
                          </div>
                        )}
                        {/* Activity (Req #9) */}
                        <div className="w-24">
                          <span className="text-[9px]" style={{ color: activity.color }}>{activity.text}</span>
                        </div>
                        {/* Actions */}
                        <div className="w-8 flex justify-end">
                          <button onClick={() => { setPreviewId(c.id); setPreviewTab("profile"); }} className="text-slate-600 hover:text-white">
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                          </button>
                        </div>
                      </div>

                      {/* AI Explanation Expandable (Req #11) */}
                      {aiExplainId === c.id && (
                        <div className="px-4 pb-3 pt-1 ml-10">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="material-symbols-outlined text-[12px]" style={{ color: T.blue }}>auto_awesome</span>
                            <span className="text-[9px] font-bold text-slate-400">AI Match Breakdown:</span>
                            {getAIExplanation(c).map((f, i) => (
                              <span key={i} className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: f.pass ? T.green : T.orange }}>
                                <span className="material-symbols-outlined text-[10px]">{f.pass ? "check_circle" : "warning"}</span>
                                {f.label} ({f.pct}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed density extras */}
                      {density === "detailed" && (
                        <div className="px-4 pb-3 ml-10 flex gap-4 text-[10px] text-slate-400">
                          <span>📍 {c.currentLocation}</span>
                          <span>💰 {c.expectedSalary}</span>
                          <span>🎓 {c.education}</span>
                          <span>📊 Assessment: {c.assessmentScore}/100</span>
                          <span>🤖 AI Interview: {c.aiInterviewScore}/100</span>
                        </div>
                      )}

                      {/* Tag Dropdown */}
                      {tagDropdownId === c.id && (
                        <div className="px-4 pb-3 ml-10 flex flex-wrap gap-1">
                          {TAG_PRESETS.filter(t => !tags.find(ct => ct.label === t.label)).map(t => (
                            <button key={t.label} onClick={() => addTag(c.id, t)} className="px-2 py-0.5 rounded text-[9px] font-bold border hover:opacity-80"
                              style={{ borderColor: `${t.color}40`, color: t.color, backgroundColor: `${t.color}10` }}>{t.label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: T.border }}>
                  <span className="text-[10px] text-slate-500">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCandidates.length)} of {filteredCandidates.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30" style={{ borderColor: T.border }}>
                      <span className="material-symbols-outlined text-sm text-slate-400">chevron_left</span>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setCurrentPage(p)} className="w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: currentPage === p ? T.blue : "transparent", color: currentPage === p ? "white" : T.slate }}>{p}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30" style={{ borderColor: T.border }}>
                      <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── GRID VIEW ─── */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedCandidates.map(c => {
                  const avail = AVAILABILITY_CONFIG[c.noticePeriod] || { color: T.slate, bg: `${T.slate}15` };
                  const action = getRecommendedAction(c);
                  return (
                    <div key={c.id} className="rounded-xl border overflow-hidden hover:-translate-y-0.5 transition-all cursor-pointer group"
                      style={{ backgroundColor: T.card, borderColor: selected.has(c.id) ? T.blue : T.border }}
                      onClick={() => { setPreviewId(c.id); setPreviewTab("profile"); }}>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                              <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{c.name}</p>
                              <p className="text-[10px] text-slate-500">{c.currentRole}</p>
                            </div>
                          </div>
                          <input type="checkbox" checked={selected.has(c.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(c.id); }} className="rounded" onClick={e => e.stopPropagation()} />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold" style={{ color: c.matchScore >= 90 ? T.green : T.yellow }}>{c.matchScore}%</span>
                          <span className="text-[9px] text-slate-500">AI Match</span>
                          <div className="ml-auto">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: avail.bg, color: avail.color }}>{c.noticePeriod}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {(candidateTags[c.id] || []).map(t => (
                            <span key={t.label} className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${t.color}20`, color: t.color }}>{t.label}</span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 text-[9px]" style={{ color: action.color }}>
                          <span className="material-symbols-outlined text-[12px]">{action.icon}</span>{action.text}
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t" style={{ borderColor: T.border }}>
                          <span>📍 {c.currentLocation?.split(",")[0]}</span>
                          <span>{c.experience}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── LIST VIEW ─── */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {paginatedCandidates.map(c => {
                  const avail = AVAILABILITY_CONFIG[c.noticePeriod] || { color: T.slate, bg: `${T.slate}15` };
                  const action = getRecommendedAction(c);
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border hover:bg-white/[0.02] transition-all cursor-pointer"
                      style={{ backgroundColor: T.card, borderColor: selected.has(c.id) ? T.blue : T.border }}
                      onClick={() => { setPreviewId(c.id); setPreviewTab("profile"); }}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(c.id); }} className="rounded" onClick={e => e.stopPropagation()} />
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{c.name}</span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] text-slate-400">{c.currentRole} @ {c.currentCompany}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold" style={{ color: c.matchScore >= 90 ? T.green : T.yellow }}>{c.matchScore}% Match</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: avail.bg, color: avail.color }}>{c.noticePeriod}</span>
                          <span className="text-[9px] text-slate-500">📍 {c.currentLocation}</span>
                          {(candidateTags[c.id] || []).slice(0, 2).map(t => (
                            <span key={t.label} className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${t.color}20`, color: t.color }}>{t.label}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] whitespace-nowrap" style={{ color: action.color }}>
                        <span className="material-symbols-outlined text-[12px]">{action.icon}</span>{action.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid/List Pagination */}
            {viewMode !== "table" && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border text-[10px] font-bold text-slate-400 disabled:opacity-30" style={{ borderColor: T.border }}>← Prev</button>
                <span className="text-[10px] text-slate-500">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border text-[10px] font-bold text-slate-400 disabled:opacity-30" style={{ borderColor: T.border }}>Next →</button>
              </div>
            )}
          </div>

          {/* ═══ QUICK PREVIEW PANEL (Req #8) ═══ */}
          {previewId && previewCandidate && (
            <div className="w-[400px] flex-shrink-0 rounded-xl border overflow-y-auto sticky top-20 space-y-4" style={{ backgroundColor: T.card, borderColor: T.border, maxHeight: "calc(100vh - 120px)" }}>
              {/* Header */}
              <div className="p-4 border-b flex items-start justify-between" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    <img src={previewCandidate.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{previewCandidate.name}</p>
                    <p className="text-[10px] text-slate-400">{previewCandidate.currentRole} @ {previewCandidate.currentCompany}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${T.green}15`, color: T.green }}>{previewCandidate.matchScore}% Match</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${T.blue}15`, color: T.blue }}>{previewCandidate.stage}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setPreviewId(null)} className="text-slate-500 hover:text-white">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="px-4 flex gap-1">
                {(["profile", "ai", "notes", "timeline"] as PanelTab[]).map(tab => (
                  <button key={tab} onClick={() => setPreviewTab(tab)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all"
                    style={{ backgroundColor: previewTab === tab ? `${T.blue}15` : "transparent", color: previewTab === tab ? T.blue : T.slate }}>{tab}</button>
                ))}
              </div>

              {/* Profile Tab */}
              {previewTab === "profile" && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Experience", previewCandidate.experience],
                      ["Salary", previewCandidate.expectedSalary],
                      ["Location", previewCandidate.currentLocation],
                      ["Notice", previewCandidate.noticePeriod],
                      ["Education", previewCandidate.education],
                      ["Source", previewCandidate.source],
                    ].map(([label, val]) => (
                      <div key={label as string} className="p-2 rounded-lg" style={{ backgroundColor: T.cardAlt }}>
                        <p className="text-[9px] text-slate-500 uppercase">{label}</p>
                        <p className="text-[11px] font-bold text-white truncate">{val as string}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-1.5">Assessment Scores</p>
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: T.cardAlt }}>
                        <p className="text-sm font-extrabold" style={{ color: T.green }}>{previewCandidate.assessmentScore}</p>
                        <p className="text-[8px] text-slate-500">Technical</p>
                      </div>
                      <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: T.cardAlt }}>
                        <p className="text-sm font-extrabold" style={{ color: T.blue }}>{previewCandidate.aiInterviewScore}</p>
                        <p className="text-[8px] text-slate-500">AI Interview</p>
                      </div>
                    </div>
                  </div>

                  {previewCandidate.hasVideoResume && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ borderColor: `${T.purple}30`, backgroundColor: `${T.purple}08` }}>
                      <span className="material-symbols-outlined text-[16px]" style={{ color: T.purple }}>videocam</span>
                      <span className="text-[10px] font-bold" style={{ color: T.purple }}>Video Resume Available</span>
                    </div>
                  )}

                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-1.5">Recruiter Notes</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{previewCandidate.recruiterNotes}</p>
                  </div>
                </div>
              )}

              {/* AI Tab */}
              {previewTab === "ai" && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-2">AI Match Breakdown</p>
                    {getAIExplanation(previewCandidate).map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: T.border }}>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[12px]" style={{ color: f.pass ? T.green : T.orange }}>{f.pass ? "check_circle" : "warning"}</span>
                          <span className="text-[10px] text-slate-300">{f.label}</span>
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: f.pass ? T.green : T.orange }}>{f.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${getRecommendedAction(previewCandidate).color}10` }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: getRecommendedAction(previewCandidate).color }}>{getRecommendedAction(previewCandidate).icon}</span>
                      <span className="text-[10px] font-bold" style={{ color: getRecommendedAction(previewCandidate).color }}>Recommended Action</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{getRecommendedAction(previewCandidate).text}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Recommendation</p>
                    <p className="text-[11px] font-bold text-white">{previewCandidate.recommendation}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{previewCandidate.recommendationReason}</p>
                  </div>
                </div>
              )}

              {/* Notes Tab (Req #5) */}
              {previewTab === "notes" && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex gap-2">
                    <input value={noteInputId === previewId ? newNoteTxt : ""} onChange={e => { setNoteInputId(previewId); setNewNoteTxt(e.target.value); }}
                      onFocus={() => setNoteInputId(previewId)} className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none" placeholder="Add a private note..." />
                    <button onClick={() => addNote(previewId!)} className="px-3 py-2 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: T.blue }}>Add</button>
                  </div>
                  {(candidateNotes[previewId!] || []).map((n, i) => (
                    <div key={i} className="p-2.5 rounded-lg" style={{ backgroundColor: T.cardAlt }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-300">{n.by}</span>
                        <span className="text-[9px] text-slate-500">{n.at}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{n.text}</p>
                    </div>
                  ))}
                  {(candidateNotes[previewId!] || []).length === 0 && (
                    <p className="text-center text-[10px] text-slate-500 py-4">No notes yet. Add the first one above.</p>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {previewTab === "timeline" && (
                <div className="px-4 pb-4 space-y-2">
                  {[
                    { text: `Applied for ${previewCandidate.appliedJob}`, time: previewCandidate.applicationDate, icon: "send", color: T.blue },
                    { text: "AI screening completed", time: "2 days later", icon: "smart_toy", color: T.purple },
                    { text: `Stage: ${previewCandidate.stage}`, time: previewCandidate.lastActivity, icon: "flag", color: T.green },
                  ].map((e, i) => (
                    <div key={i} className="flex gap-3 items-start py-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${e.color}15` }}>
                        <span className="material-symbols-outlined text-[12px]" style={{ color: e.color }}>{e.icon}</span>
                      </div>
                      <div>
                        <p className="text-[11px] text-white">{e.text}</p>
                        <p className="text-[9px] text-slate-500">{e.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview Actions */}
              <div className="p-4 border-t flex flex-wrap gap-2" style={{ borderColor: T.border }}>
                <button onClick={() => { triggerToast(`Shortlisted ${previewCandidate.name}`); }} className="flex-1 py-2 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1" style={{ backgroundColor: T.green }}>
                  <span className="material-symbols-outlined text-[14px]">star</span>Shortlist
                </button>
                <button onClick={() => router.push("/employer/interview-scheduler")} className="flex-1 py-2 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1" style={{ backgroundColor: T.blue }}>
                  <span className="material-symbols-outlined text-[14px]">event</span>Schedule
                </button>
                <button onClick={() => triggerToast("Message sent")} className="py-2 px-3 rounded-lg border text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1" style={{ borderColor: T.border }}>
                  <span className="material-symbols-outlined text-[14px]">chat</span>
                </button>
                <button onClick={() => triggerToast("Downloading resume...")} className="py-2 px-3 rounded-lg border text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1" style={{ borderColor: T.border }}>
                  <span className="material-symbols-outlined text-[14px]">download</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ BULK ACTION TOOLBAR (Req #7) ═══ */}
        {selected.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-6 py-3 border-t flex items-center justify-between" style={{ backgroundColor: "#1a1a1f", borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold" style={{ color: T.blue }}>{selected.size} selected</span>
              <div className="h-4 w-px bg-white/10" />
              {[
                { label: "Shortlist", icon: "star", color: T.green },
                { label: "Schedule", icon: "event", color: T.blue },
                { label: "Reject", icon: "close", color: T.red },
                { label: "Email", icon: "mail", color: T.sky },
                { label: "Compare", icon: "compare_arrows", color: T.purple, action: () => setCompareOpen(true), disabled: selected.size < 2 },
                { label: "Tags", icon: "sell", color: T.yellow },
                { label: "Export", icon: "download", color: T.slate },
              ].map(a => (
                <button key={a.label} onClick={() => { a.action ? a.action() : triggerToast(`${a.label}: ${selected.size} candidates`); }}
                  disabled={a.disabled} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-white/5 disabled:opacity-30 transition-all"
                  style={{ color: a.color }}>
                  <span className="material-symbols-outlined text-[14px]">{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
            <button onClick={() => setSelected(new Set())} className="text-[10px] text-slate-500 hover:text-white font-bold">Clear Selection</button>
          </div>
        )}

        {/* ═══ COMPARE MODAL (Req #13) ═══ */}
        {compareOpen && selectedCandidates.length >= 2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
            <div className="w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl border p-6 space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white">Compare Candidates ({selectedCandidates.length})</h2>
                <button onClick={() => setCompareOpen(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b" style={{ borderColor: T.border }}>
                      <th className="py-2 pr-4 text-[10px] font-bold uppercase text-slate-500 w-32">Attribute</th>
                      {selectedCandidates.slice(0, 5).map(c => (
                        <th key={c.id} className="py-2 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10"><img src={c.avatar} alt="" className="w-full h-full object-cover" /></div>
                            <span className="text-[11px] font-bold text-white">{c.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "AI Match", key: "matchScore", fmt: (v: any) => `${v}%` },
                      { label: "Role", key: "currentRole" },
                      { label: "Experience", key: "experience" },
                      { label: "Location", key: "currentLocation" },
                      { label: "Salary", key: "expectedSalary" },
                      { label: "Notice", key: "noticePeriod" },
                      { label: "Education", key: "education" },
                      { label: "Assessment", key: "assessmentScore", fmt: (v: any) => `${v}/100` },
                      { label: "AI Interview", key: "aiInterviewScore", fmt: (v: any) => `${v}/100` },
                      { label: "Recommendation", key: "recommendation" },
                      { label: "Stage", key: "stage" },
                    ].map(attr => {
                      const vals = selectedCandidates.slice(0, 5).map(c => (c as any)[attr.key]);
                      const numVals = vals.map(Number).filter(n => !isNaN(n));
                      const best = numVals.length > 0 ? Math.max(...numVals) : null;
                      return (
                        <tr key={attr.label} className="border-b" style={{ borderColor: T.border }}>
                          <td className="py-2.5 pr-4 text-[10px] font-bold text-slate-400 uppercase">{attr.label}</td>
                          {selectedCandidates.slice(0, 5).map(c => {
                            const val = (c as any)[attr.key];
                            const isBest = best !== null && Number(val) === best;
                            return (
                              <td key={c.id} className="py-2.5 px-3 text-center text-[11px]" style={{ color: isBest ? T.green : "white" }}>
                                <span className={isBest ? "font-bold" : ""}>{attr.fmt ? attr.fmt(val) : val}</span>
                                {isBest && <span className="ml-1 text-[8px]">★</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 justify-end">
                {selectedCandidates.slice(0, 5).map(c => (
                  <button key={c.id} onClick={() => router.push("/employer/interview-scheduler")} className="px-4 py-2 rounded-xl text-[10px] font-bold text-white" style={{ backgroundColor: T.blue }}>
                    Schedule {c.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ KEYBOARD SHORTCUTS MODAL (Req #17) ═══ */}
        {shortcutsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
            <div className="w-full max-w-sm rounded-2xl border p-6 space-y-3" style={{ backgroundColor: T.card, borderColor: T.border }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-white">Keyboard Shortcuts</h3>
                <button onClick={() => setShortcutsOpen(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
              </div>
              {[
                ["S", "Focus Search"],
                ["F", "Focus Filters"],
                ["C", "Compare Selected (2+)"],
                ["I", "Invite Selected"],
                ["A", "Select All Visible"],
                ["Esc", "Close Panel / Modal"],
                ["?", "Show Shortcuts"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1.5">
                  <span className="text-[11px] text-slate-300">{desc}</span>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border" style={{ borderColor: T.border }}>{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TOAST ═══ */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2" style={{ backgroundColor: "#1E293B", border: `1px solid ${T.border}` }}>
            <span className="material-symbols-outlined text-sm" style={{ color: T.green }}>check_circle</span>
            <span className="text-xs font-bold text-white">{toast}</span>
          </div>
        )}
      </main>
    </>
  );
}
