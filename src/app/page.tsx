import Link from "next/link";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import HeroEarth from "@/components/marketing/HeroEarth";
import HeroSky from "@/components/marketing/HeroSky";
import ManagedHiringVisual from "@/components/marketing/ManagedHiringVisual";
import heroStyles from "@/components/marketing/HomeHero.module.css";
import { JsonLd, styles } from "@/components/marketing/Editorial";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({path:"/",title:"HireGo AI | Connected Hiring Workflows",description:"HireGo AI helps coordinate sourcing, screening, assessments and interviews within one hiring workflow. People remain in control of hiring decisions.",image:"/marketing/og/home.webp"});

const stages = ["Job requirement","Candidate sourcing","Screening","Assessments","Interview coordination","Feedback","Human hiring decision","Joining follow-up"];

export default function HomePage() {
  return <MarketingShell home>
    <section className={heroStyles.hero}>
      <HeroSky /><HeroEarth />
      <div className={heroStyles.copy} data-hero-copy>
        <h1 className="text-[clamp(2.35rem,4.45vw,4.15rem)] font-black leading-[1.02] tracking-[-.045em] text-white">Welcome to<span className="mt-1 block bg-gradient-to-r from-[#42b9ff] via-[#c079ff] via-[#ff77d8] to-[#ff7767] bg-clip-text text-transparent sm:whitespace-nowrap">Future of Hiring</span></h1>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.35em] text-slate-200 sm:text-xs">The world’s fastest hiring platform</p>
        <div className="mx-auto mt-5 max-w-3xl text-slate-200">
          <p className="text-base font-semibold leading-7 sm:text-xl sm:leading-8">Hiring doesn’t need more applications. It needs more job-ready people.</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 tracking-[.015em] text-slate-300 sm:text-base sm:leading-7">HireGo AI finds, evaluates and prepares relevant candidates while autonomous AI agents move the hiring workflow from requirement to interview.</p>
        </div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/contact" className={`${heroStyles.primaryCta} rounded-full bg-white px-12 py-3 font-semibold text-[#1450c5] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300`}>Find Job-Ready Talent <span aria-hidden className="ml-2">→</span></Link><Link href="/services" className={`${heroStyles.secondaryCta} rounded-full border border-white px-12 py-3 font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300`}>See How HireGo Works</Link></div>
      </div>
      <svg className={heroStyles.transition} viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="hirego-carved-edge" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#eaf4ff" /><stop offset="1" stopColor="#fff" /></linearGradient></defs><path d="M0 -8 C220 142 780 142 1000 -8 L1000 122 L0 122Z" fill="url(#hirego-carved-edge)" /><path d="M0 0 C220 150 780 150 1000 0 L1000 122 L0 122Z" fill="#fff" /></svg>
    </section>

    <section className={styles.section}><div className={`${styles.container} ${styles.split}`}><div><p className={styles.eyebrow}>Our main service</p><h2 className="mt-4">Managed Hiring. A partner for the work between the steps.</h2><p className={styles.body}>Share the role. HireGo helps source candidates, organize relevant evidence, coordinate interviews and follow up. Your team meets people and makes the final decision.</p><p className={styles.body}><strong>Pay Per Hire:</strong> the success fee is tied to the successful hire event defined in your agreement. The amount and timing are clear before work begins.</p><div className={styles.actions}><Link href="/services#managed-hiring" className={styles.button}>See Managed Hiring ↗</Link><Link href="/contact" className={styles.buttonOutline}>Talk to HireGo</Link></div></div><ManagedHiringVisual /></div></section>

    <section className={styles.section}><div className={styles.container}><div className={styles.sectionHead}><p className={styles.eyebrow}>What HireGo does</p><h2>Hiring moves forward when the steps work together.</h2><p>HireGo AI is building an autonomous agentic hiring workflow. Specialized agents help execute permitted sourcing, assessment, scheduling and follow-up work while authorized people review evidence and decide.</p></div><ol className={styles.flow}>{stages.map(stage=><li key={stage} className={styles.flowItem}>{stage}</li>)}</ol><div className={styles.actions}><Link href="/services" className={styles.button}>Explore HireGo services ↗</Link><Link href="/features" className={styles.buttonOutline}>Explore the platform</Link></div></div></section>

    <section className={`${styles.section} ${styles.tint}`}><div className={styles.container}><div className={styles.sectionHead}><p className={styles.eyebrow}>Built around the problem</p><h2>The right model depends on how your company hires.</h2><p>Start with the constraint your team faces, then choose a workflow or service that fits.</p></div><div className={styles.grid3}><article className={styles.card}><h3>Need more relevant candidates?</h3><p>Connect approved sourcing, structured screening and human review.</p><Link className={styles.inlineLink} href="/services#candidate-sourcing">See candidate sourcing ↗</Link></article><article className={styles.card}><h3>Too much coordination?</h3><p>Employer Co-Pilot helps keep permitted operational work moving between stages.</p><Link className={styles.inlineLink} href="/services#employer-copilot">See Employer Co-Pilot ↗</Link></article><article className={styles.card}><h3>Not enough internal capacity?</h3><p>Managed Hiring can pair workflow automation with hiring operations support.</p><Link className={styles.inlineLink} href="/solutions#managed-capacity">Explore managed hiring ↗</Link></article></div><Link className={styles.inlineLink} href="/solutions">Find your hiring solution ↗</Link></div></section>

    <section className={styles.section}><div className={`${styles.container} ${styles.split}`}><div><p className={styles.eyebrow}>For candidates</p><h2 className="mt-4">A resume tells the facts. A short video adds your voice.</h2><p className={styles.body}>Candidates can explain a role-relevant project, skills and experience in their own words. Employers can review the recording with the rest of the application. Where available, a transcript helps them find the important moments.</p><Link className={styles.button} href="/video-resume">Explore video resumes ↗</Link></div><div className={styles.card}><p className={styles.eyebrow}>A simple introduction</p><h3 className="mt-4">What do you want an employer to understand?</h3><ol className={`${styles.flow} mt-6`}>{["Your experience","A project or result","What you know","A human review"].map(item=><li className={styles.flowItem} key={item}>{item}</li>)}</ol><p>The video is optional. It does not make a hiring decision.</p></div></div></section>

    <section className={`${styles.section} ${styles.sectionDark}`}><div className={styles.container}><div className={styles.sectionHead}><p className={styles.eyebrow}>Human control</p><h2>AI handles operational work. People own hiring decisions.</h2><p>Automation can organize evidence, coordinate interviews and prepare the next action. Final selection and rejection belong to authorized hiring teams.</p></div><Link className={styles.buttonLight} href="/about#human-control">Why HireGo is building this way ↗</Link></div></section>

    <section className={styles.section}><div className={styles.container}><div className={styles.cta}><h2>See the workflow behind the platform.</h2><p>Explore what HireGo does, who it is designed for and how we think about responsible automation.</p><div className={styles.actions}><Link href="/services" className={styles.buttonLight}>Services ↗</Link><Link href="/solutions" className={styles.buttonOutline}>Solutions</Link><Link href="/about" className={styles.buttonOutline}>About HireGo AI</Link></div></div></div></section>
    <JsonLd data={{"@context":"https://schema.org","@type":"Organization",name:"HireGo AI",url:"https://hiregoai.com",logo:"https://hiregoai.com/marketing/hirego-logo-hd.png",description:"HireGo AI builds connected hiring workflows with human-controlled hiring decisions."}} />
  </MarketingShell>;
}
