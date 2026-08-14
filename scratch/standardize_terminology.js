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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = getAllFiles(srcDir);
const report = [];

const replacements = [
  { old: /Talent Hub/g, new: 'Hiring Workspace', reason: 'Positioning as enterprise AI Hiring OS workspace' },
  { old: /Talent Pool/g, new: 'Candidate Intelligence', reason: 'Enterprise AI Hiring OS terminology' },
  { old: /Employer Panel/g, new: 'Hiring Workspace', reason: 'Enterprise AI Hiring OS terminology' },
  { old: /Employer Portal/g, new: 'Hiring Workspace', reason: 'Enterprise AI Hiring OS terminology' },
  { old: /Recruiter Panel/g, new: 'Recruiter Workspace', reason: 'Enterprise AI Hiring OS terminology' },
  { old: /Admin Panel/g, new: 'Platform Control Center', reason: 'Enterprise AI Hiring OS platform control center positioning' },
  { old: /Job Board/g, new: 'Opportunities', reason: 'Enterprise AI Hiring OS terminology for candidate positions' },
  { old: /Browse Jobs/g, new: 'Browse Opportunities', reason: 'Standardized candidate navigation label' },
  { old: /Candidate Pool/g, new: 'Candidate Directory', reason: 'Enterprise AI Hiring OS directory terminology' },
  { old: /AI Dashboard/g, new: 'AI Control Center', reason: 'Enterprise AI Hiring OS control center positioning' },
  { old: /HireGo Candidate Portal/g, new: 'HireGo Candidate Workspace', reason: 'Standardized candidate workspace label' },
  { old: /HireGo Admin Console/g, new: 'HireGo Platform Control Center', reason: 'Standardized platform control center label' },
];

files.forEach((fp) => {
  let content = fs.readFileSync(fp, 'utf8');
  let modified = false;

  replacements.forEach((rep) => {
    if (rep.old.test(content)) {
      content = content.replace(rep.old, rep.new);
      modified = true;
      report.push({
        old: rep.old.source.replace(/\\g/g, '').replace(/[\/g]/g, ''),
        new: rep.new,
        file: path.relative(srcDir, fp),
        reason: rep.reason,
      });
    }
  });

  if (modified) {
    fs.writeFileSync(fp, content);
  }
});

console.log(`Standardized terminology across ${report.length} occurrences.`);

// Write Report JSON for documentation
fs.writeFileSync(
  path.join(__dirname, 'terminology_report.json'),
  JSON.stringify(report, null, 2)
);
