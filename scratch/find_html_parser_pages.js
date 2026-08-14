const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file === 'page.tsx' || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('html-react-parser') || content.includes('w-[240px]') || content.includes('Enterprise Portal')) {
        console.log(`Found old HTML parser sidebar in: ${fullPath}`);
      }
    }
  });
}

scanDir('C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app');
