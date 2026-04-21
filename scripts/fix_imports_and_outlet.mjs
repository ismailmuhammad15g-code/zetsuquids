import fs from 'fs';

const fixes = [
  {
    file: 'src/components/Layout.tsx',
    replacements: [
      { from: /<Outlet[^>]*\/>/g, to: '{children}' }
    ]
  },
  {
    file: 'src/components/community/CommunityLayout.tsx',
    replacements: [
      { from: /<Outlet[^>]*\/>/g, to: '{children}' }
    ]
  },
  {
    file: 'src/app/community/communities/page.tsx',
    replacements: [
        { from: 'const [searchParams] = useSearchParams()', to: 'const searchParams = useSearchParams()' },
        { from: 'const [searchParams, setSearchParams] = useSearchParams()', to: 'const searchParams = useSearchParams()' }
    ]
  },
  {
    file: 'src/app/auth/page.tsx',
    replacements: [
        { from: 'const [searchParams, setSearchParams] = useSearchParams()', to: 'const searchParams = useSearchParams()' },
        { from: 'searchParams.get', to: 'searchParams?.get' }
    ]
  },
  {
    file: 'src/app/reset-password/page.tsx',
    replacements: [
        { from: 'const [searchParams, setSearchParams] = useSearchParams()', to: 'const searchParams = useSearchParams()' },
        { from: 'searchParams.get', to: 'searchParams?.get' }
    ]
  }
];

for (const fix of fixes) {
  if (fs.existsSync(fix.file)) {
    let text = fs.readFileSync(fix.file, 'utf8');
    for (const r of fix.replacements) {
        if (typeof r.from === 'string') {
           text = text.split(r.from).join(r.to);
        } else {
           text = text.replace(r.from, r.to);
        }
    }
    
    // Auto import Next.js hooks
    if (text.includes('useSearchParams()') && !text.includes('import { useSearchParams } ')) {
         text = 'import { useSearchParams } from "next/navigation";\n' + text;
    }

    fs.writeFileSync(fix.file, text);
    console.log(`Updated ${fix.file}`);
  }
}
