"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { isCandidateVoiceRoute } from "@/lib/jarvis/JarvisVoiceRoutes";

// Load voice/media code only inside the candidate experience, not public,
// employer or admin pages. This mount survives App Router client navigation.
const JarvisVoiceGlobe = dynamic(() => import("./JarvisVoiceGlobe"), {
  ssr: false,
});

export default function JarvisVoiceMount() {
  const pathname = usePathname();
  if (!pathname || !isCandidateVoiceRoute(pathname)) return null;
  return <JarvisVoiceGlobe />;
}
