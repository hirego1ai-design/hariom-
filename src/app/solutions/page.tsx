import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { EditorialHero, FAQ, FinalCTA, JsonLd, SectionHeading, breadcrumbSchema, styles } from "@/components/marketing/Editorial";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({ path: "/solutions", title: "AI Hiring Solutions for Employers & Recruiters | HireGo AI", description: "HireGo AI provides autonomous recruitment solutions for startups, growing teams, enterprises, high-volume hiring and companies that need managed hiring.", image: "/marketing/og/solutions.webp" });

const audiences = [
  { id: "startups", audience: "For Startups", title: "Hire without building a large recruiting operation first.", body: "Early-stage teams often need strong people before they have a dedicated recruiting department. HireGo can help organize sourcing, screening, assessments, scheduling and candidate follow-up so founders spend more time evaluating people and less time operating the funnel.", points: ["Employer Co-Pilot", "Candidate sourcing", "Structured screening", "Interview scheduling"], link: { label: "Explore Employer Co-Pilot", href: "/services#employer-copilot" } },
  { id: "growing", audience: "For Growing Companies", title: "Scale hiring operations without multiplying manual work.", body: "As hiring volume increases, operational work grows faster than the recruiting team. HireGo connects sourcing, assessments, interviews and feedback so more candidates can move through the workflow without recruiters coordinating every transition.", points: ["Reusable hiring workflows", "Assessment coordination", "Candidate follow-up", "Interview operations"], link: { label: "Explore hiring services", href: "/services" } },
  { id: "enterprise", audience: "For Enterprise Hiring Teams", title: "Structure complex hiring across teams, interviewers and stages.", body: "Enterprise recruiting requires permissions, multiple participants and repeatable processes. HireGo is designed to support recruiters, hiring managers, interviewers and operations teams at the right stage with clear context and employer-defined approvals.", points: ["Role-based access", "Multiple rounds and interviewers", "Structured feedback", "Workflow history and human approvals"], link: { label: "Discuss an enterprise workflow", href: "/contact" } },
  { id: "high-volume", audience: "For High-Volume Hiring", title: "Automate repetitive work before it becomes the bottleneck.", body: "When candidate volume increases, manually coordinating every stage becomes difficult. HireGo helps employers use structured screening, assessments and interviews so hiring teams can focus attention where human review adds value.", points: ["Operations and support hiring", "Sales teams", "Entry-level and campus programs", "Repeat roles"], link: { label: "See screening and assessments", href: "/services#screening" } },
];
const challenges = [
  ["We need relevant candidates.", "Autonomous Candidate Sourcing", "/services#candidate-sourcing"],
  ["Recruiters spend too much time coordinating.", "Employer Co-Pilot", "/services#employer-copilot"],
  ["We need better evidence before interviews.", "Structured Assessments", "/services#assessments"],
  ["Scheduling interviews is painful.", "Interview Orchestration", "/services#interview-orchestration"],
  ["Candidates need preparation.", "AI Mock Interview", "/services#mock-interview"],
  ["We cannot operate hiring internally.", "Managed Hiring — Pay Per Hire", "/services#managed-hiring"],
];
const faqs = [
  { question: "Is HireGo AI suitable for startups?", answer: "Yes. Startups can use a structured hiring workflow and available automation without first building a large recruiting operations team. Founders and hiring managers retain control of candidate evaluation and final decisions." },
  { question: "Can HireGo support enterprise multi-round interviews?", answer: "HireGo is designed to coordinate multiple rounds, interviewers, availability, candidate context and feedback within employer-defined workflows. Specific configuration and access needs should be discussed with the team." },
  { question: "Can HireGo automate recruitment without replacing recruiters?", answer: "Yes. The goal is to reduce repetitive sourcing, scheduling, routing and follow-up work so recruiters can focus on candidates, communication and judgment. Authorized people remain responsible for consequential hiring decisions." },
  { question: "Does HireGo support high-volume hiring?", answer: "HireGo can help structure screening, assessments and interviews for repeat or high-volume roles. The workflow and capacity depend on the employer’s configuration and agreed service model." },
  { question: "What is the difference between subscription and Pay Per Hire?", answer: "A subscription provides recurring access to specified platform capabilities and usage. Managed Hiring Pay Per Hire adds operational support, with fees linked to a successful hiring outcome under agreed commercial terms." },
];

export default function SolutionsPage() {
  return <MarketingShell><div className={styles.page}>
    <EditorialHero eyebrow="Hiring solutions for real teams" current="Solutions" title="The right hiring help for the way your team works." lead="Some companies need a partner to run sourcing and coordination. Others have a recruiting team and need better tools. Managed Hiring is our core service: we help move the process, you choose the person, and Pay Per Hire fees follow your agreed successful hire terms." image="/marketing/solutions-by-company-type.webp" alt="Illustrative HireGo hiring workflow branching into startup, growing company, enterprise, high-volume and managed hiring needs" primary={{label:"Explore Managed Hiring",href:"/services#managed-hiring"}} secondary={{label:"Talk to HireGo",href:"/contact"}} />

    <section className={styles.section} id="company-types"><div className={styles.container}><SectionHeading eyebrow="By company stage" title="A workflow shaped by your hiring constraint." body="Start with the work your team needs help moving. HireGo can support different levels of automation and operations while your team controls hiring decisions." />
      <div className={styles.grid2}>{audiences.map((item,index)=><article className={styles.card} id={item.id} key={item.id}><span className={styles.number}>{String(index+1).padStart(2,"0")}</span><p className={styles.eyebrow}>{item.audience}</p><h3 className="mt-3 text-2xl">{item.title}</h3><p>{item.body}</p><ul className={styles.list}>{item.points.map(point=><li key={point}>{point}</li>)}</ul><Link className={styles.inlineLink} href={item.link.href}>{item.link.label} ↗</Link></article>)}</div>
    </div></section>

    <section className={`${styles.section} ${styles.sectionDark}`} id="recruiting-teams"><div className={styles.container}><SectionHeading eyebrow="For recruiters and talent teams" title="Give recruiters an operations layer, not another dashboard to manage." body="Recruiters already have enough software. HireGo’s agentic model is designed to help execute permitted work inside a hiring workflow, so recruiters can spend more time on candidate quality, communication and decisions." />
      <div className={styles.grid2}><div className={`${styles.card} ${styles.cardDark}`}><h3>Disconnected tools</h3><p>Recruiter opens a tool → moves information → opens the next tool → coordinates calendars → follows up manually.</p></div><div className={`${styles.card} ${styles.cardDark}`}><h3>Connected workflow</h3><p>Recruiter defines the process → agents coordinate permitted execution → recruiter reviews candidates and decisions.</p></div></div>
    </div></section>

    <section className={`${styles.section} ${styles.tint}`} id="managed-capacity"><div className={`${styles.container} ${styles.split}`}><div><SectionHeading eyebrow="When capacity is limited" title="Hiring outcomes, without another process to operate." body="For companies without sufficient internal recruiting capacity, HireGo Managed Hiring combines technology, workflow orchestration and hiring operations support under an outcome-oriented engagement." /><Link href="/services#managed-hiring" className={styles.button}>Explore Pay Per Hire <span aria-hidden="true">↗</span></Link></div><div className={styles.card}><h3>Managed workflow</h3><ol className={`${styles.flow} mt-5`}>{["Define requirement","Source and organize","Assess and interview","Employer decides","Joining follow-up"].map(step=><li className={styles.flowItem} key={step}>{step}</li>)}</ol><p>Human authorization stays at the decision stage.</p></div></div></section>

    <section className={styles.section} id="by-challenge"><div className={styles.container}><SectionHeading eyebrow="By challenge" title="Start with the problem you need to solve." body="Each challenge leads to the relevant service, so you can see what the workflow actually does." /><div className={styles.grid3}>{challenges.map(([problem,solution,href])=><article className={styles.card} key={problem}><p className={styles.eyebrow}>“{problem}”</p><h3 className="mt-4">{solution}</h3><Link className={styles.inlineLink} href={href}>Explore {solution} ↗</Link></article>)}</div></div></section>

    <section className={`${styles.section} ${styles.tint}`}><div className={styles.container}><SectionHeading eyebrow="Commercial fit" title="Software access or operated hiring?" body="A subscription fits teams that run hiring internally. Managed Hiring Pay Per Hire fits employers that want agreed hiring operations supported. Interview services may be available for narrower needs." /><div className={styles.actions}><Link className={styles.button} href="/pricing">Compare subscription plans ↗</Link><Link className={styles.buttonOutline} href="/services#commercial-models">Compare all hiring models</Link></div></div></section>
    <FAQ items={faqs} />
    <FinalCTA title="Tell us what is slowing your hiring down." body="We can map the sourcing, coordination and review work around your current process, then identify a practical HireGo model." primary={{label:"Start Hiring",href:"/register?type=employer"}} secondary={{label:"Talk to HireGo",href:"/contact"}} />
    <JsonLd data={breadcrumbSchema("Solutions","/solutions")} />
  </div></MarketingShell>;
}
