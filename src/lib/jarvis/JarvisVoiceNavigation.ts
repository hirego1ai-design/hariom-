/**
 * Only a recognized, explicitly spoken navigation command can change a page.
 * URLs always come from authorized server-generated actions and this allowlist.
 * Search-result links and consequential actions require an explicit click.
 */
export type VoiceAction = { label: string; href: string };

const NAVIGATION_ROUTES = new Set([
  "/dashboard",
  "/profile",
  "/jobs",
  "/applications",
  "/interviews",
  "/credits",
  "/ai/mock-interview/setup",
]);

export function isAllowedVoiceActionHref(href: string): boolean {
  return NAVIGATION_ROUTES.has(href);
}

export function pickSafeVoiceNavigation(
  utterance: string,
  actions: VoiceAction[],
): string | null {
  const message = utterance.toLowerCase().trim();
  if (!/^(please\s+)?(open|show|go to|take me to|navigate to|browse)\b/i.test(message)) {
    return null;
  }
  if (/\b(apply|cancel|buy|pay|withdraw|delete|submit|reschedule)\b/i.test(message)) {
    return null;
  }

  const matches = actions.filter(
    (action) => isAllowedVoiceActionHref(action.href),
  );
  if (matches.length !== 1) return null;

  const route = matches[0].href;
  if (route === "/jobs" && !/\b(jobs?|openings|vacancies|naukri)\b/i.test(message)) return null;
  if (route === "/profile" && !/\bprofile\b/i.test(message)) return null;
  if (route === "/dashboard" && !/\bdashboard\b/i.test(message)) return null;
  if (route === "/applications" && !/\bapplications?\b/i.test(message)) return null;
  if (route === "/interviews" && !/\b(interview|practice)\b/i.test(message)) return null;
  if (route === "/credits" && !/\b(credits?|wallet|balance)\b/i.test(message)) return null;
  if (route === "/ai/mock-interview/setup" && !/\b(mock|practice)\b/i.test(message)) return null;
  return route;
}
