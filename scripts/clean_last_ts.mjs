import fs from 'fs';

const fixes = [
  {
    file: 'src/app/(main)/reportbug/page.tsx',
    replacements: [
      { from: 'const pathname = usePathname();', to: '' },
      { from: 'const location = usePathname();', to: '' },
      { from: 'state: location.state', to: 'state: null' } 
    ]
  },
  {
    file: 'src/app/community/group/[id]/page.tsx',
    replacements: [
      { from: /\(id as string\)/g, to: 'id' } // Remove any lingering bad (id as string)
    ]
  },
  {
    file: 'src/app/community/profile/[username]/page.tsx',
    replacements: [
      { from: /\(username as string\)/g, to: 'username' } // Just reset it back completely
    ]
  },
  {
    file: 'src/app/community/post/[id]/page.tsx',
    replacements: [
      { from: /luc\(id as string\)e-react/, to: 'lucide-react' },
      { from: /overflow-h\(id as string\)den/, to: 'overflow-hidden' },
      { from: /Inval\(id as string\) post ID/, to: 'Invalid post ID' }
    ]
  },
  {
    file: 'src/app/(main)/guide/[slug]/page.tsx',
    replacements: [
      { from: /\(slug as string\)/g, to: 'slug' } 
    ]
  },
  {
    file: 'src/app/(main)/[username]/workspace/page.tsx',
    replacements: [
      { from: /\(username as string\)\.replace/g, to: '(username as string).replace' } 
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
    fs.writeFileSync(fix.file, text);
    console.log(`Cleaned ${fix.file}`);
  }
}
