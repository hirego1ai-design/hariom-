import Link from "next/link";
import Image from "next/image";

const groups = [
  { title: "Platform", links: [["Platform", "/features"], ["Services", "/services"], ["Solutions", "/solutions"], ["Pricing", "/pricing"]] },
  { title: "Employers", links: [["Managed Hiring · Pay Per Hire", "/services#managed-hiring"], ["Employer Co-Pilot", "/services#employer-copilot"], ["Candidate Sourcing", "/services#candidate-sourcing"], ["Interview Workflows", "/services#interview-orchestration"]] },
  { title: "Candidates", links: [["Find Jobs", "/find-jobs"], ["Video Resume", "/video-resume"], ["Mock Interview", "/services#mock-interview"], ["Career Resources", "/career-resources"]] },
  { title: "Company", links: [["About Us", "/about"], ["Careers", "/careers"], ["Blog", "/blog"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Legal & Trust Center", "/legal"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"], ["Refund & Cancellation", "/refund-cancellation"], ["Service Delivery", "/service-delivery"]] },
];

export default function MarketingFooter() {
  return <footer className="border-t border-white/10 bg-[#071322] text-white">
    <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.6fr_repeat(5,minmax(0,1fr))]">
      <div>
        <Link href="/" className="inline-block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" aria-label="HireGo AI homepage">
          <Image src="/marketing/hirego-logo-hd.png" alt="HireGo AI" width={180} height={60} className="h-auto w-[180px]" sizes="180px" />
        </Link>
        <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">Connected hiring operations, with people responsible for consequential hiring decisions.</p>
        <a href="mailto:support@hiregoai.com" className="mt-4 inline-block text-sm font-medium text-cyan-300 hover:underline">support@hiregoai.com</a>
      </div>
      {groups.map(group=><nav key={group.title} aria-label={`${group.title} footer links`}><h2 className="text-sm font-bold">{group.title}</h2><ul className="mt-4 space-y-3 text-sm text-slate-300">{group.links.map(([label,href])=><li key={href}><Link href={href} className="rounded hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">{label}</Link></li>)}</ul></nav>)}
    </div>
    <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} HireGo AI. All rights reserved.</div>
  </footer>;
}
