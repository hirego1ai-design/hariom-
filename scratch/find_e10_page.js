const fs = require('fs');
const path = require('path');

const appDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app';

function scanAllPages(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanAllPages(filePath);
    } else if (file === 'page.tsx') {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('EmployerPageE10') || content.includes('E10')) {
        console.log(`Matched page: ${path.relative(appDir, filePath)}`);
      }
    }
  });
}

scanAllPages(appDir);
