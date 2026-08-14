const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/employer/**/*.tsx');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/maxLength="(\d+)"/gi, 'maxLength={$1}');
  content = content.replace(/onChange="[^"]*"/gi, 'onChange={(e) => {}}');
  fs.writeFileSync(file, content);
});
console.log('Done fixing more JSX attributes!');
