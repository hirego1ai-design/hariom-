const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src';

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allFiles = getAllFiles(srcDir);
let fixedCount = 0;

allFiles.forEach((fp) => {
  let content = fs.readFileSync(fp, 'utf8');

  // Replace any occurrence of class= or classname= in any format
  const newContent = content
    .replace(/class=\\"/g, 'className=\\"')
    .replace(/class=\\'/g, "className=\\'")
    .replace(/classname=\\"/g, 'className=\\"')
    .replace(/classname=\\'/g, "className=\\'")
    .replace(/\bclass=/g, 'className=')
    .replace(/\bclassname=/g, 'className=');

  if (newContent !== content) {
    fs.writeFileSync(fp, newContent);
    fixedCount++;
  }
});

console.log(`Replaced all occurrences of 'class=' and 'classname=' in ${fixedCount} files.`);
