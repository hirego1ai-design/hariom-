const fs = require('fs');
const path = require('path');

const compDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\components';

function findComponents(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(findComponents(p));
    } else if (item.name.endsWith('.tsx')) {
      results.push(p);
    }
  }
  return results;
}

const comps = findComponents(compDir);
console.log('Components Found:');
comps.forEach(c => console.log(path.relative(compDir, c)));
