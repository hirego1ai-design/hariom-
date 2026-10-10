/**
 * Strict, zero-LLM intent gate for candidate-facing, read-only HireGo actions.
 * Unknown or genuinely analytical requests fall through to the configured AI router.
 * This module must never execute writes, payments, applications or scheduling.
 */
export type CandidateDirectIntent =
  | { kind: "GREETING" }
  | { kind: "APPLICATION_STATUS" }
  | { kind: "NEXT_INTERVIEW" }
  | { kind: "RECOMMENDATIONS" }
  | { kind: "OPEN_PROFILE" }
  | { kind: "OPEN_MOCK_INTERVIEW" }
  | { kind: "OPEN_CREDITS" }
  | { kind: "OPEN_JOBS" }
  | { kind: "OPEN_DASHBOARD" }
  | { kind: "SEARCH_JOBS"; query: string | null; location: string | null }
  | { kind: "CONFIRM_IN_PORTAL" };

function normalize(input: string) {
  return input.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim().replace(/[.!?।]+$/u, "").trim();
}

function readOnlySearch(text: string): CandidateDirectIntent | null {
  // Be conservative: unrecognized filters need interpretation, not fake results.
  const jobNoun = /\b(jobs?|openings|vacancies|naukri)\b|नौकर(?:ी|ियाँ)/iu;
  if (!jobNoun.test(text)) return null;
  const searchStart = /^(?:please\s+)?(?:show(?: me)?|find(?: me)?|search(?: for)?|list|browse|get(?: me)?|are there|looking for)\s+/i;
  if (!searchStart.test(text) && !/^(?:jobs?|openings|vacancies|naukri)\b/i.test(text)) return null;

  const noAction = text.replace(searchStart, "").replace(/\b(?:jobs?|openings|vacancies|naukri)\b/gi, " ");
  const location = noAction.match(/\b(?:in|near|at)\s+([\p{L}\p{N} .-]{2,80})$/iu);
  const query = noAction
    .replace(/\b(?:in|near|at)\s+[\p{L}\p{N} .-]{2,80}$/iu, " ")
    .replace(/\b(?:for|all|the|latest|new|available|current|open|me|any)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (query.length > 120) return null;
  // Unsupported filters should not silently be treated as plain keyword search.
  if (/\b(remote|hybrid|onsite|salary|paying|above|below|part.time|full.time)\b/.test(query)) return null;
  return { kind: "SEARCH_JOBS", query: query || null, location: location?.[1]?.trim() || null };
}

export function classifyCandidateDirectIntent(input: string): CandidateDirectIntent | null {
  const text = normalize(input);
  if (!text || text.length > 300) return null;

  // These operations require the candidate to confirm in the actual authorized UI;
  // Jarvis must not infer consent or execute side effects from natural language.
  if (/\b(?:apply for|apply to|submit application|withdraw application|cancel interview|reschedule interview|book interview|schedule interview|delete account|delete profile|make payment|pay now|purchase credits|buy credits)\b/i.test(text)) {
    return { kind: "CONFIRM_IN_PORTAL" };
  }

  if (/^(?:hi|hello|hey|hey jarvis|namaste|namaskar|good morning|good afternoon|good evening|नमस्ते|नमस्कार)$/iu.test(text)) {
    return { kind: "GREETING" };
  }

  // Reasoning and unknown decisions must never be answered with a generic database
  // navigation as though it were a personalized AI recommendation.
  if (/\b(?:why|how|explain|analy[sz]e|compare|should|strategy|improve|advise|advice|pros|cons|better|prepare for|interview questions|cover letter)\b|\b(?:क्यों|कैसे|सलाह|तुलना)\b/iu.test(text)) {
    // Simple counts/status lookups are still deterministic.
    if (!/^(?:how many (?:applications|jobs)|what is (?:my )?application status)\b/.test(text)) return null;
  }

  if (/\b(?:recommended jobs|matching jobs|jobs for me|best matching jobs|jobs matching my profile|mere liye jobs|मेरे लिए नौकरी)\b/iu.test(text)) {
    return { kind: "RECOMMENDATIONS" };
  }

  if (/\b(?:practice interview|mock interview|interview practice|interview ki practice|मॉक इंटरव्यू)\b/iu.test(text)) {
    return { kind: "OPEN_MOCK_INTERVIEW" };
  }

  if (/\b(?:application status|applications status|my applications|applied jobs|track application|application dikhao|मेरी एप्लीकेशन|मेरे आवेदन)\b/iu.test(text) ||
    /^(?:how many applications|what is my application status)/i.test(text)) {
    return { kind: "APPLICATION_STATUS" };
  }

  if (/\b(?:next interview|upcoming interview|my interview schedule|interview status|interview kab hai|agla interview|अगला इंटरव्यू)\b/iu.test(text)) {
    return { kind: "NEXT_INTERVIEW" };
  }

  if (/\b(?:open profile|my profile|edit profile|show profile|profile kholo|मेरा प्रोफाइल)\b/iu.test(text)) {
    return { kind: "OPEN_PROFILE" };
  }

  if (/\b(?:career credits|my credits|credit balance|credit history|wallet|pricing|credit wallet|mere credits|मेरा वॉलेट)\b/iu.test(text)) {
    return { kind: "OPEN_CREDITS" };
  }

  if (/^(?:open|show|go to|take me to)\s+(?:my\s+)?dashboard$/i.test(text)) {
    return { kind: "OPEN_DASHBOARD" };
  }

  if (/^(?:open jobs|browse jobs|job list|jobs kholo|open job list|job portal|नौकरी दिखाओ)$/iu.test(text)) {
    return { kind: "OPEN_JOBS" };
  }

  return readOnlySearch(text);
}
