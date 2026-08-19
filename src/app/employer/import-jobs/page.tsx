"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import EmployerHeader from "@/components/employer/EmployerHeader";
import { useEmployer } from "@/context/EmployerContext";

// ─── Theme Tokens (matching dashboard) ───
const T = {
  pageBg: "#0A0A0C",
  card: "#121215",
  cardAlt: "#16161B",
  border: "rgba(255, 255, 255, 0.06)",
  red: "#FF5252",
  green: "#26A69A",
  blue: "#29B6F6",
  yellow: "#FFCA28",
  purple: "#AB47BC",
  slateSecondary: "#94A3B8",
};

type ImportMethod = "csv" | "ats" | "manual";
type ImportStep = "choose" | "upload" | "mapping" | "preview" | "complete";

interface ParsedJob {
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  status: "valid" | "warning" | "error";
  issues: string[];
}

const ATS_CONNECTORS = [
  { id: "greenhouse", name: "Greenhouse", icon: "eco", color: "#28A745", status: "available" },
  { id: "lever", name: "Lever", icon: "pivot_table_chart", color: "#4A90D9", status: "available" },
  { id: "workday", name: "Workday", icon: "work", color: "#FF6B35", status: "coming_soon" },
  { id: "bamboo", name: "BambooHR", icon: "forest", color: "#73B41A", status: "coming_soon" },
  { id: "icims", name: "iCIMS", icon: "cloud_sync", color: "#00BCD4", status: "coming_soon" },
  { id: "taleo", name: "Oracle Taleo", icon: "database", color: "#F80000", status: "coming_soon" },
];

// Simulated CSV parse results
const MOCK_PARSED_JOBS: ParsedJob[] = [
  { title: "Senior Frontend Engineer", department: "Engineering", location: "San Francisco, CA", type: "Full-time", salary: "$150,000 - $190,000", status: "valid", issues: [] },
  { title: "Product Manager", department: "Product", location: "Remote", type: "Full-time", salary: "$130,000 - $160,000", status: "valid", issues: [] },
  { title: "UX Designer", department: "Design", location: "New York, NY", type: "Full-time", salary: "$110,000 - $140,000", status: "warning", issues: ["Job description below 150 words — may reduce candidate quality"] },
  { title: "DevOps Engineer", department: "Engineering", location: "Austin, TX", type: "Contract", salary: "$80/hr", status: "valid", issues: [] },
  { title: "Marketing Lead", department: "", location: "Chicago, IL", type: "Full-time", salary: "$100,000 - $130,000", status: "error", issues: ["Missing department field", "No required skills specified"] },
  { title: "Data Scientist", department: "AI/ML", location: "Remote", type: "Full-time", salary: "$160,000 - $200,000", status: "valid", issues: [] },
];

const COLUMN_MAPPINGS = [
  { csvHeader: "Job Title", mappedTo: "title", confidence: 99 },
  { csvHeader: "Department / Team", mappedTo: "department", confidence: 94 },
  { csvHeader: "Work Location", mappedTo: "location", confidence: 97 },
  { csvHeader: "Employment Type", mappedTo: "type", confidence: 92 },
  { csvHeader: "Salary Range", mappedTo: "salary", confidence: 88 },
  { csvHeader: "Job Description", mappedTo: "description", confidence: 96 },
  { csvHeader: "Required Skills", mappedTo: "skills", confidence: 91 },
  { csvHeader: "Experience Level", mappedTo: "experience", confidence: 95 },
];

export default function ImportJobsPage() {
  const router = useRouter();
  const { addJob } = useEmployer();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<ImportMethod | null>(null);
  const [step, setStep] = useState<ImportStep>("choose");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set([0, 1, 2, 3, 5]));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importComplete, setImportComplete] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  function simulateUpload(filename: string) {
    setUploadedFile(filename);
    setIsProcessing(true);
    setAiProgress(0);

    const interval = setInterval(() => {
      setAiProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setStep("mapping");
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 300);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) simulateUpload(file.name);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file.name);
  };

  const toggleJobSelection = (idx: number) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setImportComplete(true);
      setStep("complete");
      triggerToast(`${selectedJobs.size} jobs imported as drafts successfully!`);
    }, 2000);
  };

  const validCount = MOCK_PARSED_JOBS.filter(j => j.status === "valid").length;
  const warningCount = MOCK_PARSED_JOBS.filter(j => j.status === "warning").length;
  const errorCount = MOCK_PARSED_JOBS.filter(j => j.status === "error").length;

  return (
    <>
      <EmployerHeader />
      <main
        className="min-h-screen px-4 sm:px-6 lg:px-10 py-8 space-y-8"
        style={{ backgroundColor: T.pageBg, fontFamily: "var(--font-body), system-ui, sans-serif" }}
      >
        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <button
              onClick={() => {
                if (step === "choose") router.push("/employer/dashboard");
                else if (step === "upload") { setStep("choose"); setMethod(null); setUploadedFile(null); }
                else if (step === "mapping") setStep("upload");
                else if (step === "preview") setStep("mapping");
                else router.push("/employer/dashboard");
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs mb-3 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              {step === "choose" ? "Back to Dashboard" : "Back"}
            </button>
            <h1 className="text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              <span className="material-symbols-outlined text-[28px] mr-2 align-middle" style={{ color: T.green }}>cloud_upload</span>
              Import Jobs
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {step === "choose" && "Choose your import method to bring jobs into HireGo AI."}
              {step === "upload" && "Upload your file and let AI validate & map your data."}
              {step === "mapping" && "Review AI-detected column mappings before proceeding."}
              {step === "preview" && "Review parsed jobs, fix issues, and confirm import."}
              {step === "complete" && "Import complete! Jobs are now available as drafts."}
            </p>
          </div>

          {/* Step indicator */}
          {method === "csv" && step !== "choose" && (
            <div className="flex items-center gap-2">
              {["Upload", "Mapping", "Preview", "Complete"].map((label, i) => {
                const stepOrder: ImportStep[] = ["upload", "mapping", "preview", "complete"];
                const currentIdx = stepOrder.indexOf(step);
                const isActive = i === currentIdx;
                const isDone = i < currentIdx;
                return (
                  <React.Fragment key={label}>
                    {i > 0 && (
                      <div className="w-8 h-px" style={{ backgroundColor: isDone ? T.green : T.border }} />
                    )}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          backgroundColor: isDone ? T.green : isActive ? T.blue : T.cardAlt,
                          color: isDone || isActive ? "white" : "#64748B",
                          border: `1px solid ${isDone ? T.green : isActive ? T.blue : T.border}`,
                        }}
                      >
                        {isDone ? "✓" : i + 1}
                      </div>
                      <span className={`text-[10px] font-bold ${isActive ? "text-white" : isDone ? "text-slate-300" : "text-slate-500"}`}>
                        {label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── STEP: CHOOSE METHOD ─── */}
        {step === "choose" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CSV/Excel Upload */}
            <button
              onClick={() => { setMethod("csv"); setStep("upload"); }}
              className="group p-6 rounded-2xl border text-left hover:-translate-y-1 transition-all"
              style={{ backgroundColor: T.card, borderColor: method === "csv" ? T.green : T.border }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${T.green}15` }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: T.green }}>description</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2">CSV / Excel Upload</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Upload a spreadsheet with your job listings. AI will auto-detect columns, validate data, and flag issues before import.
              </p>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">.csv</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">.xlsx</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">.xls</span>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold group-hover:text-white transition-colors" style={{ color: T.green }}>
                <span>Get started</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </button>

            {/* ATS Sync */}
            <button
              onClick={() => { setMethod("ats"); setStep("upload"); }}
              className="group p-6 rounded-2xl border text-left hover:-translate-y-1 transition-all"
              style={{ backgroundColor: T.card, borderColor: method === "ats" ? T.blue : T.border }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${T.blue}15` }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: T.blue }}>sync</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2">ATS Sync</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Connect your existing ATS (Greenhouse, Lever, Workday) and sync job listings automatically. One-click integration.
              </p>
              <div className="flex items-center gap-1.5">
                {ATS_CONNECTORS.slice(0, 4).map(c => (
                  <div key={c.id} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}20` }}>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: c.color }}>{c.icon}</span>
                  </div>
                ))}
                <span className="text-[10px] text-slate-500 font-bold ml-1">+2 more</span>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold group-hover:text-white transition-colors" style={{ color: T.blue }}>
                <span>Connect ATS</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </button>

            {/* Manual Bulk Entry */}
            <button
              onClick={() => { setMethod("manual"); triggerToast("Opening bulk entry editor..."); router.push("/employer/create-job-basic-info"); }}
              className="group p-6 rounded-2xl border text-left hover:-translate-y-1 transition-all"
              style={{ backgroundColor: T.card, borderColor: method === "manual" ? T.purple : T.border }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${T.purple}15` }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: T.purple }}>edit_note</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2">Manual Entry</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Create jobs one-by-one using the AI-assisted job creation wizard. Best for small batches or custom positions.
              </p>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">AI JD Writer</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">Templates</span>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold group-hover:text-white transition-colors" style={{ color: T.purple }}>
                <span>Create job</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </button>
          </div>
        )}

        {/* ─── STEP: CSV UPLOAD ─── */}
        {step === "upload" && method === "csv" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              style={{
                borderColor: isDragging ? T.green : uploadedFile ? T.green : "rgba(255,255,255,0.1)",
                backgroundColor: isDragging ? `${T.green}08` : uploadedFile ? `${T.green}05` : T.card,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!uploadedFile && !isProcessing && (
                <>
                  <span className="material-symbols-outlined text-[48px] mb-4" style={{ color: isDragging ? T.green : "#64748B" }}>
                    {isDragging ? "file_download" : "cloud_upload"}
                  </span>
                  <p className="font-bold text-white text-sm mb-1">
                    {isDragging ? "Drop your file here" : "Drag & drop your file here"}
                  </p>
                  <p className="text-slate-400 text-xs mb-4">or click to browse • CSV, XLSX, XLS up to 10MB</p>
                  <div className="px-4 py-2 rounded-xl text-[10px] font-bold" style={{ backgroundColor: `${T.green}15`, color: T.green }}>
                    Browse Files
                  </div>
                </>
              )}

              {uploadedFile && isProcessing && (
                <>
                  <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: T.green, borderTopColor: "transparent" }} />
                  <p className="font-bold text-white text-sm mb-1">{uploadedFile}</p>
                  <p className="text-slate-400 text-xs mb-3">AI is analyzing your file...</p>
                  <div className="w-full max-w-xs h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(aiProgress, 100)}%`, backgroundColor: T.green }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold">{Math.min(Math.round(aiProgress), 100)}% — Detecting columns & validating data</p>
                </>
              )}

              {uploadedFile && !isProcessing && step === "upload" && (
                <>
                  <span className="material-symbols-outlined text-[48px] mb-4" style={{ color: T.green }}>check_circle</span>
                  <p className="font-bold text-white text-sm">{uploadedFile}</p>
                  <p className="text-xs mt-1" style={{ color: T.green }}>File processed successfully</p>
                </>
              )}
            </div>

            {/* AI Analysis Summary (shown after upload) */}
            {uploadedFile && !isProcessing && (
              <div className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: T.card, borderColor: T.border }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" style={{ color: T.blue }}>auto_awesome</span>
                  <span className="text-xs font-bold text-white">AI Analysis Complete</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: `${T.green}10` }}>
                    <p className="text-lg font-extrabold" style={{ color: T.green }}>{MOCK_PARSED_JOBS.length}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Jobs Detected</p>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: `${T.green}10` }}>
                    <p className="text-lg font-extrabold" style={{ color: T.green }}>8</p>
                    <p className="text-[10px] text-slate-400 font-bold">Columns Mapped</p>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: errorCount > 0 ? `${T.red}10` : `${T.green}10` }}>
                    <p className="text-lg font-extrabold" style={{ color: errorCount > 0 ? T.red : T.green }}>{errorCount}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Issues Found</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep("mapping")}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: T.green }}
                >
                  Review Column Mapping →
                </button>
              </div>
            )}

            {/* Download Template */}
            <div className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: T.cardAlt, borderColor: T.border }}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">download</span>
                <div>
                  <p className="text-xs font-bold text-white">Download Template</p>
                  <p className="text-[10px] text-slate-400">Use our pre-formatted CSV template for best results</p>
                </div>
              </div>
              <button
                onClick={() => triggerToast("Template downloaded — jobs_import_template.csv")}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-white border hover:bg-slate-800 transition-colors"
                style={{ borderColor: T.border }}
              >
                Download .csv
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: ATS CONNECTORS ─── */}
        {step === "upload" && method === "ats" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ATS_CONNECTORS.map(connector => (
                <div
                  key={connector.id}
                  className="p-5 rounded-2xl border flex flex-col gap-3 relative overflow-hidden"
                  style={{ backgroundColor: T.card, borderColor: T.border }}
                >
                  {connector.status === "coming_soon" && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-slate-800 text-slate-400">
                      Coming Soon
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${connector.color}15` }}>
                    <span className="material-symbols-outlined text-[22px]" style={{ color: connector.color }}>{connector.icon}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{connector.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {connector.status === "available"
                      ? "One-click sync. Connect your account and import all active job listings instantly."
                      : "Integration coming soon. Request early access to get notified."}
                  </p>
                  <button
                    onClick={() => {
                      if (connector.status === "available") {
                        triggerToast(`Connecting to ${connector.name}... Redirecting to OAuth`);
                      } else {
                        triggerToast(`Early access requested for ${connector.name}`);
                      }
                    }}
                    className="mt-auto py-2 rounded-xl text-[10px] font-bold transition-all"
                    style={{
                      backgroundColor: connector.status === "available" ? `${connector.color}20` : T.cardAlt,
                      color: connector.status === "available" ? connector.color : "#64748B",
                      border: `1px solid ${connector.status === "available" ? `${connector.color}30` : T.border}`,
                    }}
                  >
                    {connector.status === "available" ? "Connect Account" : "Request Access"}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border flex items-center gap-3" style={{ backgroundColor: T.cardAlt, borderColor: T.border }}>
              <span className="material-symbols-outlined text-sm" style={{ color: T.blue }}>info</span>
              <p className="text-[10px] text-slate-400">
                ATS connections use OAuth 2.0 for secure authentication. HireGo AI will only read job listing data — no write access to your ATS.
              </p>
            </div>
          </div>
        )}

        {/* ─── STEP: COLUMN MAPPING ─── */}
        {step === "mapping" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-5 rounded-2xl border space-y-1" style={{ backgroundColor: T.card, borderColor: T.border }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" style={{ color: T.blue }}>auto_awesome</span>
                  <span className="text-xs font-bold text-white">AI Column Mapping</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${T.green}15`, color: T.green }}>
                  8/8 Columns Auto-Mapped
                </span>
              </div>

              <div className="space-y-2">
                {COLUMN_MAPPINGS.map((col, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: T.cardAlt }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-bold text-white w-40 truncate">{col.csvHeader}</span>
                      <span className="material-symbols-outlined text-sm text-slate-500">arrow_forward</span>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]" style={{ color: T.green }}>check_circle</span>
                        <span className="text-xs text-slate-300 font-semibold">{col.mappedTo}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${col.confidence}%`,
                            backgroundColor: col.confidence > 90 ? T.green : T.yellow,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{col.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 py-3 rounded-xl font-bold text-sm border hover:bg-slate-800 transition-colors text-white"
                style={{ borderColor: T.border }}
              >
                ← Re-upload
              </button>
              <button
                onClick={() => setStep("preview")}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: T.green }}
              >
                Confirm Mapping → Preview Jobs
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: PREVIEW ─── */}
        {step === "preview" && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold" style={{ backgroundColor: `${T.green}15`, color: T.green }}>
                <span className="material-symbols-outlined text-sm">check_circle</span> {validCount} Valid
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold" style={{ backgroundColor: `${T.yellow}15`, color: T.yellow }}>
                <span className="material-symbols-outlined text-sm">warning</span> {warningCount} Warnings
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold" style={{ backgroundColor: `${T.red}15`, color: T.red }}>
                <span className="material-symbols-outlined text-sm">error</span> {errorCount} Errors
              </div>
              <div className="ml-auto text-[10px] text-slate-400 font-bold">
                {selectedJobs.size} of {MOCK_PARSED_JOBS.length} selected for import
              </div>
            </div>

            {/* Jobs table */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: T.card, borderColor: T.border }}>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: T.border }}>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedJobs.size === MOCK_PARSED_JOBS.length}
                        onChange={() => {
                          if (selectedJobs.size === MOCK_PARSED_JOBS.length) setSelectedJobs(new Set());
                          else setSelectedJobs(new Set(MOCK_PARSED_JOBS.map((_, i) => i)));
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Job Title</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Salary</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PARSED_JOBS.map((job, i) => (
                    <tr
                      key={i}
                      className="border-b hover:bg-white/[0.02] transition-colors"
                      style={{
                        borderColor: T.border,
                        opacity: job.status === "error" ? 0.6 : 1,
                      }}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedJobs.has(i)}
                          onChange={() => toggleJobSelection(i)}
                          className="rounded"
                          disabled={job.status === "error"}
                        />
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-bold text-white">{job.title}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs ${job.department ? "text-slate-300" : "text-red-400 italic"}`}>
                          {job.department || "Missing"}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-300">{job.location}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">{job.type}</span>
                      </td>
                      <td className="p-3 text-xs text-slate-300">{job.salary}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{
                              color: job.status === "valid" ? T.green : job.status === "warning" ? T.yellow : T.red,
                            }}
                          >
                            {job.status === "valid" ? "check_circle" : job.status === "warning" ? "warning" : "error"}
                          </span>
                          <span className="text-[10px] font-bold capitalize" style={{
                            color: job.status === "valid" ? T.green : job.status === "warning" ? T.yellow : T.red,
                          }}>
                            {job.status}
                          </span>
                        </div>
                        {job.issues.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {job.issues.map((issue, j) => (
                              <p key={j} className="text-[9px] text-slate-500">{issue}</p>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setStep("mapping")}
                className="flex-1 py-3 rounded-xl font-bold text-sm border hover:bg-slate-800 transition-colors text-white"
                style={{ borderColor: T.border }}
              >
                ← Back to Mapping
              </button>
              <button
                onClick={handleImport}
                disabled={selectedJobs.size === 0 || isProcessing}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: T.green }}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import {selectedJobs.size} Jobs as Drafts
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: COMPLETE ─── */}
        {step === "complete" && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${T.green}15` }}>
              <span className="material-symbols-outlined text-[40px]" style={{ color: T.green }}>task_alt</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>Import Successful!</h2>
              <p className="text-sm text-slate-400">
                {selectedJobs.size} jobs have been imported as <strong className="text-white">Draft</strong> status. Review and publish them from the Job Listings Management page.
              </p>
            </div>

            <div className="p-4 rounded-xl border" style={{ backgroundColor: T.card, borderColor: T.border }}>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-extrabold" style={{ color: T.green }}>{selectedJobs.size}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Imported</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold" style={{ color: T.yellow }}>{warningCount}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Need Review</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold" style={{ color: T.red }}>{errorCount}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Skipped</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/employer/job-listings-management")}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: T.green }}
              >
                Go to Job Listings →
              </button>
              <button
                onClick={() => { setStep("choose"); setMethod(null); setUploadedFile(null); setSelectedJobs(new Set([0, 1, 2, 3, 5])); setImportComplete(false); }}
                className="w-full py-3 rounded-xl font-bold text-sm border hover:bg-slate-800 transition-colors text-white"
                style={{ borderColor: T.border }}
              >
                Import More Jobs
              </button>
              <button
                onClick={() => router.push("/employer/dashboard")}
                className="text-xs text-slate-400 hover:text-white transition-colors font-bold"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ─── TOAST ─── */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-up" style={{ backgroundColor: "#1E293B", border: `1px solid ${T.border}` }}>
            <span className="material-symbols-outlined text-sm" style={{ color: T.green }}>check_circle</span>
            <span className="text-xs font-bold text-white">{toastMessage}</span>
          </div>
        )}
      </main>
    </>
  );
}
