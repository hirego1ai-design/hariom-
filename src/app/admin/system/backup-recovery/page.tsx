import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminBackupRecoveryPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Backup & Disaster Recovery"
          subtitle="Evidence-only view until an authenticated backup-provider integration exists."
        />

        <main className="mx-auto max-w-5xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5" aria-labelledby="backup-evidence-heading">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
              External evidence required
            </p>
            <h1 id="backup-evidence-heading" className="mt-2 text-xl font-bold">
              No live backup-provider integration is connected to this Admin screen.
            </h1>
            <p className="mt-3 text-sm leading-6 text-amber-100/80">
              Snapshot time, retention, encryption, point-in-time recovery, restore completion and multi-region recovery status are not inferred or claimed here.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2" aria-label="Backup and recovery evidence boundaries">
            <article className="rounded-2xl border border-white/10 bg-[#141418] p-5">
              <h2 className="font-bold">What is authoritative today</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>Database-provider backup and PITR evidence from the production database console.</li>
                <li>Object-storage retention/versioning evidence from the configured storage provider.</li>
                <li>Executed restore-test evidence and operator records captured during a real restore exercise.</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#141418] p-5">
              <h2 className="font-bold">What this page does not do</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>It does not start backups or restores.</li>
                <li>It does not display fabricated “last backup” timestamps or recovery percentages.</li>
                <li>It does not treat application health as proof that backups are recoverable.</li>
              </ul>
            </article>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#141418] p-5">
            <h2 className="font-bold">Related internal evidence</h2>
            <p className="mt-2 text-sm text-slate-400">
              Runtime diagnostics and administrator audit evidence can be reviewed inside HireGo, but they are separate from backup-provider proof.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/admin/system-health"
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/5"
              >
                System diagnostics
              </Link>
              <Link
                href="/admin/settings/audit-log"
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/5"
              >
                Admin audit trail
              </Link>
            </div>
          </section>

          <div role="status" className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-500">
            Backup/restore controls should only be added after a provider integration can authenticate the operation, persist immutable operator evidence, and report the actual restore result.
          </div>
        </main>
      </div>
    </div>
  );
}
