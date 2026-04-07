const fs = require('fs');
const path = require('path');

const dir = 'c:\\Projetos\\Henrique\\Nexo-Hub\\src\\pages';
function getFiles(dirPath, filesOut = []) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesOut);
    } else if (fullPath.endsWith('.jsx')) {
      filesOut.push(fullPath);
    }
  }
  return filesOut;
}

const allFiles = getFiles(dir);

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/<div(?:[^>]*)>.*Carregando.*?<\/div>/gi, '<LoadingFallback />');
    content = content.replace(/<p(?:[^>]*)>.*Carregando.*?<\/p>/gi, '<LoadingFallback />');

    if (content !== original) {
        const depth = file.split(path.sep).length - dir.split(path.sep).length + 1;
        const relativePathToSrc = '../'.repeat(depth);
        const importStr = `import LoadingFallback from '${relativePathToSrc}components/Common/LoadingFallback';\n`;

        if (!content.includes('import LoadingFallback from')) {
             content = content.replace(/import /, importStr + 'import ');
        }

        fs.writeFileSync(file, content);
        console.log('Updated:', file);
    }
})
