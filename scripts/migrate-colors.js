const fs = require('fs');
const path = require('path');

const dir = './components';
const colors = [
  'navy', 'orange', 'green', 'red', 'amber', 'slate', 'off', 'mid', 'dark'
];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

walk(dir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    colors.forEach(color => {
      // Replace [--color-wolvio-orange] with wolvio-orange
      const regex = new RegExp(`\\[--color-wolvio-${color}\\]`, 'g');
      content = content.replace(regex, `wolvio-${color}`);
      
      // Replace text-[--color-wolvio-orange] with text-wolvio-orange
      // (This is already covered by the regex above if it matches inside the brackets)
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
    }
  }
});
