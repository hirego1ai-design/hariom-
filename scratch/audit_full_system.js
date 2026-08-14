const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0';
const srcApp = path.join(projectRoot, 'src', 'app');
const srcComp = path.join(projectRoot, 'src', 'components');
const srcContext = path.join(projectRoot, 'src', 'context');

function scanDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDir(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allAppFiles = scanDir(srcApp);
const pageFiles = allAppFiles.filter(f => f.endsWith('page.tsx') || f.endsWith('page.ts'));
const compFiles = scanDir(srcComp).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
const contextFiles = scanDir(srcContext).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

// Categorize routes
const candidateRoutes = pageFiles.filter(f => !f.includes('\\employer\\') && !f.includes('\\admin\\'));
const employerRoutes = pageFiles.filter(f => f.includes('\\employer\\'));
const adminRoutes = pageFiles.filter(f => f.includes('\\admin\\'));
const apiRoutes = pageFiles.filter(f => f.includes('\\api\\'));

const summary = {
  totalPages: pageFiles.length,
  candidatePages: candidateRoutes.length,
  employerPages: employerRoutes.length,
  adminPages: adminRoutes.length,
  apiRoutes: apiRoutes.length,
  totalComponents: compFiles.length,
  totalContextProviders: contextFiles.length,
};

console.log(JSON.stringify(summary, null, 2));
