import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all .ts files in a directory
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace .ts extensions in import statements with .js
  const fixedContent = content.replace(/(from\s+['"].*?)\.ts(['"])/g, '$1.js$2')
                             .replace(/(from\s+['"].*?)(['"])/g, (match, p1, p2) => {
                                // Skip external modules and absolute paths
                                if (!p1.includes('./') && !p1.includes('../')) {
                                  return match;
                                }
                                // Skip if already has an extension
                                if (p1.endsWith('.js') || p1.endsWith('.mjs') || p1.endsWith('.cjs')) {
                                  return match;
                                }
                                return `${p1}.js${p2}`;
                              });
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`Fixed imports in ${filePath}`);
  }
}

// Main function
function main() {
  const srcDir = path.join(__dirname, 'src');
  const tsFiles = findTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files`);
  
  tsFiles.forEach(file => {
    fixImportsInFile(file);
  });
  
  console.log('Done fixing imports');
}

main(); 