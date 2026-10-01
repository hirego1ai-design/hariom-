import { describe, expect, it } from "vitest";
import { routeWhatsAppCandidateIntent } from "@/lib/whatsapp-candidate-assistant";
import { sanitizeRawPayload } from "@/lib/whatsapp-identity";

describe("WhatsApp autonomous candidate intent routing", () => {
  it("routes menu shortcuts", () => {
    expect(routeWhatsAppCandidateIntent("1")).toEqual({ type: "FIND_JOBS" });
    expect(routeWhatsAppCandidateIntent("2")).toEqual({ type: "APPLICATIONS" });
    expect(routeWhatsAppCandidateIntent("3")).toEqual({ type: "APPLICATION_STATUS" });
    expect(routeWhatsAppCandidateIntent("10")).toEqual({ type: "DASHBOARD" });
  });

  it("routes explicit apply commands without treating a bare number as an application", () => {
    expect(routeWhatsAppCandidateIntent("apply 2")).toEqual({ type: "APPLY", index: 2 });
    expect(routeWhatsAppCandidateIntent("apply job #3")).toEqual({ type: "APPLY", index: 3 });
  });

  it("understands common English and Hinglish job-search phrases", () => {
    expect(routeWhatsAppCandidateIntent("show me jobs in Delhi")).toEqual({ type: "FIND_JOBS" });
    expect(routeWhatsAppCandidateIntent("mujhe naukri chahiye")).toEqual({ type: "FIND_JOBS" });
    expect(routeWhatsAppCandidateIntent("my application status")).toEqual({ type: "APPLICATION_STATUS" });
  });

  it("fails closed to unknown rather than executing an action", () => {
    expect(routeWhatsAppCandidateIntent("delete my account")).toEqual({ type: "UNKNOWN" });
  });
});


describe("Meta Click-to-WhatsApp attribution sanitization", () => {
  it("preserves bounded campaign identifiers without retaining the sender number", () => {
    const sanitized = sanitizeRawPayload({
      id: "wamid.123",
      from: "919876543210",
      type: "text",
      text: { body: "Hi" },
      referral: {
        source_type: "ad",
        source_id: "120000000000001",
        source_url: "https://www.facebook.com/ads/example",
        headline: "Find your next job",
        body: "Join HireGo",
        ctwa_clid: "click-123",
      },
    }) as Record<string, any>;

    expect(sanitized.from).toBe("9198***210");
    expect(sanitized.referral.source_id).toBe("120000000000001");
    expect(sanitized.referral.ctwa_clid).toBe("click-123");
    expect(JSON.stringify(sanitized)).not.toContain("919876543210");
  });
});
