const fs = require('fs');
const path = require('path');

function searchAll(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      searchAll(p);
    } else {
      const txt = fs.readFileSync(p, 'utf8');
      if (txt.includes('G1') || txt.includes('G13') || txt.includes('CF1') || txt.includes('CF10')) {
        console.log('Found match in:', p);
      }
    }
  }
}

searchAll('C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src');
