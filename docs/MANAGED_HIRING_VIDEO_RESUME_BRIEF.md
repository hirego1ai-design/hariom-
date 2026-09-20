# HireGo AI: Managed Hiring and Video Resume build brief

## Objective

Make the public website understandable to people who are hiring and people looking for work. Lead with **Managed Hiring — Pay Per Hire**, HireGo's primary service and revenue model. Explain the commercial promise as a fee linked to a successful hire under an agreed employer contract; do not invent a percentage, fixed price, replacement guarantee, or universal fee trigger. Present the platform and AI as useful supporting tools, not the main story.

## What the current repository actually supports

- Candidate video resumes can be recorded or uploaded as MP4 or WebM, with a server-side duration limit of 120 seconds and an upload limit of 10 MB.
- A background worker may produce a transcript and descriptive speech or recording metrics. Subjective appearance, confidence and professionalism scoring has been removed from the current worker and report. The report can be pending, completed, failed or blocked by missing infrastructure. Do not promise instant analysis or universal availability.
- The status endpoint authorizes candidate access and employer/recruiter access through an application to that employer's company. Employer playback requires that same application scope at the stored-file endpoint.
- Camera/microphone access must be requested on a candidate click. The client upload limit must match the 10 MB server limit, and any local-only clearing action must not be labeled as file deletion.
- `retentionExpiresAt` exists in the database but is not consistently populated or enforced for the underlying file. Do not publish a fixed retention promise until cleanup is implemented and verified.

## Audience and message hierarchy

1. Employer: "Tell us whom you need. We help source, coordinate and manage the process. You make the hiring decision. Pay Per Hire fees follow the successful hire event in your agreement."
2. Candidate: "Show more than a PDF. A short video lets you introduce your experience, explain a project and demonstrate how you communicate. A person should review the video and relevant job evidence in context."
3. Supporting platform: sourcing, assessments, scheduling and AI summaries reduce repetitive work when useful. Do not imply the entire hiring process runs without people.

## Candidate video resume requirements

- Ask for job relevant information: preferred role, experience, strongest skills, one specific project or result, and what the candidate wants employers to understand. Keep the recording prompt short and optional.
- Show accepted formats and the real limits: MP4/WebM, maximum 2 minutes, maximum 10 MB unless the backend limits change.
- Explain before upload what will be stored, that a transcript/report may be generated, who can review it, and how to contact HireGo for access, correction, alternative format or deletion.
- Ask for camera/microphone permission only after a candidate chooses Record. Upload must work without camera access.
- Provide preview, replace, clear status and accessible keyboard controls. A Delete label must correspond to a real server-side deletion action; otherwise use "Remove from view" and explain it does not delete the saved file.
- Present report status honestly, including unavailable or failed analysis. Never turn missing analysis into a negative candidate signal.

## What a video can and cannot show

Useful, directly observable evidence includes how a person describes their experience, role-related knowledge stated in their own words, the structure of an explanation, examples of communication, spoken language where relevant to a role, and the recording's audio quality. A transcript and speech pace can help a reviewer find relevant parts quickly.

Do not claim that appearance, facial expression, accent, eye contact, posture, voice pitch or a model's "confidence" score establishes honesty, personality, emotional state, professionalism, disability status or job suitability. Employers need a human review, job-related criteria and an alternative path for candidates whose disability, equipment or environment affects video presentation. The product should remove or relabel unsupported inferences and avoid using video metrics as an automatic rejection rule.

## Public pages and visual direction

- Home: add a clear Managed Hiring section near the top and link to Services. Show an employer, HireGo's hiring team, a candidate and the decision handoff in a simple, centered visual. Use short copy, smaller headings and HireGo's blue/cyan/violet palette.
- Services: lead with Managed Hiring and the Pay Per Hire model. Move AI-agent architecture below the people and process story. Add a concise video resume section linking to a dedicated page.
- Solutions: show when managed support is a fit for startups, growth and high-volume teams. Make Pay Per Hire commercially clear.
- Video Resume: dedicated public explainer with candidate benefit, employer benefit, candidate requirements, preview/report illustration and privacy controls. Mark product visuals as illustrative.
- Navigation and footer: make Managed Hiring and Video Resume discoverable. Center visual icons and use branded color accents, with adequate contrast in light and dark sections.
- Keep imagery human-centered without fabricated customers, endorsements, team photos, outcome statistics or claims of certification.

## Privacy, terms and SEO

- Replace placeholder `/privacy` and `/terms` with substantive, plain-language pages that disclose video and transcript processing, sharing, human review, candidate requests and Pay Per Hire agreement terms. Have company counsel verify entity identity, jurisdiction, provider details, retention, billing terms and enforceability before publication.
- Link the relevant policy at the point of video submission. Do not make a nonfunctional deletion promise.
- Keep a sitemap of public, indexable routes including `/video-resume`, `/services`, `/solutions`, `/privacy` and `/terms`; exclude private dashboards, APIs and account routes.
- Give the new page unique metadata, canonical URL and descriptive alt text. Avoid claims of automated candidate selection.

## Acceptance checks

1. Public routes render visible content at desktop and mobile widths; headings do not crowd the viewport.
2. Managed Hiring and Pay Per Hire are findable from Home, Services, navigation and footer.
3. Video Resume copy explains what candidates provide, what employers see, analysis limitations and human control.
4. Candidate upload limit and prompt match the backend; the UI does not ask for camera permission on load or imply a local-only clear is deletion.
5. Privacy, Terms, robots and sitemap render; no private route is in the sitemap.
6. TypeScript, targeted lint and production build pass.

## Research used for safeguards

- [India's Digital Personal Data Protection Rules, 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) require a clear notice that itemizes personal data and purpose, subject to phased commencement.
- [EEOC guidance on AI and disability](https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada) warns that assessment tools can disadvantage applicants with disabilities and points to reasonable accommodation.
- [UK ICO guidance on automated recruitment decisions](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/03/here-s-what-jobseekers-need-to-know-about-automated-recruitment-decisions/) emphasizes transparency and meaningful human review. These sources inform product safeguards; they are not a claim that one policy automatically satisfies every jurisdiction.
