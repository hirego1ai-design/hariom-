const fs = require('fs');
let code = fs.readFileSync('src/app/employer/full-candidate-profile-employer-view/page.tsx', 'utf8');

// Replace style={{ background: T.cardAlt, borderColor: T.border }} -> className="..."
code = code.replace(/style=\{\{\s*background:\s*T\.cardAlt,\s*borderColor:\s*T\.border\s*\}\}/g, 'className="bg-surface-container-high border-outline"');
code = code.replace(/style=\{\{\s*background:\s*T\.card,\s*borderColor:\s*T\.border\s*\}\}/g, 'className="bg-surface-container border-outline"');
code = code.replace(/style=\{\{\s*borderColor:\s*T\.border\s*\}\}/g, 'className="border-outline"');
code = code.replace(/style=\{\{\s*color:\s*T\.textPrimary\s*\}\}/g, 'className="text-text-primary"');
code = code.replace(/style=\{\{\s*color:\s*T\.textSecondary\s*\}\}/g, 'className="text-text-secondary"');
code = code.replace(/style=\{\{\s*color:\s*T\.textMuted\s*\}\}/g, 'className="text-text-muted"');

fs.writeFileSync('src/app/employer/full-candidate-profile-employer-view/page.tsx', code);
