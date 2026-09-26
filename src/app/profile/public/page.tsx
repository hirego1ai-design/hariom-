import Link from "next/link";

export default function PublicProfilePage() {
  return (
    <main className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center px-6">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#141418] p-8 md:p-10 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow/10 border border-yellow/20">
          <span className="material-symbols-outlined text-yellow text-3xl">verified_user</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Candidate profile sharing is being secured</h1>
        <p className="mt-4 text-sm leading-6 text-text-muted">
          Public candidate profiles are unavailable until candidate-specific, revocable share links and verified evidence are connected.
          HireGo does not display sample identities, scores, rankings, or credentials as real candidate data.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-white/90">
            Return to HireGo
          </Link>
          <Link href="/candidate/profile" className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10">
            Open my profile
          </Link>
        </div>
      </section>
    </main>
  );
}
