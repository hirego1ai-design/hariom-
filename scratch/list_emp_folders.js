const fs = require('fs');

const empDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\employer';
const folders = fs.readdirSync(empDir);
console.log('All folders in src/app/employer:');
console.log(folders.join('\n'));
