export const VIDEO_ANALYSIS_TERMINAL_STATUSES = ["COMPLETED", "FAILED", "BLOCKED_INFRA"] as const;

export type VideoAnalysisTerminalStatus = (typeof VIDEO_ANALYSIS_TERMINAL_STATUSES)[number];

export function isTerminalVideoAnalysisStatus(status: string): status is VideoAnalysisTerminalStatus {
  return VIDEO_ANALYSIS_TERMINAL_STATUSES.includes(status as VideoAnalysisTerminalStatus);
}

/**
 * Provider callbacks are final evidence for one immutable analysis job. A
 * delayed or replayed callback may be acknowledged, but must never change a
 * job after any terminal result has been persisted.
 */
export function canApplyVideoAnalysisCallback(currentStatus: string): boolean {
  return !isTerminalVideoAnalysisStatus(currentStatus);
}
