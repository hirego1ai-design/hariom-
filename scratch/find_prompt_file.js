const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\RaAz\\.gemini\\antigravity\\brain\\eb0d8c77-5685-4988-8d8d-5d664efaa344\\.system_generated\\steps\\2300\\output.txt', 'utf8');
const data = JSON.parse(raw);

const promptScreen = data.screens.find(s => s.title.includes('STITCH_PROMPT'));

if (promptScreen) {
  console.log('Found Prompt Screen:', promptScreen.title);
  console.log('Download URL:', promptScreen.htmlCode.downloadUrl);
} else {
  console.log('Prompt screen not found in output');
}
