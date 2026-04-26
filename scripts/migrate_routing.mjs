import fs from 'fs';
import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.{tsx,ts}");

const sourceFiles = project.getSourceFiles();

let filesChanged = 0;

for (const sourceFile of sourceFiles) {
    let changed = false;
    const rrdImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === 'react-router-dom');

    if (rrdImport) {
        changed = true;
        
        // Add "use client" if it's a TSX file and doesn't have it
        if (sourceFile.getExtension() === '.tsx' && !sourceFile.getFullText().includes('"use client"')) {
            sourceFile.insertStatements(0, '"use client";\n');
        }

        const importedNames = rrdImport.getNamedImports().map(i => i.getName());
        const nextNavigationImports = [];
        const nextLinkImports = [];

        // Determine what to import
        if (importedNames.includes('useNavigate')) {
            nextNavigationImports.push('useRouter');
        }
        if (importedNames.includes('useParams')) {
            nextNavigationImports.push('useParams');
        }
        if (importedNames.includes('useLocation')) {
            nextNavigationImports.push('usePathname');
        }
        if (importedNames.includes('Link') || importedNames.includes('NavLink')) {
            nextLinkImports.push('Link');
        }

        // Remove react-router-dom import completely
        // Wait, what if there are Routes, Route? We ignore them for now as they are only in App.tsx typically.
        if (sourceFile.getBaseName() !== 'App.tsx' && sourceFile.getBaseName() !== 'main.tsx') {
           rrdImport.remove();
        }

        // Add next/navigation import
        if (nextNavigationImports.length > 0 && sourceFile.getBaseName() !== 'App.tsx') {
            sourceFile.addImportDeclaration({
                moduleSpecifier: 'next/navigation',
                namedImports: nextNavigationImports
            });
        }

        // Add next/link import
        if (nextLinkImports.length > 0 && sourceFile.getBaseName() !== 'App.tsx') {
            sourceFile.addImportDeclaration({
                moduleSpecifier: 'next/link',
                defaultImport: 'Link'
            });
        }
    }

    // Replace usages in the AST / Text
    let text = sourceFile.getFullText();
    
    if (changed) {
        // 1. useNavigate -> useRouter
        text = text.replace(/useNavigate/g, 'useRouter');
        text = text.replace(/const\s+navigate\s*=\s*useRouter\(\)/g, 'const router = useRouter()');
        
        // 2. navigate('/path') -> router.push('/path')
        text = text.replace(/navigate\(\s*(-1)\s*\)/g, 'router.back()');
        text = text.replace(/navigate\(([^,]+?),\s*\{\s*replace:\s*true\s*\}\)/g, 'router.replace($1)');
        // Match navigate('/path', { state: ... }) -> we'll drop state for now, it's complex 
        text = text.replace(/navigate\(/g, 'router.push(');
        
        // 3. Link to= -> Link href=
        text = text.replace(/<Link([^>]+?)to=/g, '<Link$1href=');
        
        // NavLink
        text = text.replace(/<NavLink/g, '<Link');
        text = text.replace(/<\/NavLink>/g, '</Link>');
        text = text.replace(/<Link([^>]+?)to=/g, '<Link$1href=');
        
        // 4. useLocation -> usePathname
        text = text.replace(/useLocation/g, 'usePathname');
        text = text.replace(/const\s+location\s*=\s*usePathname\(\)/g, 'const pathname = usePathname()');
        text = text.replace(/location\.pathname/g, 'pathname');
        text = text.replace(/const\s+\{\s*pathname\s*\}\s*=\s*usePathname\(\)/g, 'const pathname = usePathname()');

        // Note: For NextJS 15 `useParams()` returns a Promise OR an object, NextJS types say object? Actually since Next.js 14 it's `useParams()`. In Next 15 `params` prop in layouts is a Promise, but hook `useParams` is still synchronous for client components. Let's keep it as is.
        // Also note: Next router.push doesn't accept state natively in the same way, but it should be ok for standard routing. 

        sourceFile.replaceWithText(text);
        filesChanged++;
    }
}

project.saveSync();
console.log(`Updated ${filesChanged} files for Next.js routing!`);
