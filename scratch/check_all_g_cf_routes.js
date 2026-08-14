const fs = require('fs');
const path = require('path');

const gRoutes = [
  'settings',
  'settings/security',
  'settings/notifications',
  'employer/platform-settings-hub',
  'employer/security-and-compliance-dashboard',
  'employer/domain-and-ssl-settings',
  'employer/smtp-email-configuration',
  'employer/whatsapp-api-configuration',
  'employer/payment-gateway-configuration',
  'employer/api-and-integrations-hub',
  'employer/llm-cost-and-usage-monitor',
  'employer/system-audit-log',
  'employer/ai-agent-manager',
  'employer/plan-management',
  'employer/platform-analytics-hub',
  'employer/terms-of-service-and-privacy-policy'
];

const cfRoutes = [
  'messages',
  'messages/chat',
  'notifications',
  'ai/career-insights',
  'ai/career-prediction',
  'ai/resume-score',
  'profile/resume/optimize',
  'ai/skill-gap',
  'profile/passport',
  'ai/practice-hub',
  'ai/mock-interview/setup',
  'ai/mock-interview/active',
  'ai/mock-interview/summary',
  'ai/coach/active',
  'ai/coach/results',
  'leaderboard',
  'referrals',
  'referrals/dashboard'
];

const appDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app';

console.log('--- Checking G-Series Routes ---');
gRoutes.forEach(r => {
  const p = path.join(appDir, r, 'page.tsx');
  console.log(`${r}: ${fs.existsSync(p) ? 'EXISTS' : 'MISSING'}`);
});

console.log('\n--- Checking CF-Series Routes ---');
cfRoutes.forEach(r => {
  const p = path.join(appDir, r, 'page.tsx');
  console.log(`${r}: ${fs.existsSync(p) ? 'EXISTS' : 'MISSING'}`);
});
