import fs from 'fs';
import path from 'path';
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

const sourceFiles = project.getSourceFiles("src/pages/src/app/**/*.tsx");

let moved = 0;
for (const sf of sourceFiles) {
    // Current path is something like: D:/new/zetsuquids/src/pages/src/app/auth/page.tsx
    // We want it to be: D:/new/zetsuquids/src/app/auth/page.tsx
    
    // We get the file path relative to the root
    const oldPath = sf.getFilePath();
    // Replaces the "src/pages/src/app" part with "src/app"
    const newPath = oldPath.replace(/\/src\/pages\/src\/app\//i, '/src/app/');
    
    if (oldPath !== newPath) {
        sf.move(newPath);
        moved++;
        console.log(`[AST] Re-Moved ${oldPath} -> ${newPath}`);
    }
}

console.log("Saving AST... This automatically fixes relative imports by dropping one directory level!");
project.saveSync();
console.log(`Complete! Fixed imports for ${moved} pages.`);
