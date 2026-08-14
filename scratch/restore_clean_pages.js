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
  if (content.includes('className="min-h-screen bg-[#0E0E0E] flex text-text-primary">')) {
    // Revert the malformed automated wrapper line
    content = content.replace(/import CandidateSidebar from "@\/components\/candidate\/CandidateSidebar";\n/g, '');
    content = content.replace(/import AdminSidebar from "@\/components\/admin\/AdminSidebar";\n/g, '');
    content = content.replace(/<div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">\s*<CandidateSidebar \/>\s*<div/g, '<div');
    content = content.replace(/<div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">\s*<AdminSidebar \/>\s*<div/g, '<div');
    fs.writeFileSync(fp, content);
  }
});

console.log('Cleaned up invalid JSX wrappers.');
