import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

export default function ManagedHiringServicePlanPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Managed Hiring Service Workflow"
        subtitle="Reference information only. Requirement status, interview rounds, candidate movement, notifications, and billing are authoritative only when recorded in their corresponding workflows."
      />
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-[#121215] p-6">
          <h2 className="text-lg font-bold text-white">Typical workflow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Requirement", "Submit the role, location, compensation and success criteria."],
              ["Sourcing & screening", "Candidates enter the recorded managed-hiring pipeline."],
              ["Assessments", "Assigned assessments and evidence are stored against candidate applications."],
              ["Interview coordination", "Use the scheduler and recorded interview-round configuration."],
              ["Employer decision", "Hiring decisions and feedback are submitted through protected workflows."],
              ["Joining & billing", "Placement billing follows persisted agreement and joining records."],
            ].map(([title, description]) => (
              <article key={title} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-xs text-text-muted">
          This page does not claim that agent orchestration, WhatsApp delivery, video capability, a specific round count, or a billing event is active unless the relevant backend record exists.
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/employer/managed-hiring/request" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">Start requirement</Link>
          <Link href="/employer/managed-hiring/candidate-tracking" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white">Open candidate tracking</Link>
          <Link href="/employer/upcoming-interviews-list" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white">Open interviews</Link>
        </div>
      </div>
    </PageContainer>
  );
}
