"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type SkillEvidence = {
  name: string;
  claimedLevel: string | null;
  verifiedLevel: string | null;
  verificationStatus: "SELF_DECLARED" | "ASSESSMENT_VALIDATED" | "VERIFIED" | "EXPIRED";
  latestScore: number | null;
  verifiedAt: string | null;
  validUntil: string | null;
};

type CandidateDetail = {
  profile: {
    id: string;
    name: string;
    headline: string | null;
    experience: string | null;
    location: string | null;
    availability: string | null;
    availabilityConfirmedAt: string | null;
    about: string | null;
    appliedJob: string | null;
    appliedDate: string | null;
  };
  application: {
    id: string;
    status: string;
    createdAt: string;
  } | null;
  scores: {
    overallMatch: number | null;
  };
  skills: {
    technical: SkillEvidence[];
  };
  jobReadyRecords: Array<{
    roleTitle: string;
    seniority: string;
    score: number | null;
    validUntil: string | null;
  }>;
  videoResume: { id: string } | null;
};

export default function EmployerCandidateProfilePage() {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setError("Candidate identifier is required.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/employer/candidates/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success || !payload.profile) {
          throw new Error(payload.error || "Unable to load candidate profile.");
        }
        setCandidate(payload as CandidateDetail & { success: true });
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Unable to load candidate profile.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const profile = candidate?.profile;
  const application = candidate?.application;
  const matchScore = candidate?.scores?.overallMatch ?? null;
  const jobReadyRecords = candidate?.jobReadyRecords ?? [];
  const skills = candidate?.skills?.technical ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Candidate Review"
        subtitle="Tenant-scoped recorded candidate evidence. Missing evidence is not inferred."
      />

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">
          Loading candidate evidence…
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && candidate && profile && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#121215] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
                <p className="mt-1 text-sm text-text-muted">
                  {profile.headline || "Role not provided"} · {profile.location || "Location not provided"}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  {profile.about || "No candidate bio has been recorded."}
                </p>
              </div>
              {application?.status && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {application.status.replaceAll("_", " ")}
                </span>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Applied Job", profile.appliedJob || "Not available"],
              ["Recorded Match", typeof matchScore === "number" && Number.isFinite(matchScore) ? `${matchScore}/100` : "Not available"],
              ["Experience", profile.experience || "Not provided"],
              [
                "Availability",
                profile.availability
                  ? profile.availability.replaceAll("_", " ")
                  : "Not provided",
              ],
            ].map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
                <p className="mt-2 text-base font-bold text-white">{value}</p>
              </article>
            ))}
          </section>

          {profile.availabilityConfirmedAt && (
            <p className="text-xs text-text-muted">
              Availability last confirmed: {new Date(profile.availabilityConfirmedAt).toLocaleString()}
            </p>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <h2 className="text-lg font-extrabold text-white">Job-Ready Evidence</h2>
            {jobReadyRecords.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">No current Job-Ready assessment record is available.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {jobReadyRecords.map((record, index) => (
                  <div key={`${record.roleTitle}-${record.seniority}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="font-bold text-white">{record.roleTitle} · {record.seniority}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      Score: {typeof record.score === "number" ? `${record.score}/100` : "Not available"} · Valid until: {record.validUntil ? new Date(record.validUntil).toLocaleDateString() : "No expiry recorded"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <h2 className="text-lg font-extrabold text-white">Skill Evidence</h2>
            {skills.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">No candidate skills have been recorded.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {skills.map((skill) => {
                  const evidenceBacked =
                    skill.verificationStatus === "ASSESSMENT_VALIDATED" ||
                    skill.verificationStatus === "VERIFIED";
                  const label =
                    skill.verificationStatus === "VERIFIED"
                      ? "Verified"
                      : skill.verificationStatus === "ASSESSMENT_VALIDATED"
                        ? "Knowledge Validated"
                        : skill.verificationStatus === "EXPIRED"
                          ? "Evidence expired"
                          : "Self-declared";

                  return (
                    <div key={skill.name} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-white">{skill.name}</p>
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                            evidenceBacked
                              ? "border-green-500/30 bg-green-500/10 text-green-300"
                              : "border-white/10 text-text-muted"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-text-muted">
                        Claimed level: {skill.claimedLevel || "Not provided"}
                        {skill.verifiedLevel ? ` · Verified level: ${skill.verifiedLevel}` : ""}
                        {evidenceBacked && typeof skill.latestScore === "number" ? ` · Evidence score: ${skill.latestScore}/100` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-wrap gap-3">
            {candidate.videoResume?.id && (
              <Link
                href={`/employer/video-resume/${encodeURIComponent(candidate.videoResume.id)}`}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                Review video resume
              </Link>
            )}
            <Link
              href="/employer/hiring-pipeline"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white"
            >
              Back to pipeline
            </Link>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
