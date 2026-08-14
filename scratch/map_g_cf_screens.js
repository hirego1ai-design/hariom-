const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\RaAz\\.gemini\\antigravity\\brain\\eb0d8c77-5685-4988-8d8d-5d664efaa344\\.system_generated\\steps\\2300\\output.txt', 'utf8');
const data = JSON.parse(raw);

console.log('Finding G1-G13 Governance & CF1-CF10 Candidate Feature screens...');

const targetKeywords = [
  // G-series (Governance & Config)
  'Platform Settings Hub',
  'Security & Compliance Dashboard',
  'Domain & SSL Settings',
  'SMTP Email Configuration',
  'WhatsApp API Configuration',
  'Payment Gateway Configuration',
  'API & Integrations Hub',
  'LLM Cost & Usage Monitor',
  'System Audit Log',
  'AI Agent Manager',
  'Plan Management',
  'Platform Analytics Hub',
  'Terms of Service & Privacy Policy',
  // CF-series (Candidate Features)
  'Inbox - Messages',
  'Notifications Center',
  'Career Analytics Dashboard',
  'AI Resume Score',
  'Skill Gap Analysis',
  'AI Practice Hub',
  'Active Mock Interview',
  'Communication Coach Active',
  'Gamification Leaderboard',
  'Referral Program Dashboard'
];

data.screens.forEach(s => {
  if (targetKeywords.some(k => s.title.toLowerCase().includes(k.toLowerCase()))) {
    console.log(`MATCH: "${s.title}" -> ${s.name}`);
  }
});
