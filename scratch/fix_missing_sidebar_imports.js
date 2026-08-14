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
  let updated = false;

  if (content.includes('<CandidateSidebar') && !content.includes('CandidateSidebar')) {
    content = `import CandidateSidebar from "@/components/candidate/CandidateSidebar";\n` + content;
    updated = true;
  } else if (content.includes('<CandidateSidebar') && !content.includes('import CandidateSidebar')) {
    content = `import CandidateSidebar from "@/components/candidate/CandidateSidebar";\n` + content;
    updated = true;
  }

  if (content.includes('<AdminSidebar') && !content.includes('import AdminSidebar')) {
    content = `import AdminSidebar from "@/components/admin/AdminSidebar";\n` + content;
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(fp, content);
  }
});

console.log('Fixed missing sidebar import statements.');
