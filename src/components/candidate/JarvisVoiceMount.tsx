"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Load voice/media code only inside the candidate experience, not public,
// employer or admin pages. This mount survives App Router client navigation.
const JarvisVoiceGlobe = dynamic(() => import("./JarvisVoiceGlobe"), {
  ssr: false,
});

const CANDIDATE_ROUTE_PREFIXES = [
  "/candidate/",
  "/dashboard",
  "/profile",
  "/jobs",
  "/applications",
  "/interviews",
  "/credits",
  "/notifications",
  "/assessment/readiness",
  "/ai/mock-interview/setup",
];

export function isCandidateVoiceRoute(pathname: string): boolean {
  return CANDIDATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : prefix + "/"),
  );
}

export default function JarvisVoiceMount() {
  const pathname = usePathname();
  if (!pathname || !isCandidateVoiceRoute(pathname)) return null;
  return <JarvisVoiceGlobe />;
}
