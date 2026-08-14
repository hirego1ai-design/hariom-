const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src';

function getAllTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const tsxFiles = getAllTsxFiles(srcDir);
let fixedCount = 0;

tsxFiles.forEach((fp) => {
  let content = fs.readFileSync(fp, 'utf8');
  let modified = false;

  if (content.includes(' class=')) {
    content = content.replace(/ class=/g, ' className=');
    modified = true;
  }
  if (content.includes(' onclick=')) {
    content = content.replace(/ onclick=/g, ' onClick=');
    modified = true;
  }
  if (content.includes(' for=')) {
    content = content.replace(/ for=/g, ' htmlFor=');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fp, content);
    fixedCount++;
  }
});

console.log(`Converted DOM properties from 'class' to 'className' across ${fixedCount} files.`);
