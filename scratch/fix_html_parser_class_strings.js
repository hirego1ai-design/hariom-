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
  let modified = false;

  // Replace class= inside rawHtml strings
  if (content.includes('class="')) {
    content = content.replace(/class="/g, 'className="');
    modified = true;
  }
  if (content.includes("class='")) {
    content = content.replace(/class='/g, "className='");
    modified = true;
  }
  if (content.includes('classname=')) {
    content = content.replace(/classname=/g, 'className=');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fp, content);
    fixedCount++;
  }
});

console.log(`Converted raw string 'class=' and 'classname=' to 'className=' across ${fixedCount} files.`);
