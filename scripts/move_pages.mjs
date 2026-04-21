import fs from 'fs';
import path from 'path';

const moves = [
  { from: 'src/pages/AuthPage.tsx', to: 'src/app/auth/page.tsx' },
  { from: 'src/pages/VerifyEmailPage.tsx', to: 'src/app/verify-email/page.tsx' },
  { from: 'src/pages/ResetPasswordPage.tsx', to: 'src/app/reset-password/page.tsx' },
  { from: 'src/pages/ZetsuGuideAIPage.tsx', to: 'src/app/zetsuguide-ai/page.tsx' },
  { from: 'src/pages/AdminLogin.tsx', to: 'src/app/admin/login/page.tsx' },
  { from: 'src/pages/AdminConsole.tsx', to: 'src/app/admin/console/page.tsx' },
  { from: 'src/pages/StaffLogin.tsx', to: 'src/app/staff/login/page.tsx' },
  { from: 'src/pages/StaffConsole.tsx', to: 'src/app/staff/console/page.tsx' },
  { from: 'src/pages/NotFoundPage.tsx', to: 'src/app/not-found.tsx' },

  { from: 'src/pages/HomePage.tsx', to: 'src/app/(main)/page.tsx' },
  { from: 'src/pages/AllGuidesPage.tsx', to: 'src/app/(main)/guides/page.tsx' },
  { from: 'src/pages/GuidePage.tsx', to: 'src/app/(main)/guide/[slug]/page.tsx' },
  { from: 'src/pages/UserWorkspacePage.tsx', to: 'src/app/(main)/[username]/workspace/page.tsx' },
  { from: 'src/pages/UserStatsPage.tsx', to: 'src/app/(main)/stats/page.tsx' },
  { from: 'src/pages/PricingPage.tsx', to: 'src/app/(main)/pricing/page.tsx' },
  { from: 'src/pages/PrivacyPolicy.tsx', to: 'src/app/(main)/privacy/page.tsx' },
  { from: 'src/pages/CookiePolicy.tsx', to: 'src/app/(main)/cookie-policy/page.tsx' },
  { from: 'src/pages/TermsOfService.tsx', to: 'src/app/(main)/terms/page.tsx' },
  { from: 'src/pages/SupportPage.tsx', to: 'src/app/(main)/support/page.tsx' },
  { from: 'src/pages/ReportBugPage.tsx', to: 'src/app/(main)/reportbug/page.tsx' },
  { from: 'src/pages/FAQPage.tsx', to: 'src/app/(main)/faq/page.tsx' },

  { from: 'src/pages/CommunityPage.tsx', to: 'src/app/community/page.tsx' },
  { from: 'src/pages/community/ExplorePage.tsx', to: 'src/app/community/explore/page.tsx' },
  { from: 'src/pages/community/CommunitiesPage.tsx', to: 'src/app/community/communities/page.tsx' },
  { from: 'src/pages/community/GroupPage.tsx', to: 'src/app/community/group/[id]/page.tsx' },
  { from: 'src/pages/community/PeoplePage.tsx', to: 'src/app/community/people/page.tsx' },
  { from: 'src/pages/community/ProfilePage.tsx', to: 'src/app/community/profile/[username]/page.tsx' },
  { from: 'src/pages/PostDetailsPage.tsx', to: 'src/app/community/post/[id]/page.tsx' },
  { from: 'src/pages/community/NotificationsPage.tsx', to: 'src/app/community/notifications/page.tsx' },
  { from: 'src/pages/community/MessagesPage.tsx', to: 'src/app/community/messages/page.tsx' },
  { from: 'src/pages/community/BookmarksPage.tsx', to: 'src/app/community/bookmarks/page.tsx' },
];

let moved = 0;
let errors = 0;

for (const move of moves) {
  try {
    if (!fs.existsSync(move.from)) {
      console.warn(`[WARN] Source missing: ${move.from}`);
      continue;
    }
    
    // Ensure dest dir exists
    const destDir = path.dirname(move.to);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Move file
    fs.renameSync(move.from, move.to);
    moved++;
    console.log(`[OK] Moved ${move.from} to ${move.to}`);
  } catch (err) {
    console.error(`[ERR] Failed to move ${move.from}:`, err);
    errors++;
  }
}

// Global layout mappings
// 1. We have (main) taking over the Layout.tsx
try {
  const mainLayoutPath = 'src/app/(main)/layout.tsx';
  const mainLayoutCode = `
import Layout from "../../components/Layout";
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}
`;
  if (!fs.existsSync(path.dirname(mainLayoutPath))) {
    fs.mkdirSync(path.dirname(mainLayoutPath), { recursive: true });
  }
  fs.writeFileSync(mainLayoutPath, mainLayoutCode.trim() + '\n');
  console.log(`[OK] Created (main)/layout.tsx`);
} catch (e) {
  console.log('Error creating main layout:', e);
}

// 2. Community Layout
try {
  const communityLayoutPath = 'src/app/community/layout.tsx';
  const communityLayoutCode = `
import CommunityLayout from "../../components/community/CommunityLayout";
export default function CLayout({ children }: { children: React.ReactNode }) {
  return <CommunityLayout>{children}</CommunityLayout>;
}
`;
  if (!fs.existsSync(path.dirname(communityLayoutPath))) {
    fs.mkdirSync(path.dirname(communityLayoutPath), { recursive: true });
  }
  fs.writeFileSync(communityLayoutPath, communityLayoutCode.trim() + '\n');
  console.log(`[OK] Created community/layout.tsx`);
} catch (e) {
  console.log('Error creating community layout:', e);
}

console.log(`\nMove complete! Moved: ${moved}, Errors: ${errors}`);
