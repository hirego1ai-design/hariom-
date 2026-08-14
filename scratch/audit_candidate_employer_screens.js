const fs = require('fs');
const path = require('path');

const appDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app';

function getAllPages(dir) {
  let pages = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      pages = pages.concat(getAllPages(fullPath));
    } else if (item.name === 'page.tsx') {
      pages.push(fullPath);
    }
  }
  return pages;
}

const allPages = getAllPages(appDir);

console.log(`Total Page Routes Found: ${allPages.length}`);

const candidateRoutes = [];
const employerRoutes = [];
const adminRoutes = [];
const otherRoutes = [];

allPages.forEach(p => {
  const rel = path.relative(appDir, p).replace(/\\/g, '/').replace('/page.tsx', '');
  const route = rel === 'page.tsx' ? '/' : '/' + rel;
  if (route.startsWith('/employer')) {
    employerRoutes.push(route);
  } else if (route.startsWith('/admin')) {
    adminRoutes.push(route);
  } else if (
    route.startsWith('/dashboard') ||
    route.startsWith('/jobs') ||
    route.startsWith('/applications') ||
    route.startsWith('/profile') ||
    route.startsWith('/ai') ||
    route.startsWith('/assessment') ||
    route.startsWith('/interviews') ||
    route.startsWith('/messages') ||
    route.startsWith('/notifications') ||
    route.startsWith('/referrals') ||
    route.startsWith('/leaderboard') ||
    route.startsWith('/onboarding') ||
    route.startsWith('/pricing') ||
    route.startsWith('/video-assessment')
  ) {
    candidateRoutes.push(route);
  } else {
    otherRoutes.push(route);
  }
});

console.log(`\n=== CANDIDATE ROUTES (${candidateRoutes.length}) ===`);
candidateRoutes.sort().forEach(r => console.log(` - ${r}`));

console.log(`\n=== EMPLOYER ROUTES (${employerRoutes.length}) ===`);
employerRoutes.sort().forEach(r => console.log(` - ${r}`));

console.log(`\n=== ADMIN ROUTES (${adminRoutes.length}) ===`);
adminRoutes.sort().forEach(r => console.log(` - ${r}`));

console.log(`\n=== OTHER / AUTH ROUTES (${otherRoutes.length}) ===`);
otherRoutes.sort().forEach(r => console.log(` - ${r}`));
