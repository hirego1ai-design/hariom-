const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\RaAz\\.gemini\\antigravity\\brain\\eb0d8c77-5685-4988-8d8d-5d664efaa344\\.system_generated\\steps\\2300\\output.txt', 'utf8');
const data = JSON.parse(raw);

console.log(`Total screens in project: ${data.screens.length}`);
data.screens.forEach((s, idx) => {
  console.log(`${idx + 1}. Title: "${s.title}" | ID: ${s.name}`);
});
