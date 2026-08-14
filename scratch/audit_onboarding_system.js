const fs = require('fs');
const path = require('path');

const onboardingDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\onboarding';

function listOnboardingPages(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      listOnboardingPages(filePath);
    } else if (file === 'page.tsx') {
      console.log(`Onboarding Route: ${path.relative(onboardingDir, filePath)}`);
    }
  });
}

listOnboardingPages(onboardingDir);
