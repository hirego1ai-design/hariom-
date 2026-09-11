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
}

const EmployerContext = createContext<EmployerContextType | undefined>(undefined);

export function EmployerProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({});
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [user, setUser] = useState<User>({ name: "Employer", role: "Admin" });
  const [draftJob, setDraftJob] = useState<DraftJob>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCandidatesLoading, setIsCandidatesLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/employer/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) {
            setDashboardStats({
              activeJobs: data.metrics.activeJobsCount || 0,
              activeJobsGrowth: "+0",
              totalApplications: data.metrics.totalApplicantsCount || 0,
              totalApplicationsGrowth: "+0",
              shortlisted: 0,
              hired: 0,
              hiredPeriod: "This month",
              funnel: {
                sourcing: data.metrics.totalApplicantsCount || 0,
                screening: 0,
                interview: 0,
                offer: 0,
              },
              interviews: data.metrics.upcomingInterviewsCount || 0,
              credits: data.metrics.credits,
              companyCredits: data.metrics.credits,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch employer dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch candidates on mount
  useEffect(() => {
    async function fetchCandidates() {
      try {
        const data = await fetchEmployerCandidates<Candidate>();
        setCandidates(data.map(candidate => ({ ...candidate, stage: pipelineStageLabels[candidate.stage] || candidate.stage })));
      } catch (err) {
        console.error("Failed to fetch employer candidates:", err);
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
      console.error(err);
      alert(err.message || "Failed to update candidate stage.");
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
      isLoading: isLoading || isCandidatesLoading
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
