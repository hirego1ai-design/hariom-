const fs = require('fs');
const path = require('path');

const adminDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\admin';

function getAllAdminFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllAdminFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const adminPages = getAllAdminFiles(adminDir);

adminPages.forEach((fp) => {
  let content = fs.readFileSync(fp, 'utf8');

  // Skip login page if applicable
  if (fp.includes('admin\\login\\page.tsx')) return;

  // Replace CandidateSidebar with AdminSidebar if mistakenly used
  content = content.replace(/CandidateSidebar/g, 'AdminSidebar');

  // Ensure AdminSidebar is imported
  if (!content.includes('import AdminSidebar')) {
    content = `"use client";\nimport AdminSidebar from "@/components/admin/AdminSidebar";\n` + content;
  }

  // Ensure "use client"; is at line 1
  content = content.replace(/["']use client["'];?\s*/g, '');
  content = `"use client";\n` + content;

  // Fix margin left to ml-[116px]
  content = content.replace(/ml-64/g, 'ml-[116px]');
  content = content.replace(/pl-64/g, 'ml-[116px]');

  // Fix main padding to pt-24 pb-12
  content = content.replace(/p-gutter space-y-6/g, 'p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto');
  content = content.replace(/p-gutter space-y-4/g, 'p-gutter pt-24 pb-12 space-y-4 max-w-[1600px] w-full mx-auto');

  fs.writeFileSync(fp, content);
  console.log(`Updated admin page: ${path.relative(adminDir, fp)}`);
});

console.log('All Admin routes updated with AdminSidebar Floating Rail and ml-[116px] offset.');
