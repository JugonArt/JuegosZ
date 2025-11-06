// fix-imports.js
const fs = require('fs');
const path = require('path');

// Carpeta raíz de tu proyecto
const SRC_DIR = path.join(__dirname, 'src');

function getFiles(dir, files_) {
  files_ = files_ || [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else if (name.endsWith('.js') || name.endsWith('.jsx')) {
      files_.push(name);
    }
  }
  return files_;
}

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex para detectar imports sin extensión
  const importRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"]/g;

  content = content.replace(importRegex, (match, p1, p2) => {
    // Si ya tiene extensión, no hacemos nada
    if (/\.(js|jsx|ts|tsx)$/.test(p2)) return match;

    // Determinar la ruta absoluta del import
    const dir = path.dirname(filePath);
    const fullPathJs = path.join(dir, p2 + '.js');
    const fullPathJsx = path.join(dir, p2 + '.jsx');

    let newImportPath = p2;

    if (fs.existsSync(fullPathJs)) {
      newImportPath += '.js';
    } else if (fs.existsSync(fullPathJsx)) {
      newImportPath += '.jsx';
    } else {
      console.warn(`No se encontró el archivo para el import: ${p2} en ${filePath}`);
    }

    return `import ${p1} from '${newImportPath}'`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

const allFiles = getFiles(SRC_DIR);
allFiles.forEach(fixImports);

console.log('✅ Todos los imports han sido procesados.');
