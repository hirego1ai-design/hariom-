const fs = require('fs');
let code = fs.readFileSync('src/app/employer/full-candidate-profile-employer-view/page.tsx', 'utf8');

// 1. Remove T constant definition
code = code.replace(/\/\* --- Premium High-Contrast Design Tokens --- \*\/\s*const T = \{[\s\S]*?\};\s*/g, '');

// 2. Replace Card component
code = code.replace(/const Card = \(\{ children, className = \"\", id, hover = false \}: \{ children: React\.ReactNode; className\?: string; id\?: string; hover\?: boolean \}\) => \(\s*<div\s*id=\{id\}\s*className=\{\ounded-\[\$\{T\.radius\}\] p-6 md:p-8 \$\{hover \? \"hover:-translate-y-0\.5 transition-all duration-200\" : \"\"\} \$\{className\}\\}\s*style=\{\{\s*background: T\.card,\s*border: \1px solid \$\{T\.border\}\,\s*boxShadow: T\.shadow,\s*\}\}\s*>\s*\{children\}\s*<\/div>\s*\);/g, 
\const Card = ({ children, className = "", id, hover = false }: { children: React.ReactNode; className?: string; id?: string; hover?: boolean }) => (
  <div
    id={id}
    className={\\\glass-card rounded-card p-6 md:p-8 \ \\\\}
  >
    {children}
  </div>
);\);

// 3. Replace SectionHeader
code = code.replace(/const SectionHeader = \(\{ icon, color, title, action \}: \{ icon: string; color: string; title: string; action\?: React\.ReactNode \}\) => \(\s*<div className=\"flex items-center justify-between mb-6 pb-2\" style=\{\{ borderBottom: \1px solid \$\{T\.border\}\ \}\}>\s*<div className=\"flex items-center gap-3\">\s*<div className=\"w-10 h-10 rounded-\[12px\] flex items-center justify-center shadow-inner\" style=\{\{ background: \\$\{color\}1A\, border: \1px solid \$\{color\}30\ \}\}>\s*<span className=\"material-symbols-outlined text-\[22px\]\" style=\{\{ color \}\}>\{icon\}<\/span>\s*<\/div>\s*<h2 className=\"text-\[20px\] font-bold tracking-tight\" style=\{\{ color: T\.textPrimary \}\}>\{title\}<\/h2>\s*<\/div>\s*\{action\}\s*<\/div>\s*\);/g,
\const SectionHeader = ({ icon, colorClass, bgClass, borderClass, title, action }: { icon: string; colorClass: string; bgClass: string; borderClass: string; title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-6 pb-2 border-b border-outline">
    <div className="flex items-center gap-3">
      <div className={\\\w-10 h-10 rounded-xl flex items-center justify-center shadow-inner \ \\\\}>
        <span className={\\\material-symbols-outlined text-[22px] \\\\}>{icon}</span>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-text-primary">{title}</h2>
    </div>
    {action}
  </div>
);\);

// Now replace usages of SectionHeader to pass colorClass, bgClass, borderClass instead of hex colors
code = code.replace(/<SectionHeader icon="person" color=\{T\.blue\} title="Professional Overview" \/>/g, \<SectionHeader icon="person" colorClass="text-secondary" bgClass="bg-secondary/10" borderClass="border-secondary/30" title="Professional Overview" />\);
code = code.replace(/<SectionHeader icon="psychology" color=\{T\.blue\} title="AI Career Intelligence Summary"/g, \<SectionHeader icon="psychology" colorClass="text-secondary" bgClass="bg-secondary/10" borderClass="border-secondary/30" title="AI Career Intelligence Summary"\);
code = code.replace(/<SectionHeader icon="code" color=\{T\.blueDark\} title="Core Competencies & Skills" \/>/g, \<SectionHeader icon="code" colorClass="text-secondary-container" bgClass="bg-secondary-container/10" borderClass="border-secondary-container/30" title="Core Competencies & Skills" />\);
code = code.replace(/<SectionHeader icon="work" color=\{T\.yellow\} title="Professional Experience" \/>/g, \<SectionHeader icon="work" colorClass="text-yellow" bgClass="bg-yellow/10" borderClass="border-yellow/30" title="Professional Experience" />\);
code = code.replace(/<SectionHeader icon="folder" color=\{T\.purple\} title="Notable Projects" \/>/g, \<SectionHeader icon="folder" colorClass="text-tertiary" bgClass="bg-tertiary/10" borderClass="border-tertiary/30" title="Notable Projects" />\);
code = code.replace(/<SectionHeader icon="school" color=\{T\.blue\} title="Education & Qualifications" \/>/g, \<SectionHeader icon="school" colorClass="text-secondary" bgClass="bg-secondary/10" borderClass="border-secondary/30" title="Education & Qualifications" />\);
code = code.replace(/<SectionHeader icon="verified" color=\{T\.green\} title="Licenses & Certifications" \/>/g, \<SectionHeader icon="verified" colorClass="text-green" bgClass="bg-green/10" borderClass="border-green/30" title="Licenses & Certifications" />\);
code = code.replace(/<SectionHeader icon="quiz" color=\{T\.red\} title="Assessment Performance" \/>/g, \<SectionHeader icon="quiz" colorClass="text-primary" bgClass="bg-primary/10" borderClass="border-primary/30" title="Assessment Performance" />\);
code = code.replace(/<SectionHeader icon="analytics" color=\{T\.green\} title="AI Hiring Score™ Breakdown" \/>/g, \<SectionHeader icon="analytics" colorClass="text-green" bgClass="bg-green/10" borderClass="border-green/30" title="AI Hiring Score™ Breakdown" />\);
code = code.replace(/<SectionHeader icon="lightbulb" color=\{T\.yellow\} title="AI Next-Step Recommendations" \/>/g, \<SectionHeader icon="lightbulb" colorClass="text-yellow" bgClass="bg-yellow/10" borderClass="border-yellow/30" title="AI Next-Step Recommendations" />\);
code = code.replace(/<SectionHeader icon="timeline" color=\{T\.purpleDark\} title="Recent Platform Activity" \/>/g, \<SectionHeader icon="timeline" colorClass="text-tertiary-container" bgClass="bg-tertiary-container/10" borderClass="border-tertiary-container/30" title="Recent Platform Activity" />\);
code = code.replace(/<SectionHeader icon="bar_chart" color=\{T\.blue\} title="Candidate Analytics & Reach" \/>/g, \<SectionHeader icon="bar_chart" colorClass="text-secondary" bgClass="bg-secondary/10" borderClass="border-secondary/30" title="Candidate Analytics & Reach" />\);

// Replace T.textPrimary -> text-text-primary
code = code.replace(/style=\{\{\s*color:\s*T\.textPrimary\s*\}\}/g, 'className="text-text-primary"');
code = code.replace(/style=\{\{\s*color:\s*T\.textSecondary\s*\}\}/g, 'className="text-text-secondary"');
code = code.replace(/style=\{\{\s*color:\s*T\.textMuted\s*\}\}/g, 'className="text-text-muted"');

// 4. Update the outermost div to remove inline styles and use simple Fragment or classes
code = code.replace(/<div className="min-h-screen pb-20 relative" style=\{\{ background: T\.pageBg, color: T\.textPrimary \}\}>/g, '<div className="pb-20 relative text-on-surface">');

// 5. Update AI Analysis cards
code = code.replace(/style=\{\{ background: T\.cardAlt, borderColor: T\.border \}\}/g, 'className="bg-surface-container-high border border-outline"');
code = code.replace(/style=\{\{ borderColor: T\.border \}\}/g, 'className="border-outline"');

// 6. T.blue to text-secondary
code = code.replace(/style=\{\{ color: T\.blue \}\}/g, 'className="text-secondary"');
code = code.replace(/style=\{\{ color: T\.blueDark \}\}/g, 'className="text-secondary-container"');
code = code.replace(/style=\{\{ color: T\.green \}\}/g, 'className="text-green"');
code = code.replace(/style=\{\{ color: T\.yellow \}\}/g, 'className="text-yellow"');
code = code.replace(/style=\{\{ color: T\.red \}\}/g, 'className="text-primary"');
code = code.replace(/style=\{\{ background: T\.blueDark \}\}/g, 'className="bg-secondary-container"');
code = code.replace(/style=\{\{ background: T\.blue \}\}/g, 'className="bg-secondary"');
code = code.replace(/style=\{\{ background: T\.cardAlt, borderColor: T\.borderLight \}\}/g, 'className="bg-surface-container-high border border-outline-variant"');
code = code.replace(/style=\{\{ borderColor: T\.borderLight \}\}/g, 'className="border-outline-variant"');

fs.writeFileSync('src/app/employer/full-candidate-profile-employer-view/page.tsx', code);
console.log('Script pass 1 applied');
