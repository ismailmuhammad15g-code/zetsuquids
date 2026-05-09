const fs = require('fs');
const filepath = 'src/app/(main)/stats/page.tsx';
let data = fs.readFileSync(filepath, 'utf8');

// 1. Update ActiveTab type
data = data.replace(
    'type ActiveTab = "overview" | "analytics";',
    'type ActiveTab = "overview" | "analytics" | "publication";'
);

// 2. Add Publication tab
const analyticsTabStr = '<button\n            onClick={() => setActiveTab("analytics")}\n            className={`pb-2 px-4 font-bold text-lg transition-colors ${activeTab === "analytics" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}\n          >\n            Analytics{" "}\n            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-1">\n              Beta\n            </span>\n          </button>';
const publicationTabStr = '<button\n            onClick={() => setActiveTab("publication")}\n            className={`pb-2 px-4 font-bold text-lg transition-colors ${activeTab === "publication" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}\n          >\n            Publication\n          </button>';

if (!data.includes('setActiveTab("publication")')) {
    data = data.replace(analyticsTabStr, analyticsTabStr + '\n          ' + publicationTabStr);
}

// 3. Add Publication Settings Component import and usage
if (!data.includes('PublicationSettings')) {
    data = data.replace(
        'import { GettingStartedWizard } from "../../../components/wizard/GettingStartedWizard";',
        'import { GettingStartedWizard } from "../../../components/wizard/GettingStartedWizard";\nimport { PublicationSettings } from "../../../components/wizard/PublicationSettings";'
    );
    
    const overviewContentStr = '{activeTab === "overview" ? (';
    data = data.replace(
        overviewContentStr,
        '{activeTab === "publication" && <PublicationSettings />}\n\n        ' + overviewContentStr
    );
}

fs.writeFileSync(filepath, data);
console.log('patched');
