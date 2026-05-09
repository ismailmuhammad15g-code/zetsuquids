const fs = require('fs');
const filepath = 'src/app/(main)/stats/page.tsx';
let data = fs.readFileSync(filepath, 'utf8');

// 1. Add Import
if (!data.includes('GettingStartedWizard')) {
    data = data.replace(
        'import Link from "next/link";',
        'import Link from "next/link";\nimport { GettingStartedWizard } from "../../../components/wizard/GettingStartedWizard";'
    );
}

// 2. Add Component usage safely after the Header
//     <div className="flex items-center gap-4 mb-8">
//     <Link
//       href="/"
// ...
//     </Link>
//     <h1 className="text-3xl font-black">My Dashboard</h1>
//   </div>

const targetStr = '<h1 className="text-3xl font-black">My Dashboard</h1>\n        </div>';
if (data.includes(targetStr) && !data.includes('<GettingStartedWizard />')) {
    data = data.replace(targetStr, targetStr + '\n\n        {/* Onboarding Wizard */}\n        <GettingStartedWizard />\n');
} else {
    // fallback if formatting is different
    const fallbackStr = '<h1 className="text-3xl font-black">My Dashboard</h1>\n        </div>';
    console.log("Could not find exact target string, trying fallback.");
    
    // just insert it after the mb-8 header div block.
    // simpler regex:
    const re = /(<h1.*?My Dashboard<\/h1>\s*<\/div>)/;
    if (re.test(data) && !data.includes('<GettingStartedWizard />')) {
        data = data.replace(re, '$1\n\n        {/* Onboarding Wizard */}\n        <GettingStartedWizard />\n');
    }
}

fs.writeFileSync(filepath, data);
console.log('patched');
