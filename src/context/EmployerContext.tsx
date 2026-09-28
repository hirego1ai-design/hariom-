"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchEmployerCandidates, pipelineStageLabels, pipelineStageStatus } from "@/lib/employerCandidates";
// Remove mock imports

type Job = any;
type Candidate = any;
type DashboardStats = any;
type Interview = any;
type User = any;

type DraftJob = Partial<Job> & {
  description?: string;
  requirements?: string[];
  skills?: string[];
};

interface EmployerContextType {
  user: User;
  jobs: Job[];
  candidates: Candidate[];
  dashboardStats: DashboardStats;
  interviews: Interview[];
  draftJob: DraftJob;
  addJob: (job: Job) => void;
  updateDraftJob: (data: Partial<DraftJob>) => void;
  updateCandidateStage: (applicationId: string, newStage: string) => Promise<boolean>;
  removeJob: (jobId: string) => void;
  isLoading: boolean;
  loadError: string;
  actionError: string;
  clearActionError: () => void;
}

const EmployerContext = createContext<EmployerContextType | undefined>(undefined);

export function EmployerProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({});
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [user] = useState<User>({ name: "", role: "" });
  const [draftJob, setDraftJob] = useState<DraftJob>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [isCandidatesLoading, setIsCandidatesLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const appendLoadError = (message: string) => {
    setLoadError((current) => current ? `${current} ${message}` : message);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/employer/dashboard", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success || !data.metrics) {
          throw new Error(data.error || "Employer dashboard metrics could not be loaded.");
        }
        setDashboardStats({
          activeJobs: data.metrics.activeJobsCount,
          totalApplications: data.metrics.totalApplicantsCount,
          interviews: data.metrics.upcomingInterviewsCount,
          credits: data.metrics.credits ?? null,
          companyCredits: data.metrics.credits ?? null,
        });
      } catch (err) {
        appendLoadError(err instanceof Error ? err.message : "Employer dashboard metrics could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Load the authenticated company's real jobs for job-scoped workflows such as proactive sourcing.
  useEffect(() => {
    let cancelled = false;
    async function fetchJobs() {
      setIsJobsLoading(true);
      try {
        const res = await fetch("/api/employer/jobs", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load jobs");
        if (!cancelled) setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (err) {
        if (!cancelled) appendLoadError(err instanceof Error ? err.message : "Employer jobs could not be loaded.");
      } finally {
        if (!cancelled) setIsJobsLoading(false);
      }
    }
    fetchJobs();
    return () => { cancelled = true; };
  }, []);

  // Fetch candidates on mount
  useEffect(() => {
    async function fetchCandidates() {
      try {
        const data = await fetchEmployerCandidates<Candidate>();
        setCandidates(data.map(candidate => ({ ...candidate, stage: pipelineStageLabels[candidate.stage] || candidate.stage })));
      } catch (err) {
        appendLoadError(err instanceof Error ? err.message : "Employer candidates could not be loaded.");
      } finally {
        setIsCandidatesLoading(false);
      }
    }
    fetchCandidates();
  }, []);

  const updateDraftJob = (data: Partial<DraftJob>) => {
    setDraftJob(prev => ({ ...prev, ...data }));
  };

  const addJob = (job: Job) => {
    setJobs([job, ...jobs]);
    setDashboardStats((prev: any) => ({
      ...prev,
      activeJobs: prev.activeJobs + 1
    }));
  };

  const removeJob = (jobId: string) => {
    setJobs(jobs.filter(j => j.id !== jobId));
    setDashboardStats((prev: any) => ({
      ...prev,
      activeJobs: Math.max(0, prev.activeJobs - 1)
    }));
  };

  const updateCandidateStage = async (applicationId: string, newStage: string): Promise<boolean> => {
    setActionError("");
    const candidate = candidates.find(c => c.applicationId === applicationId);
    if (!candidate?.applicationId) return false;

    try {
      const dbStage = pipelineStageStatus(newStage);
      const res = await fetch(`/api/employer/candidates/${candidate.applicationId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: dbStage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stage");

      setCandidates(prev => prev.map(c => c.applicationId === applicationId ? { ...c, stage: pipelineStageLabels[data.stage] || newStage } : c));
      return true;
    } catch (err: any) {
      setActionError(err?.message || "Failed to update candidate stage.");
      return false;
    }
  };

  return (
    <EmployerContext.Provider value={{
      user,
      jobs,
      candidates,
      dashboardStats,
      interviews,
      draftJob,
      addJob,
      updateDraftJob,
      updateCandidateStage,
      removeJob,
      isLoading: isLoading || isJobsLoading || isCandidatesLoading,
      loadError,
      actionError,
      clearActionError: () => setActionError("")
    }}>
      {children}
    </EmployerContext.Provider>
  );
}

export function useEmployer() {
  const context = useContext(EmployerContext);
  if (context === undefined) {
    throw new Error("useEmployer must be used within an EmployerProvider");
  }
  return context;
}
