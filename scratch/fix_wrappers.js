const fs = require('fs');
const pages = [
  'src/app/employer/employer-registration-business-model/page.tsx',
  'src/app/employer/employer-registration-plan-selection/page.tsx',
  'src/app/employer/employer-registration-otp-verification/page.tsx',
  'src/app/employer/employer-registration-complete/page.tsx'
];
pages.forEach(p => {
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('min-h-screen bg-background')) return;
  content = content.replace(/<\s*>\s*{\/\*/, '<div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-background">\n      {/*');
  content = content.replace(/<\/\s*>\s*$/, '</div>\n');
  fs.writeFileSync(p, content);
});
