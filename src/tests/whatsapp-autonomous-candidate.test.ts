import { describe, expect, it } from "vitest";
import { routeWhatsAppCandidateIntent } from "@/lib/whatsapp-candidate-assistant";

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
