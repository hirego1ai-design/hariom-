const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Stopping active node processes...');
  execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' });
} catch (e) {
  // Ignore if no process to kill
}

try {
  console.log('Clearing .next cache directory...');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('.next cache deleted successfully.');
  }
} catch (e) {
  console.error('Failed to clear .next directory:', e.message);
}
