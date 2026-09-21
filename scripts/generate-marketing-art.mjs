import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), "public", "marketing");
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const defs = `<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#071629"/><stop offset="1" stop-color="#0d2150"/></linearGradient>
  <linearGradient id="core" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#25c8f0"/><stop offset=".55" stop-color="#386bed"/><stop offset="1" stop-color="#995bf7"/></linearGradient>
  <linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fbff"/><stop offset="1" stop-color="#e9f3ff"/></linearGradient>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="16" stdDeviation="23" flood-color="#041020" flood-opacity=".32"/></filter>
</defs>`;
const svg = (body, w = 1200, h = 900) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>`;
const text = (x, y, value, size = 28, fill = "#e9f3ff", weight = 600, anchor = "start") => `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}">${escape(value)}</text>`;
const line = (x1, y1, x2, y2, opacity = .6) => `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="#4dbfff" stroke-width="3" stroke-opacity="${opacity}" stroke-dasharray="7 8"/>`;
const node = (x, y, label, width = 235, height = 76) => `<g filter="url(#shadow)"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="19" fill="#152e50" stroke="#4a83bb" stroke-opacity=".7"/>${text(x + width / 2, y + height / 2 + 8, label, 21, "#f5fbff", 700, "middle")}</g>`;
const darkBase = `<rect width="1200" height="900" rx="46" fill="url(#background)"/><circle cx="600" cy="435" r="370" fill="#2e6ed8" opacity=".12" filter="url(#glow)"/>`;

const agents = [
  ["Requirement", 44, 104], ["Sourcing", 44, 274], ["Screening", 44, 444], ["Assessment", 44, 614],
  ["Scheduling", 920, 104], ["Interview", 920, 274], ["Follow-up", 920, 444], ["Operations", 920, 614],
];
const agentArt = svg(`${darkBase}<circle cx="600" cy="428" r="164" fill="#1c80ef" opacity=".45" filter="url(#glow)"/>${agents.map(([,x,y])=>line(x<500?279:920,y+38,x<500?500:700,428,.48)).join("")}<circle cx="600" cy="428" r="139" fill="url(#core)" opacity=".2"/><circle cx="600" cy="428" r="106" fill="url(#core)" stroke="#80e6ff" stroke-width="3"/>${text(600,415,"HireGo AI",36,"#fff",800,"middle")}${text(600,452,"Orchestration Core",20,"#d9f5ff",600,"middle")}${agents.map(([label,x,y])=>node(x,y,label)).join("")}<rect x="388" y="776" width="424" height="72" rx="20" fill="#eff9ff"/>${text(600,821,"Human approval → final decision",24,"#154477",700,"middle")}`);

const solutionsLabels = [["Startup",60,176],["Growing team",60,348],["Enterprise",60,520],["High volume",900,256],["Managed hiring",900,490]];
const solutionsArt = svg(`${darkBase}${solutionsLabels.map(([,x,y])=>line(x<500?300:900,y+38,x<500?490:710,444,.5)).join("")}<rect x="454" y="328" width="290" height="232" rx="42" fill="url(#core)" stroke="#a9efff" stroke-width="3" filter="url(#shadow)"/>${text(599,419,"HireGo AI",36,"#fff",800,"middle")}${text(599,460,"Hiring workflow",24,"#e7f8ff",600,"middle")}${solutionsLabels.map(([label,x,y])=>node(x,y,label,240,76)).join("")}<rect x="284" y="748" width="632" height="66" rx="18" fill="#163657" stroke="#6cbaff"/>${text(600,790,"One workflow, adapted to the hiring challenge",22,"#e8f7ff",700,"middle")}`);

const aboutArt = svg(`${darkBase}<rect x="60" y="110" width="1080" height="666" rx="40" fill="#102846" stroke="#4389d0" opacity=".9"/><path d="M160 438 C330 438 360 300 510 300 S700 540 840 540 S990 400 1060 400" fill="none" stroke="#6bdfff" stroke-width="7" stroke-linecap="round" opacity=".7"/><circle cx="610" cy="423" r="170" fill="#2477ff" opacity=".22" filter="url(#glow)"/>${node(126,385,"Employer requirement",260,100)}<rect x="455" y="332" width="305" height="180" rx="40" fill="url(#core)" stroke="#92e9ff" stroke-width="3" filter="url(#shadow)"/>${text(608,409,"HireGo AI",37,"#fff",800,"middle")}${text(608,451,"Workflow orchestration",20,"#e4f8ff",600,"middle")}${node(830,348,"Candidate journey",250,100)}<rect x="787" y="628" width="333" height="73" rx="20" fill="#f5fbff"/>${text(953,672,"Human decision",24,"#164679",800,"middle")}${line(952,448,952,628,.8)}`);

const uiBase = `<rect width="1200" height="900" rx="44" fill="#eff6ff"/><rect x="48" y="48" width="1104" height="804" rx="34" fill="#fff" stroke="#d4e5f5" filter="url(#shadow)"/><rect x="48" y="48" width="1104" height="112" rx="34" fill="#102749"/><rect x="48" y="120" width="1104" height="40" fill="#102749"/>`;
const uiTab = (x,y,label,color="#2866cf")=>`<rect x="${x}" y="${y}" width="220" height="95" rx="22" fill="#f3f7ff" stroke="#dbe6f5"/><circle cx="${x+34}" cy="${y+33}" r="10" fill="${color}"/>${text(x+22,y+69,label,19,"#173a69",700)}`;
const employerUi = svg(`${uiBase}${text(100,114,"Employer Co-Pilot",31,"#fff",800)}${text(100,225,"Active job  /  Backend Engineer",29,"#132e55",800)}${text(100,268,"Illustrative workflow overview",18,"#647893",500)}${uiTab(100,308,"Sourced candidates")}${uiTab(350,308,"Screening")}${uiTab(600,308,"Assessments")}${uiTab(850,308,"Interviews")}<rect x="100" y="446" width="955" height="76" rx="18" fill="#eaf3ff"/>${text(131,494,"Candidate evidence prepared for review",21,"#254667",650)}<rect x="100" y="544" width="955" height="76" rx="18" fill="#eaf3ff"/>${text(131,592,"Interviewer availability requested",21,"#254667",650)}<rect x="100" y="655" width="955" height="115" rx="23" fill="#dff4ff" stroke="#57b2e2" stroke-width="2"/>${text(132,706,"Human approval required",26,"#174a74",800)}${text(132,743,"Hiring team reviews evidence and makes the decision",19,"#476681",500)}`);
const mockUi = svg(`${uiBase}${text(100,114,"HireGo Mock Interview",31,"#fff",800)}${text(100,225,"Practice session  /  Sales role",29,"#132e55",800)}<rect x="100" y="282" width="610" height="385" rx="28" fill="#152947"/><circle cx="405" cy="416" r="78" fill="url(#core)" opacity=".85"/>${text(405,441,"◉",68,"#fff",600,"middle")}${text(136,607,"Camera and microphone ready",22,"#d5eaff",600)}<rect x="735" y="282" width="320" height="385" rx="28" fill="#f1f7ff" stroke="#d6e5f5"/>${text(762,337,"Question 03 / 08",22,"#28558d",700)}${text(762,401,"Describe how you",25,"#163960",700)}${text(762,439,"would handle a",25,"#163960",700)}${text(762,477,"customer objection.",25,"#163960",700)}${text(762,571,"Prepare 00:30",20,"#4b6682",600)}${text(762,610,"Answer 02:00",20,"#4b6682",600)}<rect x="100" y="699" width="955" height="70" rx="19" fill="#deefff"/>${text(132,742,"After practice: preparation insights and next steps",20,"#24537e",700)}`);

const og = (headline, subline) => svg(`<rect width="1200" height="630" fill="url(#background)"/><circle cx="1020" cy="110" r="340" fill="#3d63e4" opacity=".25" filter="url(#glow)"/><circle cx="1040" cy="370" r="180" fill="none" stroke="#5edcff" stroke-width="3" opacity=".5"/><circle cx="1040" cy="370" r="112" fill="url(#core)" opacity=".7"/>${text(90,124,"HireGo AI",34,"#a3eaff",800)}${text(90,318,headline,58,"#fff",800)}${text(90,384,subline,31,"#c7d9ed",500)}<path d="M90 500 H1110" stroke="#4a83ae" opacity=".5"/>${text(90,549,"AI handles operational work. People make hiring decisions.",23,"#d7eafa",600)}`,1200,630);

await mkdir(join(root, "og"), { recursive: true });
const jobs = [
  ["hirego-autonomous-agent-workflow.webp",agentArt],["solutions-by-company-type.webp",solutionsArt],["about-hirego-agentic-hiring.webp",aboutArt],["employer-copilot-workflow.webp",employerUi],["hirego-ai-mock-interview.webp",mockUi],
  ["og/home.webp",og("Connected Hiring Workflows","From requirement to human decision")],["og/services.webp",og("Autonomous Hiring Services","From sourcing to interview orchestration")],["og/solutions.webp",og("AI Hiring Solutions","Built around the way your company hires")],["og/about.webp",og("About HireGo AI","Building the autonomous hiring workflow")],
];
for (const [name,markup] of jobs) {
  await sharp(Buffer.from(markup)).webp({ quality: 88 }).toFile(join(root,name));
  process.stdout.write(`${name}\n`);
}
