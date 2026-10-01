# HireGo Autonomous WhatsApp + Web Orchestrator — Production Master Prompt

## Mission

Transform HireGo from a menu-driven WhatsApp chatbot into a shared autonomous operating layer used by both WhatsApp and the website.

WhatsApp and web are both primary interfaces. WhatsApp is optimized for fast acquisition, conversational onboarding and low-friction follow-up. The website is used for rich and security-sensitive execution such as assessments, video resume upload, employer controls, payments and detailed dashboards. Both channels must share the same canonical database state and never create parallel business truth.

## Operating principles

1. Template-first, deterministic-first. Use rules, database state and approved templates whenever the user's intent is known.
2. LLM-last-resort. Use one bounded low-cost classification call only when deterministic intent routing cannot safely resolve the request. LLM output must be schema-validated and must never directly mutate business state.
3. Minimum outbound, maximum value. Do not send repetitive nudges. Prefer one high-value message tied to a real pending action.
4. A WhatsApp business-initiated message does not extend the 24-hour customer-service window. Only a new user message resets that window. Re-engagement inside the open window should invite a useful reply, never manufacture activity.
5. Outside the customer-service window, free-form proactive messaging is forbidden. Use only approved templates through the communication framework when policy and consent allow.
6. Respect explicit WhatsApp consent and STOP immediately.
7. Never invent pricing, referral income, job match, assessment status or hiring outcomes. Read authoritative values from the database/config.
8. Consequential hiring, financial and destructive actions remain behind existing human-approval controls.

## Candidate autonomous journey

Acquisition can start from Meta Click-to-WhatsApp ads, QR codes, links, offline campaigns or direct WhatsApp messages.

WhatsApp should:
- identify/link the user safely;
- collect onboarding data conversationally;
- find evidence-based matching jobs;
- submit applications through the existing ROS gateway;
- route required assessments to short-lived authenticated website handoffs;
- offer secure video-resume handoff;
- show application and offer status;
- detect upcoming interviews and contextually offer AI Mock Interview practice;
- explain and surface the referral program using live server-side reward rules and the user's real referral link/balance;
- support natural-language requests with deterministic routing first and bounded AI intent classification only as fallback.

## Employer autonomous sales journey

For a new employer lead:
- detect hiring intent from the first message;
- qualify company, role, openings, location, timeline and contact email one question at a time;
- store a durable qualified-lead event without fabricating a customer account;
- explain HireGo products contextually;
- send the employer registration handoff.

For a linked employer:
- act as an AI Sales Manager plus operational assistant;
- show live Copilot plans/prices from the server catalog;
- detect whether Copilot is already active before pitching it;
- route to subscriptions, Copilot, Managed Hiring, jobs and dashboard using secure handoffs;
- recommend Copilot contextually when the employer is doing repetitive manual hiring work;
- never negotiate an unapproved discount or invent commercial terms.

## Contextual cross-sell policy

Candidate:
- Upcoming real interview + no very recent completed mock session -> offer Mock Interview once in context.
- Profile exists but no video resume -> offer Video Resume only at a relevant profile/job-readiness moment.
- Successful meaningful milestone -> referral education may be offered sparingly.

Employer:
- Active jobs / manual screening / coordination without active Copilot -> offer Copilot once in context.
- Bulk or urgent hiring intent -> explain Managed Hiring using approved product facts.
- Existing active Copilot -> do not sell Copilot again; switch to usage/help.

## WhatsApp cost-control / engagement policy

Within an open customer-service window:
- send at most one proactive re-engagement message near window expiry;
- only if the user is opted in;
- only when there is a real pending high-value action;
- suppress if another proactive message was recently sent;
- use idempotency so retries never duplicate a nudge.

Pending high-value actions include:
- required skill/job assessment;
- upcoming scheduled interview;
- accepted/sent offer requiring attention;
- incomplete high-value onboarding action.

The proactive message must ask one useful question or provide one clear next action. It must not claim that sending a business message keeps the 24-hour window open.

## Security

- Preserve webhook HMAC verification, bounded payloads, idempotent inbound events and durable retry behavior.
- Handoff destinations are allowlisted only.
- Do not expose arbitrary redirect URLs.
- LLM receives bounded untrusted text and approved facts only.
- LLM can classify/phrase but cannot authorize or execute side effects.
- Existing agent kill switches, budgets, tenant boundaries and human approvals remain authoritative.

## Acceptance gates

- Candidate deterministic intents and AI fallback tests.
- Employer sales deterministic intents and AI fallback fail-closed tests.
- Secure handoff allowlist tests for mock interview, video resume, referrals and employer pages.
- Re-engagement eligibility tests: consent, 24-hour window, cooldown, real pending action.
- Prisma validate/generate.
- TypeScript.
- ESLint.
- Existing test suite.
- Dependency audit and production build.
