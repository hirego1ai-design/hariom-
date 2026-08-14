const fs = require('fs');
const path = require('path');

const appDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app';

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const pageFiles = getAllFiles(appDir);

pageFiles.forEach((fp) => {
  let content = fs.readFileSync(fp, 'utf8');

  // Check if file has an unclosed wrapping div from the previous script
  if (content.includes('return (\n    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">')) {
    // Add missing closing </div> before final closing brace
    content = content.replace(/(\s*)\);\s*}\s*$/g, '$1  </div>\n);\n}');
    fs.writeFileSync(fp, content);
  }
});

console.log('Fixed all JSX closing tags across app pages.');
