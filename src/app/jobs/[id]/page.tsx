import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import MarketingNav from "@/components/marketing/MarketingNav";
import { getCurrentSession } from "@/lib/auth";
import { getPublicJobById } from "@/lib/publicJobs";
import { buildJobMetadata, buildJobPostingSchema } from "@/lib/publicDiscovery";
import JobActions from "./JobActions";

type Props = { params: Promise<{ id: string }> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJobById(id);
  if (!job) {
    return {
      title: "Job unavailable — HireGo AI",
      robots: { index: false, follow: false },
    };
  }
  return buildJobMetadata(job);
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getPublicJobById(id);
  if (!job) notFound();

  let candidateAuthenticated = false;
  try {
    const requestHeaders = await headers();
    const session = await getCurrentSession(new Headers(requestHeaders));
    candidateAuthenticated = session?.role === "CANDIDATE";
  } catch {
    // Public job discovery must remain available if authenticated account
    // state is temporarily unavailable. Candidate actions re-check auth.
    candidateAuthenticated = false;
  }

  const schema = buildJobPostingSchema(job);

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      {candidateAuthenticated ? <CandidateSidebar /> : <MarketingNav />}

      <main className={`flex-1 w-full p-4 sm:p-6 lg:p-10 max-w-6xl ${candidateAuthenticated ? "md:ml-[116px] pb-24 md:pb-10" : "mx-auto pt-28 sm:pt-32"}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />

        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary mb-6 transition-colors font-bold"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Job Search</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <article className="lg:col-span-8 space-y-6">
            <header className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3" aria-hidden="true">
                  <span className="material-symbols-outlined text-primary text-[36px]">business</span>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-text-primary mb-1">{job.title}</h1>
                  <p className="text-xs text-text-secondary">
                    {job.company.name} • {job.location} • {job.type}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Salary Range</span>
                  <span className="text-xs font-bold text-primary">{job.salaryRange || "Not disclosed"}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Department</span>
                  <span className="text-xs font-bold text-text-primary">{job.department || "Not specified"}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Work Mode</span>
                  <span className="text-xs font-bold text-text-primary">{job.workMode}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Experience</span>
                  <span className="text-xs font-bold text-text-primary">{job.experienceLevel}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Openings</span>
                  <span className="text-xs font-bold text-text-primary">{job.numberOfOpenings}</span>
                </div>
              </div>
            </header>

            <section className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-4">
              <h2 className="text-base font-bold text-text-primary">About the Role</h2>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>

            {job.requirements.length > 0 && (
              <section className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-4">
                <h2 className="text-base font-bold text-text-primary">Key Requirements</h2>
                <ul className="space-y-2.5">
                  {job.requirements.map((requirement, index) => (
                    <li key={`${requirement}-${index}`} className="flex items-start gap-2.5 text-xs text-text-secondary">
                      <span className="material-symbols-outlined text-primary text-[16px] mt-0.5 flex-shrink-0" aria-hidden="true">check_circle</span>
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-3">
              <h2 className="text-base font-bold text-text-primary">Listing Information</h2>
              <p className="text-xs text-text-secondary">
                Published {job.publishedAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}
                {job.expiresAt ? ` · Applications close by ${job.expiresAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}` : ""}
              </p>
            </section>
          </article>

          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-8">
            <JobActions
              jobId={job.id}
              jobTitle={job.title}
              candidateAuthenticated={candidateAuthenticated}
            />

            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3">
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">Hiring Organization</h2>
              <p className="text-xs text-text-primary font-bold">{job.company.name}</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {job.company.description || "No company description has been provided for this listing."}
              </p>
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex text-xs font-bold text-primary hover:underline"
                >
                  Company website ↗
                </a>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
