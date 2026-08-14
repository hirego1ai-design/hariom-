const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'c:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/admin-main-dashboard/page.tsx',
  'c:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/candidate-user-management/page.tsx',
  'c:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-company-management/page.tsx',
  'c:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/revenue-and-billing-management/page.tsx',
  'c:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/roles-and-permissions/page.tsx',
  'c:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/system-health-monitor/page.tsx',
];

filesToUpdate.forEach((fp) => {
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(/pl-64/g, 'pl-[116px]').replace(/ml-64/g, 'ml-[116px]');
    fs.writeFileSync(fp, content);
    console.log(`Updated padding in ${path.basename(fp)}`);
  }
});
