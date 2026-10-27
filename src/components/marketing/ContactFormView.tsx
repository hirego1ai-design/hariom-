"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Mail,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Send,
  Check,
  MessageSquare,
  Briefcase,
  Zap,
} from "lucide-react";
import { PUBLIC_BUSINESS_DETAILS } from "@/lib/publicBusinessDetails";

const TOPIC_PRESETS: Record<string, { label: string; badge: string; desc: string }> = {
  "flat-charge-hiring": {
    label: "Fixed Flat Charge Plan",
    badge: "FLAT CHARGE CONSULTATION",
    desc: "Discuss role complexity and volume to set a locked flat fee per hire, immune to CTC inflation.",
  },
  "managed-hiring": {
    label: "Standard Managed Hire (8.33%)",
    badge: "100% CONTINGENT",
    desc: "100% outcome-based hiring with standard 1-month CTC equivalent, 45-day warranty, strictly pay on joining.",
  },
  "tech-hiring": {
    label: "Tech & Specialist Hire (10%)",
    badge: "TECH ROLES",
    desc: "Software Engineers, PMs, and Tech Leads with proctored coding sandboxes and video resume proof.",
  },
  "executive-search": {
    label: "Executive & Leadership Search",
    badge: "CONFIDENTIAL SEARCH",
    desc: "Senior partner-led headhunting for VP, CTO, and C-Suite leadership across US, UAE, and India.",
  },
  "enterprise-hiring": {
    label: "Enterprise Volume Hiring",
    badge: "MNC SOLUTION",
    desc: "Zero-risk recruitment pipeline with custom SLAs, compliance audits, and dedicated talent desk.",
  },
  "software-plans": {
    label: "Software & AI Co-Pilot Plans",
    badge: "SOFTWARE PLATFORM",
    desc: "Self-serve job posting packages or AI Hiring Co-Pilot automated workflow routing.",
  },
  general: {
    label: "General Inquiry",
    badge: "TALENT DESK",
    desc: "Ask our team about platform capabilities, partnership opportunities, or billing questions.",
  },
};

export default function ContactFormView() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic") || "general";

  const [selectedTopic, setSelectedTopic] = useState<string>(
    TOPIC_PRESETS[topicParam] ? topicParam : "flat-charge-hiring"
  );

  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [timeline, setTimeline] = useState("immediate");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (topicParam && TOPIC_PRESETS[topicParam]) {
      setSelectedTopic(topicParam);
    }
  }, [topicParam]);

  const activeTopicInfo = TOPIC_PRESETS[selectedTopic] || TOPIC_PRESETS.general;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate instantaneous Apple-smooth dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 700);
  };

  return (
    <div className="relative overflow-hidden bg-[#01050b] text-white py-8 sm:py-12">
      {/* Subtle Apple-style Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-gradient-to-b from-blue-600/15 via-cyan-600/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-[600px] -right-32 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ─── Compact Notion-Style Header ─── */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-cyan-300 shadow-sm backdrop-blur-md mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>HIREGO STRATEGY &amp; TALENT DESK</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Let’s talk about your next hire.
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Schedule a 15-minute consultation with our talent leadership or share your hiring requirement. Job-ready shortlists ready in minutes.
          </p>
        </div>

        {/* ─── Split Screen Apple / Notion Interface ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Notion-Style Context & Direct Channels (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Active Topic Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                  <Sparkles className="h-3 w-3" />
                  {activeTopicInfo.badge}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">● Available Now</span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">
                {activeTopicInfo.label}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeTopicInfo.desc}
              </p>

              {/* Guarantees List */}
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span><strong>Turnaround:</strong> Calibrated dossiers in minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Warranty:</strong> 45 to 90 days free replacement</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span><strong>Payment:</strong> Invoice Day 25 · Strict Net-30</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span><strong>Zero Risk:</strong> 100% strictly pay on joining</span>
                </div>
              </div>
            </div>

            {/* Notion-Style Quick Contact Cards */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-lg backdrop-blur-md space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                DIRECT COMMUNICATION CHANNELS
              </span>

              {/* Email Employer Support */}
              <a
                href="mailto:employers@hiregoai.com"
                className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-cyan-400/40 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Employer Talent Desk</span>
                    <span className="text-[11px] text-slate-400">employers@hiregoai.com</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* General Inquiries */}
              <a
                href={`mailto:${PUBLIC_BUSINESS_DETAILS.supportEmail}`}
                className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-cyan-400/40 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Enterprise Support &amp; Billing</span>
                    <span className="text-[11px] text-slate-400">{PUBLIC_BUSINESS_DETAILS.supportEmail}</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* Headquarters Location */}
              <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] text-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Headquarters &amp; Global Operations</span>
                    <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                      {PUBLIC_BUSINESS_DETAILS.postalAddress}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SLA Pill */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Response SLA: Under 15 Minutes
              </span>
              <span className="font-mono text-[10px] text-slate-400">9 AM – 9 PM IST</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Apple-Grade Interactive Form (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              {submitted ? (
                /* Instant Success State */
                <div className="text-center py-10 space-y-5">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xl shadow-emerald-500/20">
                    <Check className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                    Consultation Request Confirmed.
                  </h3>

                  <p className="max-w-md mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Thank you, <strong className="text-white">{fullName || "there"}</strong>! Our senior talent leadership team has received your request regarding the <strong className="text-cyan-300">{activeTopicInfo.label}</strong>.
                  </p>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300 max-w-md mx-auto text-left space-y-1.5">
                    <div>✓ <strong>Dedicated Partner Assigned:</strong> Reviewing role criteria</div>
                    <div>✓ <strong>Response SLA:</strong> We will reach out at <span className="text-cyan-300">{workEmail}</span> within 15 minutes</div>
                    <div>✓ <strong>Meeting Calendar Link:</strong> Check your inbox for direct calendar invites</div>
                  </div>

                  <div className="pt-4 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setSubmitted(false)}
                      className="rounded-xl border border-white/15 px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
                    >
                      Submit Another Requirement
                    </button>
                    <Link
                      href="/pricing"
                      className="rounded-xl bg-white text-slate-950 px-5 py-2.5 text-xs font-bold hover:bg-slate-100 transition shadow-md"
                    >
                      View All Pricing Plans
                    </Link>
                  </div>
                </div>
              ) : (
                /* The Apple / Notion Interactive Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      Start Your Hiring Consultation
                    </h2>
                    <p className="text-xs text-slate-400">
                      Fill out the brief requirements below to get matched or discuss custom terms.
                    </p>
                  </div>

                  {/* Notion-Style Topic Selector Pills */}
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-2">
                      Select Topic / Plan Model:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(TOPIC_PRESETS).slice(0, 6).map(([key, item]) => {
                        const isSelected = selectedTopic === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setSelectedTopic(key)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-cyan-400 bg-cyan-950/40 text-white shadow-md shadow-cyan-500/10"
                                : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                            }`}
                          >
                            <span className="text-[10px] font-mono text-cyan-400 block font-semibold">
                              {item.badge}
                            </span>
                            <span className="text-xs font-bold block truncate mt-0.5">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inputs Grid: Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        placeholder="rahul@company.com"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Inputs Grid: Company & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Tech"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Role & Requirements to Hire */}
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                      Roles to Hire / Tech Stack *
                    </label>
                    <input
                      type="text"
                      required
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. 2x Senior Go Backend Developers, 1x Staff Architect"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    />
                  </div>

                  {/* Target Timeline */}
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                      Target Hiring Timeline:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "immediate", label: "Immediate (1–2 weeks)" },
                        { id: "30days", label: "Within 30 Days" },
                        { id: "exploring", label: "Planning / Q1 Pipeline" },
                      ].map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => setTimeline(t.id)}
                          className={`py-2 px-2.5 rounded-lg border text-center text-[11px] font-semibold transition-all ${
                            timeline === t.id
                              ? "border-emerald-400 bg-emerald-950/40 text-emerald-200"
                              : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-white"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes / Message */}
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                      Special Requirements or Context (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share salary budget, experience level, remote/hybrid preference, or questions about the Flat Fix Charge plan..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 px-6 py-3.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 shadow-xl shadow-white/10 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Connecting with Talent Team...</span>
                      ) : (
                        <>
                          <Send className="h-4 w-4 text-blue-600" />
                          <span>Request 15-Minute Strategy Meeting</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 font-mono pt-1">
                    🔒 Zero upfront fees · Strictly pay on candidate joining date · Net-30 terms
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
