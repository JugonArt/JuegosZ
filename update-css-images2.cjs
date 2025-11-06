const { globby } = require('globby');
const fs = require('fs').promises;
const path = require('path');

// Función para verificar si un archivo existe
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Función para procesar cada archivo CSS
async function processCSSFile(filePath) {
    try {
        console.log(`Procesando: ${filePath}`);
        let content = await fs.readFile(filePath, 'utf-8');
        
        // Encontrar todas las declaraciones de background con url()
        const urlRegex = /background(?:-image)?\s*:\s*url\(['"]?([^'"()]+)['"]?\)([\s\S]*?;)/g;
        let match;
        let newContent = content;
        const replacements = [];

        while ((match = urlRegex.exec(content)) !== null) {
            const [fullMatch, imagePath, restOfRule] = match;
            // Ignorar si ya es AVIF o si ya tiene @supports
            if (imagePath.endsWith('.avif') || fullMatch.includes('@supports')) {
                continue;
            }

            // Construir la ruta absoluta de la imagen
            const cssDir = path.dirname(filePath);
            const imageAbsPath = path.resolve(cssDir, imagePath);
            
            // Construir la ruta del archivo AVIF
            const avifPath = imageAbsPath.replace(/\.(png|jpg|jpeg|webp|jfif)$/, '.avif');
            const avifRelPath = path.relative(cssDir, avifPath).replace(/\\/g, '/');

            // Verificar si existe el archivo AVIF
            if (await fileExists(avifPath)) {
                const originalRule = fullMatch;
                const avifRule = `${fullMatch}\n  @supports (background-image: url()) and (format: avif) {\n    background-image: url('${avifRelPath}');\n  }`;
                replacements.push([originalRule, avifRule]);
            }
        }

        // Aplicar todos los reemplazos
        for (const [oldText, newText] of replacements) {
            newContent = newContent.replace(oldText, newText);
        }

        // Solo escribir si hubo cambios
        if (newContent !== content) {
            await fs.writeFile(filePath, newContent, 'utf-8');
            console.log(`✓ Actualizado: ${filePath}`);
        } else {
            console.log(`→ Sin cambios necesarios: ${filePath}`);
        }

    } catch (error) {
        console.error(`Error procesando ${filePath}:`, error);
    }
}

async function main() {
    try {
        // Encontrar todos los archivos CSS
        const cssFiles = await globby(['src/**/*.css', 'src/**/*.module.css']);
        
        // Procesar cada archivo
        for (const file of cssFiles) {
            await processCSSFile(file);
        }
        
        console.log('¡Proceso completado!');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();