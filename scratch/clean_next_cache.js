const fs = require('fs');
const path = require('path');

const target = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\.next';

if (fs.existsSync(target)) {
  console.log('Removing .next cache folder...');
  fs.rmSync(target, { recursive: true, force: true });
  console.log('.next cache folder successfully deleted!');
} else {
  console.log('.next folder does not exist (already clean).');
}
