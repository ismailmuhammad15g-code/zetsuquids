const fs = require('fs');
const filepath = 'src/app/(main)/stats/page.tsx';
let data = fs.readFileSync(filepath, 'utf8');

// The literal exact replace didn't work because of spacing or exact characters. Let's use Regex.
const tabRe = /(<button\s+onClick=\{\(\) => setActiveTab\("analytics"\)\}\s+className=\{`pb-2 px-4 font-bold text-lg transition-colors \$\{activeTab === "analytics" \? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"\}`\}\s+>\s+Analytics\{" "\}\s+<span className="text-xs bg-gray-200 text-gray-600 px-2 py-0\.5 rounded-full ml-1">\s+Beta\s+<\/span>\s+<\/button>)/;

const publicationTabStr = '<button\n            onClick={() => setActiveTab("publication")}\n            className={`pb-2 px-4 font-bold text-lg transition-colors ${activeTab === "publication" ? "border-b-4 border-black text-black" : "text-gray-400 hover:text-gray-600"}`}\n          >\n            Publication\n          </button>';

if (!data.includes('setActiveTab("publication")')) {
    data = data.replace(tabRe, '$1\n          ' + publicationTabStr);
    console.log("Regex replaced tabs.");
}

fs.writeFileSync(filepath, data);
console.log('patched tabs again.');
