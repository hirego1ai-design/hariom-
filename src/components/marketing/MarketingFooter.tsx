import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0b0d]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-xl font-extrabold text-white">HireGo <span className="text-[#448aff]">AI</span></Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">The trusted talent platform that helps people become job-ready and helps teams hire with confidence.</p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Platform</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/features" className="hover:text-white">How it works</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/enterprise" className="hover:text-white">For employers</Link>
            <Link href="/jobs" className="hover:text-white">Browse jobs</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Company</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/about" className="hover:text-white">About us</Link>
            <Link href="/careers" className="hover:text-white">Careers</Link>
            <Link href="/blog" className="hover:text-white">Blog</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Legal</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} HireGo AI. All rights reserved.</div>
    </footer>
  );
}
