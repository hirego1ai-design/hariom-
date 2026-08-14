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
    } else if (file === 'page.tsx' || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const pageFiles = getAllFiles(appDir);

pageFiles.forEach((fp) => {
  let content = fs.readFileSync(fp, 'utf8');
  
  if (content.includes('"use client"') || content.includes("'use client'")) {
    // Remove all existing use client directives
    content = content.replace(/["']use client["'];?\s*/g, '');
    // Prepend "use client"; at line 1
    content = `"use client";\n` + content;
    fs.writeFileSync(fp, content);
  }
});

console.log('Fixed "use client" placement across all app pages.');
