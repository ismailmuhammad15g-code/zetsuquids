import fs from 'fs';
import path from 'path';
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

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
for (const move of moves) {
  const sf = project.getSourceFile(move.from);
  if (sf) {
    if (!fs.existsSync(path.dirname(move.to))) {
        fs.mkdirSync(path.dirname(move.to), { recursive: true });
    }
    sf.move(move.to);
    moved++;
    console.log(`[AST] Moved ${move.from} to ${move.to}`);
  } else {
    console.warn(`[WARN] Could not find ${move.from} in AST`);
  }
}

// Convert all imports inside the app directory that became weird absolute ones or mismatched
console.log("Saving AST... This automatically updates all relative imports!!");
project.saveSync();
console.log(`Complete! Moved and updated imports for ${moved} pages.`);
