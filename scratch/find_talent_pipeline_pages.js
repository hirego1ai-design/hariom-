const fs = require('fs');
const path = require('path');

const employerDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\employer';

function scanFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanFiles(filePath);
    } else if (file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('Talent Pipeline') || content.includes('Enterprise Portal')) {
        console.log(`Found match in: ${path.relative(employerDir, filePath)}`);
      }
    }
  });
}

scanFiles(employerDir);
