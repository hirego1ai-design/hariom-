import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  isAllowedVoiceActionHref,
  pickSafeVoiceNavigation,
} from "../lib/jarvis/JarvisVoiceNavigation";
import { isCandidateVoiceRoute } from "../components/candidate/JarvisVoiceMount";

const read = (relative: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");

test("voice assistant persists inside candidate routes, not login/admin/employer", () => {
  for (const route of [
    "/candidate/jarvis", "/dashboard", "/profile", "/jobs", "/jobs/1",
    "/applications", "/interviews", "/credits", "/ai/mock-interview/setup",
  ]) {
    assert.equal(isCandidateVoiceRoute(route), true, route);
  }
  for (const route of ["/", "/login", "/register", "/employer", "/employer/jobs", "/admin", "/ai/mock-interview/active"]) {
    assert.equal(isCandidateVoiceRoute(route), false, route);
  }
  const layout = read("src/app/layout.tsx");
  assert.ok(layout.includes("<JarvisVoiceMount />"));
});

test("spoken navigation accepts only authorized non-mutating candidate routes", () => {
  assert.equal(pickSafeVoiceNavigation("open my profile", [{ label: "Profile", href: "/profile" }]), "/profile");
  assert.equal(pickSafeVoiceNavigation("show my applications", [{ label: "Applications", href: "/applications" }]), "/applications");
  assert.equal(pickSafeVoiceNavigation("open jobs", [{ label: "Jobs", href: "/jobs" }]), "/jobs");
  assert.equal(pickSafeVoiceNavigation("I want to apply", [{ label: "Applications", href: "/applications" }]), null);
  assert.equal(pickSafeVoiceNavigation("buy credits now", [{ label: "Credits", href: "/credits" }]), null);
  assert.equal(pickSafeVoiceNavigation("show jobs", [
    { label: "One", href: "/jobs/1" },
    { label: "Two", href: "/jobs/2" },
  ]), null);
  assert.equal(pickSafeVoiceNavigation("go to admin", [{ label: "Admin", href: "/admin" }]), null);
  assert.equal(pickSafeVoiceNavigation("open profile", [{ label: "bad", href: "javascript:alert(1)" }]), null);
  assert.equal(isAllowedVoiceActionHref("/admin"), false);
  assert.equal(isAllowedVoiceActionHref("//evil.example"), false);
  assert.equal(isAllowedVoiceActionHref("/profile"), true);
});

test("globe offers automatic VAD turns, spoken output, docking and interruption", () => {
  const globe = read("src/components/candidate/JarvisVoiceGlobe.tsx");
  const css = read("src/app/globals.css");
  assert.ok(globe.includes("getUserMedia"));
  assert.ok(globe.includes("createAnalyser"));
  assert.ok(globe.includes("getFloatTimeDomainData"));
  assert.ok(globe.includes("now - lastSpeech > 1100"));
  assert.ok(globe.includes('"/api/candidate/jarvis/voice/transcribe"'));
  assert.ok(globe.includes('"/api/candidate/jarvis/voice/speech"'));
  assert.ok(globe.includes('"/api/candidate/jarvis"'));
  assert.ok(globe.includes("audio.onended"));
  assert.ok(globe.includes("beginListeningRef.current(generation)"));
  assert.ok(globe.includes("setDocked(true)"));
  assert.ok(globe.includes("router.push(navigation)"));
  assert.ok(globe.includes('aria-label="Interrupt and speak"'));
  assert.ok(css.includes(".jarvis-voice-orb--listening"));
  assert.ok(css.includes(".jarvis-voice-orb--speaking"));
  assert.ok(css.includes(".jarvis-voice-panel--docked"));
  assert.ok(css.includes("prefers-reduced-motion"));
});

test("voice is explicitly permission-gated, terminates on hidden/logout and never trusts external actions", () => {
  const globe = read("src/components/candidate/JarvisVoiceGlobe.tsx");
  const root = read("src/components/candidate/JarvisVoiceMount.tsx");
  assert.ok(globe.includes("onClick={() => { setDocked(false); startSession(); }}"));
  assert.ok(globe.includes("document.visibilityState === \"hidden\""));
  assert.ok(globe.includes("requestRef.current?.abort()"));
  assert.ok(globe.includes("streamRef.current?.getTracks().forEach((track) => track.stop())"));
  assert.ok(globe.includes("sequenceRef.current += 1"));
  assert.ok(globe.includes("isAllowedVoiceActionHref(action.href)"));
  assert.ok(root.includes('pathname.startsWith('));
  assert.ok(!globe.includes("OPENAI_API_KEY"));
  assert.ok(!globe.includes("GEMINI_API_KEY"));
  assert.ok(!globe.includes("localStorage"));
});
