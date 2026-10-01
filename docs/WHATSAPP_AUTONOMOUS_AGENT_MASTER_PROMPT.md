# HireGo AI — Autonomous WhatsApp + Web Operating Agent Master Prompt

## Mission
Turn WhatsApp from a menu-driven chatbot into a stateful autonomous HireGo operating agent while keeping the website equally primary. A user may start on WhatsApp or web and continue on the other surface without losing canonical account/workflow state.

## Product principles
1. WhatsApp and web are both primary product surfaces. WhatsApp is optimized for low-friction acquisition, onboarding, conversation, quick actions, re-engagement, support, sales and status. The website remains the secure/rich execution surface for assessments, video resume, dashboards, checkout, complex forms and interview rooms.
2. Do not build a second business system inside WhatsApp. Reuse authoritative HireGo services, database records, ROS workflows, payments, referral engine, candidate services, Copilot commerce, assessments and secure auth handoffs.
3. Template/rule/data first, LLM last. Deterministic intent and state handling must cover common actions. Use an LLM only as a bounded fallback classifier for genuinely free-form/ambiguous language. The LLM may select an allowlisted intent but may never directly mutate business state, choose arbitrary tools, invent prices/rewards, or perform consequential actions.
4. Minimum outbound, maximum value. Proactive WhatsApp messages are allowed only for a real pending/high-value next step, with strict idempotency and cooldowns. Do not send repetitive nudges to try to manufacture engagement. A user reply is what creates a fresh user-initiated conversation window.
5. Contextual selling, not spam. Cross-sell only when the current workflow makes the offer useful. Examples:
   - upcoming candidate interview -> offer role-relevant Mock Interview practice;
   - candidate reaches a meaningful milestone -> explain the Referral Program and share the user's real referral link/reward information;
   - employer is actively hiring/manual screening and has no active Copilot -> explain Copilot as an automation option;
   - employer asks for full-service recruitment -> route to Managed Hiring.
   At most one contextual offer should be added to a normal response.
6. Commercial truth comes from live server-side catalog/config. Never hardcode product price, tax, credit cost or referral reward in conversational logic.
7. Secure handoff. For actions that should happen on the website, create a short-lived, single-use WhatsApp auth handoff to an allowlisted internal destination. Never allow arbitrary redirect URLs.
8. Preserve explicit WhatsApp consent and STOP behavior. Never treat inbound activity alone as marketing opt-in.
9. Consequential hiring/financial/destructive actions remain protected by existing approval and authorization boundaries. The conversational agent can prepare/recommend but must not bypass those controls.

## Candidate autonomous journey
Acquisition (Meta CTWA, QR, direct link, organic/direct message) -> identity/onboarding -> profile -> job discovery/matching -> apply -> skill validation/job assessment -> application status -> video resume -> interview readiness/mock interview -> interview/status -> offer/joining updates -> referral program -> support.

The agent should speak conversationally and ask one useful next-step question rather than forcing numbered menus. Menu-style options may remain only as a fallback/accessibility escape hatch.

## Employer autonomous journey
Existing verified employer/recruiter WhatsApp identity -> understand hiring intent -> explain live plans/products -> Copilot contextual sale -> secure employer/Copilot/Managed Hiring handoff -> hiring workflow/status/support. New/unlinked employer leads should be detected as hiring intent and routed into employer acquisition rather than accidentally registered as candidates.

## Referral behavior
Use the existing referral engine and current server-side rules. When useful, the agent can say in natural language that users may earn through qualifying referrals, show their real referral link, real current balance, and current eligible reward values if available. Never guarantee earnings.

## Follow-up policy
After a user-initiated conversation, schedule only a high-value follow-up check. Send at most one in-window nudge when a material pending action still exists, such as a required assessment or near-term interview preparation. If the user has replied since the anchor event, skip. If the action has been completed, skip. If consent is not OPTED_IN, skip. If the conversational window is no longer safely open, skip. Use templates only when the applicable WhatsApp policy requires an approved template.

## Cost policy
- common intents: zero LLM;
- buttons/known commands/status lookups: zero LLM;
- contextual cross-sell selection: zero LLM;
- referral/Copilot prices: database only;
- unknown free-form intent: at most one small bounded classification call;
- classifier failure: deterministic safe fallback, never block core actions.

## Verification gates
Prisma validate/generate, TypeScript, ESLint, unit/regression tests, WhatsApp security boundaries, dependency audit and production build must pass before merge. Preserve webhook HMAC verification, durable event handling, idempotency, opt-out, rate limits, secure handoffs and tenant authorization.
