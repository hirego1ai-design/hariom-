import Image from "next/image";
import { ArrowDown, BriefcaseBusiness, CircleUserRound, UserCheck, UsersRound } from "lucide-react";
import styles from "./ManagedHiringVisual.module.css";

const steps = [
  { icon: BriefcaseBusiness, label: "Your hiring need", detail: "Define the role and priorities" },
  { icon: UsersRound, label: "HireGo team + tools", detail: "Source, coordinate, follow up" },
  { icon: CircleUserRound, label: "Relevant candidates", detail: "Meet people with context" },
  { icon: UserCheck, label: "You choose", detail: "Final hiring decision stays with you" },
];

export default function ManagedHiringVisual() {
  return <div className={styles.visual} aria-label="Managed hiring flow from employer requirement through HireGo support to an employer hiring decision">
    <div className={styles.brand}><Image src="/marketing/hirego-logo-hd.png" width={128} height={43} alt="HireGo AI" /><span>Managed Hiring</span></div>
    <div className={styles.steps}>{steps.map(({ icon: Icon, label, detail }, index) => <div className={styles.group} key={label}><div className={styles.step}><span className={styles.icon}><Icon size={24} strokeWidth={1.8} aria-hidden="true" /></span><div><strong>{label}</strong><p>{detail}</p></div></div>{index < steps.length - 1 && <ArrowDown className={styles.arrow} size={18} aria-hidden="true" />}</div>)}</div>
    <p className={styles.fee}>Pay Per Hire <span>·</span> Fee tied to a successful hire under agreed terms</p>
  </div>;
}
