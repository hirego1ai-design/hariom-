const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\RaAz\\.gemini\\antigravity\\brain\\eb0d8c77-5685-4988-8d8d-5d664efaa344\\.system_generated\\steps\\2300\\output.txt', 'utf8');
const data = JSON.parse(raw);

console.log('Searching for SI1-SI3 and LM1-LM7 screens in Stitch output...');

data.screens.forEach((s, idx) => {
  const t = s.title.toLowerCase();
  if (
    t.includes('infrastructure') ||
    t.includes('system') ||
    t.includes('integration') ||
    t.includes('log') ||
    t.includes('license') ||
    t.includes('legal') ||
    t.includes('model') ||
    t.includes('llm') ||
    t.includes('security') ||
    t.includes('monitor') ||
    t.includes('audit') ||
    t.includes('proctor')
  ) {
    console.log(`[${idx + 1}] "${s.title}" -> ID: ${s.name}`);
  }
});
