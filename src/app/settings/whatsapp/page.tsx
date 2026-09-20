import CandidateSidebar from "@/components/candidate/CandidateSidebar";

export default function WhatsappApiConfigPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <main className="min-h-screen p-gutter max-w-container-max mx-auto space-y-6">
        <div>
          <h1 className="font-display-lg text-display-lg text-white">WhatsApp Notifications</h1>
          <p className="text-text-muted text-sm">WhatsApp delivery is managed securely by HireGo administrators. Candidate accounts never receive or store Meta API credentials.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3 max-w-xl">
          <h2 className="text-white font-semibold">Messaging consent</h2>
          <p className="text-text-secondary text-sm">HireGo only sends WhatsApp communications when active messaging consent is recorded. Replying to or contacting HireGo does not automatically opt you in.</p>
          <p className="text-text-muted text-xs">Connection credentials and provider configuration are server-side secrets and are not configurable from this candidate page.</p>
        </div>
      </main>
    </div>
  );
}
