const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\RaAz\\.gemini\\antigravity\\brain\\eb0d8c77-5685-4988-8d8d-5d664efaa344\\.system_generated\\steps\\2300\\output.txt', 'utf8');
const data = JSON.parse(raw);

const gSeriesSpecs = [
  { id: 'G01', titleKeyword: 'Platform Settings Hub', route: '/settings/hub' },
  { id: 'G02', titleKeyword: 'Security & Compliance Dashboard', route: '/settings/security' },
  { id: 'G03', titleKeyword: 'Domain & SSL Settings', route: '/settings/domain' },
  { id: 'G04', titleKeyword: 'SMTP Email Configuration', route: '/settings/smtp' },
  { id: 'G05', titleKeyword: 'WhatsApp API Configuration', route: '/settings/whatsapp' },
  { id: 'G06', titleKeyword: 'Payment Gateway Configuration', route: '/settings/payment-gateway' },
  { id: 'G07', titleKeyword: 'API & Integrations Hub', route: '/settings/integrations' },
  { id: 'G08', titleKeyword: 'LLM Cost & Usage Monitor', route: '/settings/llm-usage' },
  { id: 'G09', titleKeyword: 'System Audit Log', route: '/settings/audit-log' },
  { id: 'G10', titleKeyword: 'AI Agent Manager', route: '/settings/ai-agents' },
  { id: 'G11', titleKeyword: 'Plan Management', route: '/settings/plan-management' },
  { id: 'G12', titleKeyword: 'Platform Analytics Hub', route: '/settings/analytics' },
  { id: 'G13', titleKeyword: 'Terms of Service & Privacy Policy', route: '/settings/terms-privacy' }
];

const cfSeriesSpecs = [
  { id: 'CF01', titleKeyword: 'Inbox - Messages', route: '/messages' },
  { id: 'CF02', titleKeyword: 'Notifications Center', route: '/notifications' },
  { id: 'CF03', titleKeyword: 'Career Analytics Dashboard', route: '/ai/career-prediction' },
  { id: 'CF04', titleKeyword: 'AI Resume Score', route: '/ai/resume-score' },
  { id: 'CF05', titleKeyword: 'Skill Gap Analysis', route: '/ai/skill-gap' },
  { id: 'CF06', titleKeyword: 'AI Practice Hub', route: '/ai/practice-hub' },
  { id: 'CF07', titleKeyword: 'Active Mock Interview', route: '/ai/mock-interview/active' },
  { id: 'CF08', titleKeyword: 'Communication Coach Active', route: '/ai/coach/active' },
  { id: 'CF09', titleKeyword: 'Gamification Leaderboard', route: '/leaderboard' },
  { id: 'CF10', titleKeyword: 'Referral Program Dashboard', route: '/referrals' }
];

console.log('=== G-SERIES STITCH MAPPING (G1-G13) ===');
gSeriesSpecs.forEach(spec => {
  const match = data.screens.find(s => s.title.toLowerCase().includes(spec.titleKeyword.toLowerCase()));
  if (match) {
    console.log(`${spec.id} | ${match.title} | ${match.name} | ${spec.route}`);
  } else {
    console.log(`${spec.id} | ${spec.titleKeyword} (Generated) | N/A | ${spec.route}`);
  }
});

console.log('\n=== CF-SERIES STITCH MAPPING (CF1-CF10) ===');
cfSeriesSpecs.forEach(spec => {
  const match = data.screens.find(s => s.title.toLowerCase().includes(spec.titleKeyword.toLowerCase()));
  if (match) {
    console.log(`${spec.id} | ${match.title} | ${match.name} | ${spec.route}`);
  } else {
    console.log(`${spec.id} | ${spec.titleKeyword} (Generated) | N/A | ${spec.route}`);
  }
});
