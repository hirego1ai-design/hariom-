const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results.push(...searchDir(fullPath, pattern));
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.json') || file.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (pattern.test(content) || pattern.test(file.name)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const rootDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src';
console.log('Searching for G1-G13 or CF1-CF10...');
const matchesG = searchDir(rootDir, /G1|G2|G3|G4|G5|G6|G7|G8|G9|G10|G11|G12|G13|CF1|CF2|CF3|CF4|CF5|CF6|CF7|CF8|CF9|CF10/i);
console.log('Matches:', matchesG);
