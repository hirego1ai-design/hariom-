"use client";

import { usePathname } from "next/navigation";
import { isCandidateVoiceRoute } from "@/lib/jarvis/JarvisVoiceRoutes";

// Voice mode has been permanently disabled across the HireGo candidate experience.
// Jarvis operates exclusively through prompt & text driven automated browser action execution.
export default function JarvisVoiceMount() {
  const pathname = usePathname();
  if (!pathname || !isCandidateVoiceRoute(pathname)) return null;
  return null;
}

