import { redirect } from "next/navigation";

// The Stitch prototype promised resume parsing that the current upload flow
// does not perform. Keep one honest, supported resume route.
export default function ResumeWizardPage() { redirect("/onboarding/resume-upload"); }
