const fs = require('fs');
const path = require('path');

const targetPages = [
  'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\interviews\\page.tsx',
  'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\jobs\\page.tsx',
  'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\applications\\page.tsx',
  'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\profile\\page.tsx',
];

targetPages.forEach((filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if CandidateSidebar is imported
  if (!content.includes('CandidateSidebar')) {
    content = `import CandidateSidebar from "@/components/candidate/CandidateSidebar";\n` + content;
  }

  // Remove hardcoded <nav ...> Side Navigation Shell </nav> or <aside ...> SideNavBar </aside>
  content = content.replace(/<!-- Side Navigation Shell -->[\s\S]*?<\/nav>/gi, '');
  content = content.replace(/<!-- SideNavBar -->[\s\S]*?<\/aside>/gi, '');
  content = content.replace(/<nav class="w-\[240px\][\s\S]*?<\/nav>/gi, '');
  content = content.replace(/<aside class="w-\[240px\][\s\S]*?<\/aside>/gi, '');
  content = content.replace(/<main class="ml-\[240px\]/gi, '<main class="ml-[116px]');
  content = content.replace(/<div class="flex-1 md:ml-\[240px\]/gi, '<div class="flex-1 md:ml-[116px]');

  // Inject <CandidateSidebar /> inside the component render before main
  if (!content.includes('<CandidateSidebar />')) {
    content = content.replace(/return \([\s\S]*?<div/i, (match) => {
      return match + ` className="min-h-screen bg-[#0E0E0E] flex">\n      <CandidateSidebar />\n    <div`;
    });
  }

  fs.writeFileSync(filePath, content);
  console.log(`Successfully converted ${path.basename(filePath)} to Floating Navigation Rail!`);
});
