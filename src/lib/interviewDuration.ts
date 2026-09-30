export const INTERVIEW_DURATION_PRESETS = [15, 30, 45, 60] as const;
export const MIN_INTERVIEW_DURATION_MINS = 10;
export const MAX_INTERVIEW_DURATION_MINS = 60;

export function isValidInterviewDurationMins(value: number): boolean {
  return Number.isInteger(value)
    && value >= MIN_INTERVIEW_DURATION_MINS
    && value <= MAX_INTERVIEW_DURATION_MINS;
}

export function isPresetInterviewDurationMins(value: number): boolean {
  return INTERVIEW_DURATION_PRESETS.some((preset) => preset === value);
}
