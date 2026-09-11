/** Legacy pipeline views filter locally, so they must consume every API page. */
export async function fetchEmployerCandidates<T>(signal?: AbortSignal): Promise<T[]> {
  const candidates: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const response = await fetch(`/api/employer/candidates?${query}`, { signal });
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.candidates)) {
      throw new Error(data.error || "Unable to load candidates");
    }
    candidates.push(...data.candidates);
    cursor = data.pagination?.nextCursor ?? null;
    if (cursor !== null && (typeof cursor !== "string" || seenCursors.has(cursor))) {
      throw new Error("Candidate pagination did not advance. Please reload.");
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);
  return candidates;
}

export const pipelineStageLabels: Record<string, string> = {
  APPLIED: "AI Screening", SCREENING: "AI Screening", ASSESSMENT: "Assessment",
  AI_INTERVIEW: "AI Interview", SHORTLISTED: "Shortlisted", HIRED: "Joined", REJECTED: "Rejected",
};

export function pipelineStageStatus(label: string): string {
  const status = Object.entries(pipelineStageLabels).find(([key, value]) => key !== "APPLIED" && value === label)?.[0];
  if (!status) throw new Error("Unsupported hiring stage");
  return status;
}
