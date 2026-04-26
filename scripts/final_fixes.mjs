import fs from 'fs';

const fixes = [
  {
    file: 'src/components/Layout.tsx',
    replacements: [
      { from: /<Outlet[\s\S]*?\/>/, to: '{children}' }
    ]
  },
  {
    file: 'src/app/community/communities/page.tsx',
    replacements: [
      { from: /setSearchParams\(\{ query: e\.target\.value \}\)/g, to: "router.push(`?query=${e.target.value}`)" },
      { from: /setSearchParams\(\{\}\)/g, to: "router.push('?')" }
    ]
  },
  {
    file: 'src/app/auth/page.tsx',
    replacements: [
      { from: /'..\/..\/..\/..\/assets/g, to: "'../../../assets" },
      { from: /navigate\(/g, to: "router.push(" }
    ]
  },
  {
    file: 'src/app/staff/console/page.tsx',
    replacements: [
      { from: /'..\/..\/..\/..\/assets/g, to: "'../../../assets" },
      { from: /navigate\(/g, to: "router.push(" }
    ]
  },
  {
    file: 'src/app/admin/console/page.tsx',
    replacements: [
      { from: /navigate\(/g, to: "router.push(" }
    ]
  },
  {
    file: 'src/app/zetsuguide-ai/page.tsx',
    replacements: [
      { from: /state=\{\{ prefilledDescription: [^}]+\}\}/g, to: "" }
    ]
  },
  {
    file: 'src/components/SubscriptionRenewAd.tsx',
    replacements: [
      { from: /navigate\(/g, to: "router.push(" }
    ]
  },
  {
    file: 'src/app/verify-email/page.tsx',
    replacements: [
      { from: /navigate\(/g, to: "router.push(" }
    ]
  },
  {
    file: 'src/app/(main)/reportbug/page.tsx',
    replacements: [
      { from: /location\.state/g, to: "null" },
      { from: /const pathname = usePathname\(\);/g, to: "" }
    ]
  },
  {
    file: 'src/app/(main)/[username]/workspace/page.tsx',
    replacements: [
      { from: /username\.replace/g, to: "(username as string).replace" }
    ]
  },
  {
    file: 'src/app/(main)/guide/[slug]/page.tsx',
    replacements: [
      { from: /getUserProfile\(slug\)/g, to: "getUserProfile(slug as string)" },
      { from: /getGuide\(slug\)/g, to: "getGuide(slug as string)" }
    ]
  },
  {
    file: 'src/app/community/group/[id]/page.tsx',
    replacements: [
      { from: /\(id\)/g, to: "(id as string)" },
      { from: /id \|\|/g, to: "(id as string) ||" },
      { from: /id, user\.id/g, to: "(id as string), user.id" }
    ]
  },
  {
    file: 'src/app/community/profile/[username]/page.tsx',
    replacements: [
      { from: /username\)/g, to: "username as string)" }
    ]
  },
  {
    file: 'src/app/community/post/[id]/page.tsx',
    replacements: [
      { from: /id\), user/g, to: "id as string), user" },
      { from: /\(id\)/g, to: "(id as string)" },
      { from: /id,/g, to: "id as string," }
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
    console.log(`Updated ${fix.file}`);
  }
}
