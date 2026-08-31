import { redirect } from "next/navigation";

// The former Stitch screen catalogue linked to many unimplemented prototypes.
// Production users should only enter supported candidate flows.
export default function ScreenIndexPage() { redirect("/dashboard"); }
