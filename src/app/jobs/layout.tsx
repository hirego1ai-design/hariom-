import type { Metadata } from "next";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/jobs",
  title: "HireGo Jobs | Find Jobs & Career Opportunities",
  description:
    "Explore HireGo jobs and career opportunities. Build a job-ready profile, discover relevant roles and move through a connected candidate hiring workflow.",
});

export default function JobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
