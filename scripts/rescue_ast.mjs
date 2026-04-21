import fs from 'fs';
import path from 'path';
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

const sourceFiles = project.getSourceFiles("src/pages/**/*.tsx");

let moved = 0;
for (const sf of sourceFiles) {
    const oldPath = sf.getFilePath();
    
    // We want to extract what comes after 'src/app/'
    // E.g., 'D:/new/zetsuquids/src/pages/community/src/app/community/explore/page.tsx' -> '/src/app/community/explore/page.tsx'
    const appIndex = oldPath.lastIndexOf('/src/app/');
    if (appIndex !== -1) {
        const newPath = oldPath.substring(0, oldPath.indexOf('/src/pages/')) + oldPath.substring(appIndex);
        if (oldPath !== newPath) {
            sf.move(newPath);
            moved++;
            console.log(`[AST] Rescued ${oldPath} -> ${newPath}`);
        }
    } else {
        console.log(`[IGNORE] ${oldPath}`);
    }
}

console.log("Saving rescued files...");
project.saveSync();
console.log(`Rescued ${moved} files!`);
