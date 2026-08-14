const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/employer/**/*.tsx');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/maxlength="(\d+)"/g, 'maxLength={$1}');
  content = content.replace(/minlength="(\d+)"/g, 'minLength={$1}');
  content = content.replace(/onchange=/gi, 'onChange=');
  content = content.replace(/oninput="[^"]*"/gi, 'onInput={() => {}}');
  content = content.replace(/onsubmit="[^"]*"/gi, 'onSubmit={(e) => e.preventDefault()}');
  
  fs.writeFileSync(file, content);
});
console.log('Done fixing more JSX attributes!');
