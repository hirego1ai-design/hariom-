const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src';

function scanFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('html-react-parser')) {
        console.log(`Uses html-react-parser: ${path.relative(srcDir, filePath)}`);
      }
    }
  });
}

scanFiles(srcDir);
