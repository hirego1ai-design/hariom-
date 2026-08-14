const fs = require('fs');
const path = require('path');

const srcApp = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app';

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDir(filePath, fileList);
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

const allPages = scanDir(srcApp);
let modifiedCount = 0;

allPages.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Remove legacy aside blocks inside rawHtml strings
  if (content.includes('w-[240px]')) {
    // Replace legacy <aside ... </aside>
    const asideRegex = /<aside className=\\"hidden md:flex fixed left-0 top-0 w-\[240px\][\s\S]*?<\/aside>/g;
    if (asideRegex.test(content)) {
      content = content.replace(asideRegex, '');
      changed = true;
    }

    // Replace legacy md:ml-[240px] or md:left-[240px] with ml-[116px] or left-[116px]
    content = content.replace(/md:ml-\[240px\]/g, 'ml-[116px]');
    content = content.replace(/md:left-\[240px\]/g, 'left-[116px]');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Cleaned legacy sidebar from: ${path.relative(srcApp, file)}`);
  }
});

console.log(`Total files cleaned: ${modifiedCount}`);
