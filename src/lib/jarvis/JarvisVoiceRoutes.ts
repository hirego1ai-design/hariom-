/** Candidate-only pages where the same voice session can stay mounted. */
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
    (prefix) => pathname === prefix ||
      pathname.startsWith(prefix.endsWith("/") ? prefix : prefix + "/"),
  );
}
