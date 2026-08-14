const fs = require('fs');
const path = require('path');

const appDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app';

const auditResults = {
  totalRoutes: 0,
  candidateRoutes: 0,
  adminRoutes: 0,
  employerRoutes: 0,
  otherRoutes: 0,
  fixedWithRail: [],
  alreadyHasRail: [],
  excludedAuth: []
};

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
auditResults.totalRoutes = pageFiles.length;

pageFiles.forEach((fp) => {
  const relativePath = path.relative(appDir, fp).replace(/\\/g, '/');
  let content = fs.readFileSync(fp, 'utf8');

  // Skip simple auth entry points like login, register, forgot-password unless requested
  if (
    relativePath === 'login/page.tsx' ||
    relativePath === 'register/page.tsx' ||
    relativePath === 'forgot-password/page.tsx' ||
    relativePath.startsWith('forgot-password/') ||
    relativePath.startsWith('reset-password/')
  ) {
    auditResults.excludedAuth.push(relativePath);
    return;
  }

  const isAdmin = relativePath.startsWith('admin/');
  const isEmployer = relativePath.startsWith('employer/');
  const sidebarComponent = isAdmin ? 'AdminSidebar' : 'CandidateSidebar';
  const sidebarImport = isAdmin
    ? 'import AdminSidebar from "@/components/admin/AdminSidebar";\n'
    : 'import CandidateSidebar from "@/components/candidate/CandidateSidebar";\n';

  let modified = false;

  // Check if file already uses AdminSidebar or CandidateSidebar
  const hasRail = content.includes('AdminSidebar') || content.includes('CandidateSidebar');

  // Strip out hardcoded HTML sidebars from Stitch
  if (content.includes('<!-- Side Navigation Shell -->') || content.includes('<!-- SideNavBar -->') || content.includes('w-[240px]')) {
    content = content.replace(/<!-- Side Navigation Shell -->[\s\S]*?<\/nav>/gi, '');
    content = content.replace(/<!-- SideNavBar -->[\s\S]*?<\/aside>/gi, '');
    content = content.replace(/<nav class="w-\[240px\][\s\S]*?<\/nav>/gi, '');
    content = content.replace(/<aside class="w-\[240px\][\s\S]*?<\/aside>/gi, '');
    content = content.replace(/<main class="ml-\[240px\]/gi, '<main class="ml-[116px]');
    content = content.replace(/<div class="flex-1 md:ml-\[240px\]/gi, '<div class="flex-1 md:ml-[116px]');
    modified = true;
  }

  // Inject sidebar import & component if missing
  if (!hasRail) {
    if (!content.includes('import CandidateSidebar') && !content.includes('import AdminSidebar')) {
      content = sidebarImport + content;
    }

    // Wrap component output in flex container with Rail
    if (content.includes('export default function')) {
      content = content.replace(/return \(\s*<div/i, (match) => {
        return `return (\n    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">\n      <${sidebarComponent} />\n      <div`;
      });
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fp, content);
    auditResults.fixedWithRail.push(relativePath);
  } else {
    auditResults.alreadyHasRail.push(relativePath);
  }

  if (isAdmin) auditResults.adminRoutes++;
  else if (isEmployer) auditResults.employerRoutes++;
  else auditResults.candidateRoutes++;
});

console.log(`Total Routes Processed: ${auditResults.totalRoutes}`);
console.log(`Fixed with Rail Navigation: ${auditResults.fixedWithRail.length}`);
console.log(`Already using Rail Navigation: ${auditResults.alreadyHasRail.length}`);
console.log(`Excluded Auth Routes: ${auditResults.excludedAuth.length}`);
