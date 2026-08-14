"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React from "react";
import Link from "next/link";

const screens = [
  { id: "C1", route: "/", title: "Welcome / Role Selection", flow: "Auth" },
  { id: "C2", route: "/login", title: "Candidate Sign In", flow: "Auth" },
  { id: "C3", route: "/register", title: "Registration Step 1", flow: "Auth" },
  { id: "C4", route: "/otp", title: "OTP Verification", flow: "Auth" },
  { id: "C5", route: "/forgot-password", title: "Forgot Password", flow: "Auth" },
  { id: "C6", route: "/reset-password", title: "Reset Password", flow: "Auth" },
  { id: "C7", route: "/register/complete", title: "Registration Complete", flow: "Auth" },

  { id: "C8", route: "/onboarding", title: "Profile Wizard Entry", flow: "Onboarding" },
  { id: "C9", route: "/onboarding/personal-details", title: "Personal Details", flow: "Onboarding" },
  { id: "C10", route: "/onboarding/preferences", title: "Job Preferences", flow: "Onboarding" },
  { id: "C11", route: "/onboarding/skills", title: "Skills Setup", flow: "Onboarding" },
  { id: "C12", route: "/onboarding/experience", title: "Work Experience", flow: "Onboarding" },
  { id: "C13", route: "/onboarding/education", title: "Education", flow: "Onboarding" },
  { id: "C14", route: "/onboarding/reward", title: "Free Reward", flow: "Onboarding" },
  { id: "C15", route: "/onboarding/matching", title: "Job Matching", flow: "Onboarding" },
  { id: "C16", route: "/onboarding/complete", title: "Profile Complete", flow: "Onboarding" },

  { id: "C17", route: "/dashboard", title: "Candidate Dashboard", flow: "Profile" },
  { id: "C18", route: "/profile", title: "Profile View/Edit", flow: "Profile" },
  { id: "C19", route: "/profile/public", title: "Public Portfolio", flow: "Profile" },
  { id: "C20", route: "/profile/certificates", title: "Achievements & Certificates", flow: "Profile" },
  { id: "C21", route: "/profile/resume", title: "AI Resume Builder", flow: "Profile" },
  { id: "C22", route: "/profile/resume/templates", title: "Resume Templates", flow: "Profile" },
  { id: "C23", route: "/profile/resume/optimize", title: "AI Resume Optimizer", flow: "Profile" },
  { id: "C24", route: "/profile/passport", title: "Skill Passport", flow: "Profile" },

  { id: "C25", route: "/jobs", title: "Job Search", flow: "Jobs" },
  { id: "C26", route: "/jobs/filters", title: "Advanced Filters", flow: "Jobs" },
  { id: "C27", route: "/jobs/1", title: "Job Detail", flow: "Jobs" },
  { id: "C28", route: "/jobs/1/ai-insights", title: "Job AI Insights", flow: "Jobs" },
  { id: "C29", route: "/jobs/recommended", title: "Recommended Jobs", flow: "Jobs" },
  { id: "C30", route: "/jobs/saved", title: "Saved Jobs", flow: "Jobs" },
  { id: "C31", route: "/jobs/compare", title: "Job Comparison", flow: "Jobs" },
  { id: "C32", route: "/jobs/alerts", title: "Job Alerts", flow: "Jobs" },
  { id: "C33", route: "/jobs/suggestions", title: "Search Suggestions", flow: "Jobs" },
  { id: "C34", route: "/jobs/report", title: "Report Job", flow: "Jobs" },

  { id: "C35", route: "/jobs/1/apply", title: "Job Application", flow: "Applications" },
  { id: "C36", route: "/jobs/apply/success", title: "Application Success", flow: "Applications" },
  { id: "C37", route: "/applications", title: "Applications Tracker", flow: "Applications" },
  { id: "C38", route: "/applications/history", title: "Application History", flow: "Applications" },
  { id: "C39", route: "/interviews", title: "Interviews Calendar", flow: "Applications" },
  { id: "C40", route: "/interviews/confirmed", title: "Interview Confirmed", flow: "Applications" },
  { id: "C41", route: "/interviews/reschedule", title: "Interview Reschedule", flow: "Applications" },
  { id: "C42", route: "/offers", title: "Offer Letter Received", flow: "Applications" },
  { id: "C43", route: "/applications/withdraw", title: "Withdraw Application", flow: "Applications" },

  { id: "C44", route: "/ai/resume-score", title: "AI Resume Score", flow: "AI Features" },
  { id: "C45", route: "/ai/career-insights", title: "Career Analytics", flow: "AI Features" },
  { id: "C46", route: "/ai/skill-gap", title: "Skill Gap Analysis", flow: "AI Features" },
  { id: "C47", route: "/ai/practice-hub", title: "AI Practice Hub", flow: "AI Features" },
  { id: "C48", route: "/ai/mock-interview/setup", title: "Mock Interview Setup", flow: "AI Features" },
  { id: "C49", route: "/ai/mock-interview/active", title: "Active Mock Interview", flow: "AI Features" },
  { id: "C50", route: "/ai/mock-interview/summary", title: "Interview Summary", flow: "AI Features" },
  { id: "C51", route: "/ai/coach/active", title: "Communication Coach", flow: "AI Features" },
  { id: "C52", route: "/ai/coach/results", title: "Coach Results", flow: "AI Features" },

  { id: "C53", route: "/assessment/env-check", title: "Environment Check", flow: "Assessments" },
  { id: "C54", route: "/assessment/instructions", title: "Test Instructions", flow: "Assessments" },
  { id: "C55", route: "/assessment/mcq/active", title: "MCQ Test Active", flow: "Assessments" },
  { id: "C56", route: "/assessment/mcq/warning", title: "MCQ Time Warning", flow: "Assessments" },
  { id: "C57", route: "/assessment/mcq/review", title: "MCQ Review", flow: "Assessments" },
  { id: "C58", route: "/assessment/mcq/results", title: "MCQ Results", flow: "Assessments" },
  { id: "C59", route: "/assessment/coding/setup", title: "Coding Test Setup", flow: "Assessments" },
  { id: "C60", route: "/assessment/coding/ide", title: "Coding IDE", flow: "Assessments" },
  { id: "C61", route: "/assessment/coding/results", title: "Coding Results", flow: "Assessments" },
  { id: "C62", route: "/assessment/typing/setup", title: "Typing Test Setup", flow: "Assessments" },
  { id: "C63", route: "/assessment/typing/active", title: "Typing Test Active", flow: "Assessments" },
  { id: "C64", route: "/assessment/typing/results", title: "Typing Results", flow: "Assessments" },
  { id: "C65", route: "/video-assessment/setup", title: "Video Assessment Setup", flow: "Assessments" },
  { id: "C66", route: "/video-assessment/active", title: "Video Assessment Active", flow: "Assessments" },
  { id: "C67", route: "/video-assessment/complete", title: "Video Assessment Complete", flow: "Assessments" },
  { id: "C68", route: "/assessment/coding/running", title: "Coding Test Running", flow: "Assessments" },
  { id: "C69", route: "/assessment/mock-interview/dna", title: "Mock Interview (DNA)", flow: "Assessments" },
  { id: "C70", route: "/assessment/interview-replay", title: "Interview Replay", flow: "Assessments" },

  { id: "C71", route: "/pricing", title: "Pricing & Plans", flow: "Subscriptions" },
  { id: "C72", route: "/checkout", title: "Payment Checkout", flow: "Subscriptions" },
  { id: "C73", route: "/payment/success", title: "Payment Success", flow: "Subscriptions" },
  { id: "C74", route: "/billing", title: "Billing & Subscription", flow: "Subscriptions" },

  { id: "C75", route: "/settings", title: "Settings", flow: "Settings" },
  { id: "C76", route: "/settings/security", title: "Account Security", flow: "Settings" },
  { id: "C77", route: "/notifications", title: "Notifications", flow: "Settings" },
  { id: "C78", route: "/settings/notifications", title: "Notification Settings", flow: "Settings" },
  { id: "C79", route: "/messages", title: "Inbox Messages", flow: "Settings" },
  { id: "C80", route: "/referrals", title: "Referral Program", flow: "Settings" },
  { id: "C81", route: "/leaderboard", title: "Leaderboard", flow: "Settings" },

  { id: "C82", route: "/ai/career-prediction", title: "Career Prediction", flow: "Extended" },
  { id: "C83", route: "/profile/skills-management", title: "Skills Management", flow: "Extended" },
  { id: "C84", route: "/profile/completion", title: "Profile Completion Tracker", flow: "Extended" },
  { id: "C85", route: "/onboarding/welcome", title: "Onboarding Welcome", flow: "Extended" },
  { id: "C86", route: "/onboarding/mock-interview", title: "Onboarding Mock Interview", flow: "Extended" },
  { id: "C87", route: "/onboarding/hire-score", title: "Onboarding Hire Score", flow: "Extended" },
  { id: "C88", route: "/onboarding/checklist", title: "Onboarding Checklist", flow: "Extended" },
  { id: "C89", route: "/profile/wizard/details", title: "Profile Wizard Details", flow: "Extended" },
  { id: "C90", route: "/profile/wizard/resume", title: "Profile Wizard Resume", flow: "Extended" },
  { id: "C91", route: "/applications/pipeline", title: "Application Pipeline", flow: "Extended" },
  { id: "C92", route: "/applications/timeline", title: "Application Timeline", flow: "Extended" },
  { id: "C93", route: "/subscriptions", title: "Subscription Dashboard", flow: "Extended" },
  { id: "C94", route: "/payment/status", title: "Payment Status", flow: "Extended" },
  { id: "C95", route: "/pricing/upgrade", title: "Upgrade Plan", flow: "Extended" },
  { id: "C96", route: "/messages/chat", title: "Chat Screen", flow: "Extended" },
  { id: "C97", route: "/referrals/dashboard", title: "Referral Dashboard", flow: "Extended" },
  { id: "C98", route: "/interviews/replay", title: "Interview Results Report", flow: "Extended" },
  { id: "C99", route: "/forgot-password/otp", title: "Forgot Password OTP", flow: "Extended" },
];

const flowColors: Record<string, string> = {
  Auth: "bg-red-light/20 text-red-light border-red-light/30",
  Onboarding: "bg-yellow/20 text-yellow border-yellow/30",
  Profile: "bg-primary/20 text-primary border-primary/30",
  Jobs: "bg-green/20 text-green border-green/30",
  Applications: "bg-tertiary/20 text-tertiary border-tertiary/30",
  "AI Features": "bg-chat-blue/20 text-chat-blue border-chat-blue/30",
  Assessments: "bg-secondary/20 text-secondary border-secondary/30",
  Subscriptions: "bg-gold-payment/20 text-gold-payment border-gold-payment/30",
  Settings: "bg-on-surface-variant/20 text-on-surface-variant border-on-surface-variant/30",
  Extended: "bg-surface-tint/20 text-surface-tint border-surface-tint/30",
};

export default function ScreenIndexPage() {
  const flows = [...new Set(screens.map((s) => s.flow))];

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="min-h-screen p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      {/* Header */}
      <div className="mb-stack-lg">
        <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-stack-sm">
          HireGo AI — Screen Index
        </h1>
        <p className="font-body-md text-text-secondary">
          All <span className="text-primary font-bold">99 candidate screens</span> (C1–C99) imported from Google Stitch. Click any screen to verify.
        </p>
        <div className="flex flex-wrap gap-2 mt-stack-md">
          {flows.map((flow) => (
            <span
              key={flow}
              className={`px-3 py-1 rounded-full text-label-md font-bold border ${flowColors[flow] || "bg-white/10 text-white border-white/20"}`}
            >
              {flow}
            </span>
          ))}
        </div>
      </div>

      {/* Screen Grid */}
      {flows.map((flow) => {
        const flowScreens = screens.filter((s) => s.flow === flow);
        return (
          <div key={flow} className="mb-stack-lg">
            <h2 className="font-headline-md text-headline-md text-text-primary mb-stack-md flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${flowColors[flow]?.split(" ")[0] || "bg-white/20"}`} />
              {flow}
              <span className="font-data-md text-data-md text-text-muted">({flowScreens.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-stack-md">
              {flowScreens.map((screen) => (
                <Link
                  key={screen.id}
                  href={screen.route}
                  className="glass-card rounded-lg p-gutter group cursor-pointer hover:border-primary/40 hover:shadow-[0_0_20px_rgba(255,180,170,0.1)] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-data-md text-data-md text-primary font-bold">
                      {screen.id}
                    </span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors text-[18px]">
                      open_in_new
                    </span>
                  </div>
                  <p className="font-label-md text-text-primary font-bold leading-tight mb-1">
                    {screen.title}
                  </p>
                  <p className="font-data-md text-text-muted text-[12px] truncate">
                    {screen.route}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="border-t border-white/5 pt-stack-lg mt-stack-lg text-center">
        <p className="font-label-md text-text-muted">
          Total: <span className="text-primary font-bold">{screens.length} screens</span> •
          Built with Google Stitch + Next.js 16 App Router
        </p>
      </div>
    </div>
    </div>
);
}