const fs = require('fs');
const path = require('path');

const gSeriesFolderMap = [
  { id: 'G1', path: 'platform-settings-hub' },
  { id: 'G2', path: 'security-and-compliance-dashboard' },
  { id: 'G3', path: 'domain-and-ssl-settings' },
  { id: 'G4', path: 'smtp-email-configuration' },
  { id: 'G5', path: 'whatsapp-api-configuration' },
  { id: 'G6', path: 'payment-gateway-configuration' },
  { id: 'G7', path: 'api-and-integrations-hub' },
  { id: 'G8', path: 'llm-cost-and-usage-monitor' },
  { id: 'G9', path: 'system-audit-log' },
  { id: 'G10', path: 'ai-agent-manager' },
  { id: 'G11', path: 'plan-management' },
  { id: 'G12', path: 'platform-analytics-hub' },
  { id: 'G13', path: 'terms-of-service-and-privacy-policy' }
];

const empDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\employer';

gSeriesFolderMap.forEach(item => {
  const fullP = path.join(empDir, item.path, 'page.tsx');
  const exists = fs.existsSync(fullP);
  console.log(`${item.id} (${item.path}): ${exists ? 'EXISTS' : 'MISSING'}`);
});
