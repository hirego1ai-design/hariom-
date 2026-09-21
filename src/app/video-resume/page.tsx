import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AudioLines, CircleUserRound, FileText, Play, ShieldCheck, UserCheck, Video } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import { Breadcrumbs, FAQ, FinalCTA, JsonLd, SectionHeading, breadcrumbSchema, styles } from "@/components/marketing/Editorial";
import { marketingMetadata } from "@/lib/marketingMetadata";
import pageStyles from "./VideoResume.module.css";

export const metadata: Metadata = marketingMetadata({
  path: "/video-resume",
  title: "Video Resumes for Candidates and Employers | HireGo AI",
  description: "Show your experience in your own words. HireGo video resumes and review reports help hiring teams understand candidates with human judgment at the center.",
});

const prompts = [
  ["Your role", "What kind of work are you looking for, and what experience is most relevant?"],
  ["Your example", "Explain one project, customer situation or result that shows what you can do."],
  ["Your strengths", "Describe the skills or knowledge you want an employer to notice."],
];

const faqs = [
  { question: "Is a video resume required?", answer: "The HireGo video resume is an optional way to add context to a candidate profile. A particular employer may ask for a different format or assessment for its own process." },
  { question: "What can the report tell an employer?", answer: "When analysis is available, it can organize a transcript and observable presentation details such as speech pace, structure and recording quality. It cannot establish character, honesty, personality or whether someone should be hired." },
  { question: "Does AI decide who gets the job?", answer: "No. An employer must review relevant information and make its own hiring decision. The report is supporting context, not an automatic acceptance or rejection rule." },
  { question: "What if I cannot or do not want to record a video?", answer: "Contact HireGo or the employer about an appropriate alternative way to present job relevant information. A disability, equipment limitation or recording environment should not be treated as a measure of ability." },
];

export default function VideoResumePage() {
  return <MarketingShell><div className={styles.page}>
    <section className={pageStyles.hero}><div className={`${styles.container} ${pageStyles.heroGrid}`}>
      <div><Breadcrumbs current="Video Resume" /><p className={styles.eyebrow}>For candidates and employers</p><h1>Let people see the person behind the resume.</h1><p className={pageStyles.lead}>A short video helps candidates explain their experience, demonstrate role knowledge and speak in their own words. A review report can help employers find the relevant moments faster. People still make the hiring decision.</p><div className={styles.actions}><Link className={styles.buttonLight} href="/register?type=candidate">Create your candidate profile ↗</Link><Link className={styles.buttonOutline} href="/services#managed-hiring">Explore Managed Hiring</Link></div><p className={pageStyles.disclaimer}>Video is optional. Report availability depends on the configured service.</p></div>
      <div className={pageStyles.story} aria-label="Illustration of a candidate video and an employer review report">
        <div className={pageStyles.videoCard}><div className={pageStyles.cardTop}><Image src="/marketing/hirego-logo-hd.png" width={110} height={37} alt="HireGo AI" /><span>Illustrative preview</span></div><div className={pageStyles.person}><CircleUserRound size={116} strokeWidth={1.15} aria-hidden="true" /><span className={pageStyles.play}><Play size={28} fill="currentColor" aria-hidden="true" /></span></div><div className={pageStyles.caption}><strong>Meet the candidate</strong><span>Experience · Example · Skills</span></div></div>
        <div className={pageStyles.report}><div className={pageStyles.reportTitle}><FileText size={20} aria-hidden="true" /><strong>Review at a glance</strong></div><div><AudioLines size={18} aria-hidden="true" /> Spoken introduction and transcript</div><div><Video size={18} aria-hidden="true" /> Candidate’s own example</div><div><UserCheck size={18} aria-hidden="true" /> Human review and decision</div></div>
      </div>
    </div></section>

    <section className={styles.section}><div className={styles.container}><SectionHeading eyebrow="What to share" title="Give employers useful context in two minutes." body="Keep the story specific to the role. A good recording helps a reviewer understand your work; it does not need studio lighting or a perfect script." /><div className={pageStyles.promptGrid}>{prompts.map(([title,body],index)=><article className={pageStyles.prompt} key={title}><span className={pageStyles.promptIcon}>{index === 0 ? <CircleUserRound aria-hidden="true" /> : index === 1 ? <Play aria-hidden="true" /> : <AudioLines aria-hidden="true" />}</span><h3>{title}</h3><p>{body}</p></article>)}</div><p className={pageStyles.requirements}>Record or upload an MP4 or WebM video, up to 2 minutes and 10 MB. A recorded clip can be previewed before saving. Share only information you want considered for hiring.</p></div></section>

    <section className={`${styles.section} ${styles.tint}`}><div className={`${styles.container} ${styles.split}`}><div><SectionHeading eyebrow="For employers" title="Review the person, then the evidence." body="A video can add context that a PDF cannot: how a candidate describes a project, explains relevant knowledge and communicates an example. Where analysis is available, a transcript and presentation summary make review quicker." /><p className={pageStyles.body}>Use job related criteria and listen to the candidate’s own words. Recording conditions, language, disability and equipment can affect presentation. A video report is a guide to review, not a verdict.</p><Link className={styles.inlineLink} href="/contact">Discuss video resumes with our team ↗</Link></div><div className={pageStyles.reviewFlow}><div><span><Video aria-hidden="true" /></span><strong>Candidate records</strong><p>A short, role relevant introduction.</p></div><div><span><FileText aria-hidden="true" /></span><strong>Report organizes</strong><p>Transcript and observable details when available.</p></div><div><span><UserCheck aria-hidden="true" /></span><strong>Employer reviews</strong><p>A person assesses the full application and decides.</p></div></div></div></section>

    <section className={styles.section}><div className={styles.container}><div className={pageStyles.safeguard}><span className={pageStyles.shield}><ShieldCheck size={32} aria-hidden="true" /></span><div><h2>Built for a fairer review.</h2><p>We do not present appearance, accent, eye contact or a model’s idea of “confidence” as proof of ability or character. Candidates can ask for an alternative way to provide information or raise a concern about a report. Read the <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms and Conditions</Link> before uploading.</p></div></div></div></section>

    <FAQ title="Video resume questions" items={faqs} />
    <FinalCTA title="Give hiring a more human introduction." body="Create a candidate profile or ask how HireGo can bring video context into an employer workflow." primary={{label:"Get started",href:"/register?type=candidate"}} secondary={{label:"Talk to HireGo",href:"/contact"}} />
    <JsonLd data={breadcrumbSchema("Video Resume","/video-resume")} />
  </div></MarketingShell>;
}
