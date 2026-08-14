const fs = require('fs');
let code = fs.readFileSync('src/app/employer/full-candidate-profile-employer-view/page.tsx', 'utf8');

const mappings = [
  { old: 'color={T.blue}', colorClass: 'text-secondary', bgClass: 'bg-secondary/10', borderClass: 'border-secondary/30' },
  { old: 'color={T.yellow}', colorClass: 'text-yellow', bgClass: 'bg-yellow/10', borderClass: 'border-yellow/30' },
  { old: 'color={T.green}', colorClass: 'text-green', bgClass: 'bg-green/10', borderClass: 'border-green/30' },
  { old: 'color={T.purple}', colorClass: 'text-tertiary', bgClass: 'bg-tertiary/10', borderClass: 'border-tertiary/30' },
];

mappings.forEach(m => {
  const regex = new RegExp(m.old.replace(/[\{\}\.]/g, '\\\\$&'), 'g');
  code = code.replace(regex, \colorClass="\" bgClass="\" borderClass="\"\);
});

fs.writeFileSync('src/app/employer/full-candidate-profile-employer-view/page.tsx', code);
