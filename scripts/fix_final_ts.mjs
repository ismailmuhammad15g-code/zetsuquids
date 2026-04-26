import fs from 'fs';
import path from 'path';

// Fixes to apply to specific files
const fixes = [
  {
    file: 'src/components/SubscriptionRenewAd.tsx',
    replacements: [
      { from: 'navigate(', to: 'router.push(' },
    ]
  },
  {
    file: 'src/app/admin/console/page.tsx',
    replacements: [
      { from: 'navigate(', to: 'router.push(' },
    ]
  },
  {
    file: 'src/app/auth/page.tsx',
    replacements: [
      { from: "import celebrateAnimation from '../../../../assets/celebrate'", to: "import celebrateAnimation from '../../../assets/celebrate'" },
      { from: 'const [searchParams] = useSearchParams()', to: 'const searchParams = useSearchParams()' },
      { from: 'window.pathname', to: 'window.location.pathname' },
      { from: 'navigate(', to: 'router.push(' },
    ]
  },
  {
    file: 'src/app/reset-password/page.tsx',
    replacements: [
      { from: 'const [searchParams] = useSearchParams()', to: 'const searchParams = useSearchParams()' },
      { from: 'navigate(', to: 'router.push(' },
    ]
  },
  {
    file: 'src/app/staff/console/page.tsx',
    replacements: [
      { from: '../../../../../assets', to: '../../../../assets' },
      { from: 'navigate(', to: 'router.push(' },
    ]
  },
  {
    file: 'src/app/verify-email/page.tsx',
    replacements: [
      { from: 'navigate(', to: 'router.push(' },
    ]
  },
  {
    file: 'src/app/community/communities/page.tsx',
    replacements: [
      { from: 'const [searchParams, setSearchParams] = useSearchParams()', to: 'const searchParams = useSearchParams()' },
    ]
  },
  {
    file: 'src/app/community/group/[id]/page.tsx',
    replacements: [
      { from: /id \|\| ''/g, to: "(id as string) || ''" },
      { from: /id, user\.id\)/g, to: "(id as string), user.id)" },
      { from: /fetchCommunity\(\)/g, to: "fetchCommunity()" }, // trigger match
    ]
  },
  {
    file: 'src/app/community/profile/[username]/page.tsx',
    replacements: [
      { from: /username/g, to: "(username as string)" },
      { from: /\{ \(username as string\) \}/g, to: "{ username }" }, // fix React tree rendering if replaced
      { from: /const \{ \(username as string\) \} = useParams/g, to: "const { username } = useParams" }
    ]
  },
  {
    file: 'src/app/community/post/[id]/page.tsx',
    replacements: [
      { from: /id as string/g, to: "id" }, // reset
      { from: /id/g, to: "(id as string)" },
      { from: /const \{ \(id as string\) \} = useParams/g, to: "const { id } = useParams" },
      { from: /\{ \(id as string\) \}/g, to: "{ id }" }
    ]
  },
  {
    file: 'src/app/(main)/[username]/workspace/page.tsx',
    replacements: [
      { from: /username\.replace/g, to: "(username as string).replace" },
    ]
  },
  {
    file: 'src/app/(main)/guide/[slug]/page.tsx',
    replacements: [
      { from: /slug/g, to: "(slug as string)" },
      { from: /const \{ \(slug as string\) \} = useParams/g, to: "const { slug } = useParams" },
      { from: /\{ \(slug as string\) \}/g, to: "{ slug }" }
    ]
  },
  {
    file: 'src/app/(main)/guides/page.tsx',
    replacements: [
      { from: 'useOutletContext', to: 'null as any' }, // Will remove
    ]
  },
  {
    file: 'src/app/(main)/page.tsx',
    replacements: [
      { from: 'useOutletContext', to: 'null as any' },
    ]
  },
  {
    file: 'src/app/(main)/reportbug/page.tsx',
    replacements: [
      { from: 'state: location.state', to: 'state: null' } 
    ]
  },
  {
    file: 'src/app/zetsuguide-ai/page.tsx',
    replacements: [
      { from: /state=\{\{ prefilledDescription: [^}]+\}\}/, to: '' } // Next Link has no state prop
    ]
  }
];

let changedCount = 0;

for (const fix of fixes) {
  if (fs.existsSync(fix.file)) {
    let content = fs.readFileSync(fix.file, 'utf8');
    let original = content;

    for (const r of fix.replacements) {
      if (typeof r.from === 'string') {
        content = content.split(r.from).join(r.to);
      } else {
        content = content.replace(r.from, r.to);
      }
    }

    if (content !== original) {
      fs.writeFileSync(fix.file, content);
      changedCount++;
      console.log(`[FIX] Updated ${fix.file}`);
    }
  } else {
    console.warn(`[WARN] File not found: ${fix.file}`);
  }
}

// Ensure `useRouter` is correctly replaced for specific nested missed navigate calls
const files = [
    'src/components/SubscriptionRenewAd.tsx',
    'src/app/admin/console/page.tsx',
    'src/app/auth/page.tsx',
    'src/app/staff/console/page.tsx',
    'src/app/verify-email/page.tsx',
    'src/app/reset-password/page.tsx'
];
for(const f of files) {
    if(fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        if (content.includes('navigate(') && !content.includes('const navigate = useRouter()')) {
             if (content.includes('const router = useRouter()')) {
                 content = content.replace(/navigate\(/g, 'router.push(');
             } else {
                 content = content.replace(/useRouter\(\)/, 'useRouter()');
                 content = content.replace(/const navigate =/, 'const router =');
                 content = content.replace(/navigate\(/g, 'router.push(');
             }
             fs.writeFileSync(f, content);
        }
    }
}

console.log(`Complete. Modified ${changedCount} files.`);
