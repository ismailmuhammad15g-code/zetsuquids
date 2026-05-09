const fs = require('fs');

// 1. Update PublicationSettings.tsx
let settingsContent = fs.readFileSync('src/components/wizard/PublicationSettings.tsx', 'utf8');

settingsContent = settingsContent.replace(
  'import { useAuth } from "../../contexts/AuthContext";',
  'import { useAuth } from "../../contexts/AuthContext";\nimport { getAllAvatars } from "../../lib/avatar";'
);

settingsContent = settingsContent.replace(
  'avatar_url: string;',
  'avatar_url: string;\n  status: string;\n  display_name: string;'
);

settingsContent = settingsContent.replace(
  'const [profile, setProfile] = useState<ProfileData>({ username: "", display_name: "", bio: "", avatar_url: "" });',
  'const [profile, setProfile] = useState<ProfileData>({ username: "", display_name: "", bio: "", avatar_url: "", status: "" });'
);

settingsContent = settingsContent.replace(
  '.select("username, display_name, bio, avatar_url")',
  '.select("username, display_name, bio, avatar_url, status")'
);

settingsContent = settingsContent.replace(
  'avatar_url: data.avatar_url || ""',
  'avatar_url: data.avatar_url || "",\n          status: data.status || "",\n          display_name: data.display_name || ""'
);

settingsContent = settingsContent.replace(
  /bio: profile\.bio,/,
  'bio: profile.bio,\n          status: profile.status,\n          avatar_url: profile.avatar_url,'
);

const newBasics = \
        {/* Basics Section */}
        <section className="space-y-6 max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">The Basics</h3>
          
          <div>
            <h3 className="font-bold text-sm mb-4">Choose Your Avatar</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {getAllAvatars().map((avatarPath: string) => (
                <button
                  key={avatarPath}
                  onClick={() => setProfile({...profile, avatar_url: avatarPath})}
                  className={\p-2 rounded border-2 transition-all \\}
                >
                  <img src={avatarPath} alt="avatar" className="w-full h-auto" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-900 mb-2">Display Name</label>
            <input 
              type="text" 
              value={profile.display_name} 
              onChange={e => setProfile({...profile, display_name: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white text-[15px]"
            />
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-900 mb-2">Bio</label>
            <textarea 
              value={profile.bio} 
              onChange={e => setProfile({...profile, bio: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white text-[15px]"
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{(profile.bio || "").length}/200 characters</p>
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-900 mb-2">Profile Status (Bubble Text)</label>
            <textarea
              value={profile.status}
              onChange={e => setProfile({...profile, status: e.target.value})}
              placeholder="e.g., Working remotely, Writing a guide..."
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white text-[15px] resize-none"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">{(profile.status || "").length}/100 characters</p>
          </div>

          <div>
            <button 
              onClick={handleProfileUpdate}
              disabled={loading}
              className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#E64C00] text-white font-semibold rounded-lg text-[15px] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>
\;

settingsContent = settingsContent.replace(/<section className="space-y-6 max-w-lg">\s*<h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">The Basics<\/h3>[\s\S]*?<\/section>/, newBasics);

// Add sharing functionality
const newShareSection = \
        {/* Share Section */}
        <section className="space-y-6 max-w-lg">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Share & Grow</h3>
          <p className="text-gray-600 text-[15px]">Let people know about your publication across your network.</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
              <Copy className="w-5 h-5 text-gray-500" /> {CopiedLink || "Copy link"}
            </button>
            <button onClick={() => window.open(\https://www.facebook.com/sharer/sharer.php?u=\$\{encodeURIComponent(window.location.origin + "/" + profile.username)}\, '_blank')} className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
              <Facebook className="w-5 h-5 text-[#1877F2]" /> Facebook
            </button>
            <button onClick={() => window.open(\mailto:?subject=Check out my publication on ZetsuGuide&body=Check out my guides here: \$\{encodeURIComponent(window.location.origin + "/" + profile.username)}\, '_self')} className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
              <Mail className="w-5 h-5 text-gray-500" /> Email
            </button>
            <button onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: 'My ZetsuGuide Publication',
                    text: 'Check out my publication on ZetsuGuide!',
                    url: window.location.origin + "/" + profile.username,
                  });
                } else {
                  handleCopyLink();
                }
              } catch (e) {
                console.error('Share failed', e);
              }
            }} className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
              <MoreHorizontal className="w-5 h-5 text-gray-500" /> More options
            </button>
          </div>
        </section>
\;

settingsContent = settingsContent.replace(/<section className="space-y-6 max-w-lg">\s*<h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Share & Grow<\/h3>[\s\S]*?<\/section>/, newShareSection);
settingsContent = settingsContent.replace('const handleCopyLink = () => {', 'const [CopiedLink, setCopiedLink] = useState("");\n  const handleCopyLink = () => {\n    setCopiedLink("Copied!");\n    setTimeout(() => setCopiedLink(""), 2000);\n');
settingsContent = settingsContent.replace('alert("Settings saved successfully!");', '/* alert("Settings saved successfully!"); */');

fs.writeFileSync('src/components/wizard/PublicationSettings.tsx', settingsContent);
console.log("Updated PublicationSettings.tsx");