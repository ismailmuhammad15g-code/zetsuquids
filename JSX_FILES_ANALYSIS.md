# Complete JSX Files Analysis - src/pages Directory

## Summary
- **Total Files**: 32 .jsx files
- **Location**: d:\new\zetsuquids\src\pages\ (including community/ subdirectory)
- **Total Lines**: ~23,000+ lines of code
- **Largest File**: ZetsuGuideAIPage.jsx (1,757 lines)
- **Smallest File**: FAQPage.jsx (14 lines)

---

## 📋 COMPLETE FILE LISTING

### Root Pages (25 files)

#### 1. **ZetsuGuideAIPage.jsx** - 1,757 lines
- **Purpose**: Advanced AI-powered guide creation and management interface with sidebar, chat, markdown rendering, and mermaid diagram support
- **Key Imports**:
  - lucide-react (16 icons: ArrowRight, Bot, BrainCircuit, Bug, Check, Copy, PanelLeft, etc.)
  - mermaid, react-markdown, react-router-dom, react-syntax-highlighter
  - AuthContext, supabase
- **Hooks Used**: useCallback, useEffect, useRef, useState
- **Exported Component**: `ZetsuGuideAIPage` (default export)
- **Key Features**:
  - Collapsible sidebar with chat history
  - Markdown rendering with syntax highlighting
  - Mermaid diagram support
  - Guide management (create, edit, delete)
  - Message refresh functionality
  - Inline CSS styling

---

#### 2. **VerifyEmailPage.jsx** - 89 lines
- **Purpose**: Email verification page shown when users click email verification link
- **Key Imports**:
  - lucide-react (Check, Loader2, X)
  - React hooks (useEffect, useState, useRef)
  - useNavigate from react-router-dom
- **Hooks Used**: useEffect, useState, useRef
- **Exported Component**: `VerifyEmailPage` (default export)
- **Key Features**:
  - Email token validation via API
  - Three states: loading, success, error
  - Auto-redirect to auth page after successful verification
  - Double-execution prevention with useRef

---

#### 3. **UserWorkspacePage.jsx** - 520+ lines
- **Purpose**: Displays user's public workspace/profile with guides, bio, and editing capabilities
- **Key Imports**:
  - lucide-react (BookOpen, Calendar, Edit2, Loader2, Mail, X)
  - React hooks (useEffect, useState)
  - useParams from react-router-dom
  - Components: FollowButton, VerifiedBadge, Toast
  - AuthContext, supabase
- **Hooks Used**: useEffect, useState, useParams
- **Exported Component**: `UserWorkspacePage` (default export)
- **Key Features**:
  - User profile display with username/email
  - Guide listing and filtering
  - Edit modal for bio and avatar selection
  - Supabase integration for user data
  - Profile existence checking

---

#### 4. **UserStatsPage.jsx** - 230+ lines
- **Purpose**: Analytics dashboard for user's guide performance and engagement metrics
- **Key Imports**:
  - lucide-react (ArrowLeft, BarChart3, Calendar, Clock, Eye, Star)
  - React hooks (useEffect, useState)
  - React Router (Link)
  - AreaChart component, AuthContext, supabase
- **Hooks Used**: useEffect, useState
- **Exported Component**: `UserStatsPage` (default export)
- **Key Features**:
  - Two tab views: overview and analytics
  - Time tracking on guides
  - Chart rendering for views and ratings
  - Tab switching between stats and analytics
  - Supabase data integration

---

#### 5. **TermsOfService.jsx** - 180+ lines
- **Purpose**: Static Terms of Service page with detailed service descriptions and user obligations
- **Key Imports**:
  - React Router (Link)
  - lucide-react (FileText, DollarSign, Shield, AlertTriangle, Scale, ArrowLeft, CheckCircle)
- **Hooks Used**: None (static component)
- **Exported Component**: `TermsOfService` (default export)
- **Key Features**:
  - Acceptance of terms section
  - Service description with features
  - User obligations and prohibited actions
  - Credits and payment terms
  - IP ownership and termination clauses
  - Structured with sections and icons

---

#### 6. **SupportPage.jsx** - 130+ lines
- **Purpose**: Support ticket submission form for authenticated users
- **Key Imports**:
  - lucide-react (AlertCircle, ArrowLeft, Loader2, MessageSquare, Phone, Send, Sparkles, Tag, User)
  - React hooks (useEffect, useState)
  - React Router (Link, useNavigate)
  - AuthContext
- **Hooks Used**: useEffect, useState, useNavigate
- **Exported Component**: `SupportPage` (default export)
- **Key Features**:
  - Authentication check with redirect to /auth
  - Support form with category, email, phone, message
  - Success confirmation screen
  - API submission to /api/content
  - Arabic text support (التحقق من تسجيل الدخول)

---

#### 7. **StaffLogin.jsx** - 100+ lines
- **Purpose**: Staff/support team password-protected login page
- **Key Imports**:
  - React hooks (useState)
  - React Router (useNavigate, Link)
  - lucide-react (MessageSquare, Lock, ArrowLeft, Eye, EyeOff)
- **Hooks Used**: useState
- **Exported Component**: `StaffLogin` (default export)
- **Key Features**:
  - Password-based authentication (VITE_STAFF_PASSWORD)
  - Session storage for authentication state
  - Password visibility toggle
  - Login time tracking
  - Arabic UI with English fallback
  - Inline CSS styling

---

#### 8. **StaffConsole.jsx** - 1,401 lines
- **Purpose**: Comprehensive staff/support agent dashboard with multiple management features
- **Key Imports**:
  - Lottie (animation support)
  - lucide-react (15+ icons)
  - React hooks (useEffect, useRef, useState)
  - React Router (Link, useNavigate)
  - supabase, supportApi
  - Staff profile animations
- **Hooks Used**: useEffect, useRef, useState
- **Exported Component**: `StaffConsole` (default export)
- **Key Features**:
  - Staff profile selection (4 team members)
  - Real-time subscription for messages
  - Support message management with conversations
  - Guide review/approval system
  - Advertisement management
  - Active/inactive staff profiles
  - 4-hour session expiration
  - Message scrolling and typing indicators
  - Three main tabs: support, guides, ads

---

#### 9. **ResetPasswordPage.jsx** - 120+ lines
- **Purpose**: Password reset form for users with reset token
- **Key Imports**:
  - lucide-react (ArrowLeft, Check, Eye, EyeOff, Loader2, Lock)
  - React hooks (useEffect, useState)
  - useNavigate, useSearchParams from react-router-dom
- **Hooks Used**: useEffect, useState, useNavigate, useSearchParams
- **Exported Component**: `ResetPasswordPage` (default export)
- **Key Features**:
  - Token validation from URL query params
  - Password confirmation validation
  - Minimum 6 character password requirement
  - Three states: form, success, error
  - API integration with /api/auth/reset-password
  - Auto-redirect to auth page after success

---

#### 10. **ReportBugPage.jsx** - 180+ lines
- **Purpose**: Bug reporting form with browser info auto-detection and rewards
- **Key Imports**:
  - lucide-react (AlertCircle, ArrowLeft, Bug, CheckCircle, Gift, Lightbulb, Loader2, Monitor, Send)
  - React hooks (useEffect, useState)
  - React Router (Link, useLocation, useNavigate)
  - AuthContext
- **Hooks Used**: useEffect, useState, useLocation, useNavigate
- **Exported Component**: `ReportBugPage` (default export)
- **Key Features**:
  - Authentication required (redirect to /auth if not logged in)
  - Auto-detect browser and screen info
  - Bug type selection (ui_glitch, technical_issue)
  - Improvement suggestions field
  - Reward system (10 credits per approved bug)
  - Success animation and confirmation
  - Arabic text support

---

#### 11. **PrivacyPolicy.jsx** - 200+ lines
- **Purpose**: Comprehensive privacy policy with data collection and usage details
- **Key Imports**:
  - React Router (Link)
  - lucide-react (Shield, Lock, Eye, Database, Mail, CreditCard, MessageSquare, ArrowLeft)
- **Hooks Used**: None (static component)
- **Exported Component**: `PrivacyPolicy` (default export)
- **Key Features**:
  - Information collection details (account, payment, usage)
  - Data usage explanations
  - Cookie policy
  - Third-party integrations (Paymob for payments)
  - User rights and data deletion
  - Contact information
  - Last updated: January 29, 2026

---

#### 12. **PricingPage.jsx** - 180+ lines
- **Purpose**: Tiered pricing/subscription page with multiple plan options
- **Key Imports**:
  - Components (PricingSection)
  - AuthContext, supabase
  - lucide-react (ArrowLeft, Loader2, Wallet)
  - React hooks (useEffect, useState)
  - React Router (Link, useNavigate)
  - toast from sonner
- **Hooks Used**: useEffect, useState, useNavigate
- **Exported Component**: `PricingPage` (default export)
- **Key Features**:
  - Four pricing tiers: Individuals, Teams, Organizations, Enterprise
  - Monthly/yearly frequency options
  - Credit amounts per tier
  - User credit fetching and display
  - Payment processing via Paymob
  - Unauthenticated user handling

---

#### 13. **PostDetailsPage.jsx** - 280+ lines
- **Purpose**: Detailed view of a community post with comments and interactions
- **Key Imports**:
  - date-fns (format)
  - lucide-react (ArrowLeft, Heart, Loader2, MessageSquare, MoreHorizontal, Repeat2, Share)
  - React hooks (useEffect, useState)
  - react-markdown, react-router-dom
  - communityApi, AuthContext, avatar utilities
- **Hooks Used**: useEffect, useState, useParams, useNavigate
- **Exported Component**: `PostDetailsPage` (default export)
- **Key Features**:
  - Post data loading with user ID for 'has_liked' check
  - Comment display with author info
  - Like functionality with optimistic state updates
  - Reply/comment composition
  - Markdown rendering
  - Syntax highlighting for code blocks

---

#### 14. **NotFoundPage.jsx** - 50+ lines
- **Purpose**: 404 page with helpful navigation and "Did you mean /staff/console" typo detection
- **Key Imports**:
  - lucide-react (ArrowLeft, Home, Search)
  - React Router (Link, useLocation)
- **Hooks Used**: useLocation
- **Exported Component**: `NotFoundPage` (default export)
- **Key Features**:
  - Detects "/stuff" typo and suggests /staff/console
  - Friendly 404 message with emoji
  - Navigation links to home
  - Pathname display
  - Helpful suggestion box

---

#### 15. **HomePage.jsx** - 250+ lines
- **Purpose**: Main landing page with hero, guides gallery, testimonials, and features showcase
- **Key Imports**:
  - lucide-react (10+ icons)
  - React hooks (useEffect, useState)
  - React Router (Link, useOutletContext)
  - Multiple UI components (Chatbot, Marquees, Cards)
  - useGuides hook, AuthContext, various APIs
- **Hooks Used**: useEffect, useState, useOutletContext, useGuides
- **Exported Component**: `HomePage` (default export)
- **Key Features**:
  - Hero section with featured guides
  - Recent guides gallery (6 guides)
  - Active ad banner support
  - Syncing guides to Supabase
  - Sample data initialization
  - Multiple marquee components
  - Testimonials display
  - Search functionality
  - Guide preview cards

---

#### 16. **GuidePage.jsx** - 1,554 lines
- **Purpose**: Comprehensive guide view page with editing, AI chat, comments, translations, quizzes, ratings, and more
- **Key Imports**:
  - lucide-react (20+ icons)
  - marked, react-dom, react-markdown
  - React hooks (useCallback, useEffect, useMemo, useRef, useState)
  - React Router (Link, useNavigate, useParams)
  - Multiple components (GuideAIChat, Comments, Rating, Translator, etc.)
  - AuthContext, ThemeContext, useGuideInteraction hook
- **Hooks Used**: useCallback, useEffect, useMemo, useRef, useState, useParams, useNavigate
- **Exported Component**: `GuidePage` (default export)
- **Key Features**:
  - Markdown rendering with syntax highlighting
  - Mermaid diagram support
  - Quiz embedding and rendering
  - AI chat sidebar for guide questions
  - Comments system
  - Guide rating system
  - Inline comments (Figma-style)
  - Text-to-speech functionality
  - Language translation
  - Dark/light theme support
  - Scroll progress indicator
  - Guide history modal
  - Author follow functionality
  - Download guide as PDF
  - Share functionality
  - Real-time interaction tracking

---

#### 17. **FAQPage.jsx** - 14 lines
- **Purpose**: Wrapper for FAQ and Quote UI components (mostly re-exports)
- **Key Imports**:
  - FAQ component from @/components/ui/faq-section
  - Quote component from @/components/ui/quote
- **Hooks Used**: None
- **Exported Component**: `FAQDemo` (named and default export)
- **Key Features**:
  - Minimal component that renders FAQ and Quote sections
  - Gray background for Quote section
  - Simple layout

---

#### 18. **CookiePolicy.jsx** - 220+ lines
- **Purpose**: Detailed cookie policy explaining cookie types and usage
- **Key Imports**:
  - lucide-react (ArrowLeft)
  - React Router (Link)
- **Hooks Used**: None (static component)
- **Exported Component**: `CookiePolicy` (default export)
- **Key Features**:
  - Cookie types explanation (Essential, Analytics, Functionality, Marketing)
  - Third-party cookies section
  - Cookie control information
  - Last updated: February 2026
  - Bold typography styling
  - Grid layout for cookie categories

---

#### 19. **CommunityPlaceholderPage.jsx** - 30+ lines
- **Purpose**: Placeholder page for community features not yet implemented
- **Key Imports**:
  - AuthContext
  - Components: CommunityLeftSidebar, TrendsSidebar
- **Hooks Used**: useAuth
- **Exported Component**: `CommunityPlaceholderPage` (default export)
- **Key Features**:
  - Generic placeholder message
  - Dynamic title and message props
  - Left and right sidebars
  - Twitter-like dark theme

---

#### 20. **CommunityPage.jsx** - 120+ lines
- **Purpose**: Community feed showing posts with filtering by tabs (For you, Following, All)
- **Key Imports**:
  - lucide-react (Loader2, RefreshCw, Sparkles)
  - React hooks (useCallback, useEffect, useState)
  - Components: PostCard, Composer, FeedTabs
  - AuthContext, communityApi
- **Hooks Used**: useCallback, useEffect, useState
- **Exported Component**: `CommunityFeed` (default export)
- **Key Features**:
  - Three feed tabs: For you (smart feed), Following, All
  - Post fetching and filtering based on active tab
  - Refresh functionality
  - Post composer integration
  - Real-time refresh trigger via window event
  - Loading and empty states
  - User authentication check

---

#### 21. **ChartDemo.jsx** - 50+ lines
- **Purpose**: Demo/testing page for AreaChart component with multiple examples
- **Key Imports**:
  - AreaChart component from retroui
- **Hooks Used**: None
- **Exported Component**: `ChartDemo` (default export)
- **Key Features**:
  - Single category chart example
  - Custom color configuration
  - Multiple data point series
  - Sample data with months and views
  - Different color palettes

---

#### 22. **AuthPage.jsx** - 550+ lines
- **Purpose**: Authentication page with login, register, forgot password, and password reset modes
- **Key Imports**:
  - BlurFade, BorderBeam from magicui
  - Button, Card components
  - Lottie animation
  - lucide-react (15+ icons)
  - React hooks (useEffect, useState, useRef)
  - React Router (Link, useNavigate, useSearchParams)
  - celebrateAnimation, SocialButton components
  - AuthContext, supabase
- **Hooks Used**: useEffect, useState, useRef, useNavigate, useSearchParams
- **Exported Component**: `AuthPage` (default export)
- **Key Features**:
  - Multiple modes: login, register, forgot, reset
  - Image carousel with testimonials
  - Referral code validation
  - Social login buttons (GitHub, etc.)
  - Celebration animation on registration
  - Random testimonials
  - Background image slider
  - BlurFade image gallery
  - Email/password validation
  - Password confirmation
  - Show/hide password toggle

---

#### 23. **AdminConsole.jsx** - 420+ lines
- **Purpose**: Admin dashboard with stats, activity logs, and support message management
- **Key Imports**:
  - React hooks (useEffect, useState, useRef)
  - React Router (useNavigate, Link)
  - lucide-react (15+ icons)
  - supabase, supportApi
- **Hooks Used**: useEffect, useState, useRef, useNavigate
- **Exported Component**: `AdminConsole` (default export)
- **Key Features**:
  - Dashboard statistics (users, guides, conversations, prompts)
  - 1-hour session expiration
  - Support message management
  - Conversation expansion and message loading
  - Real-time typing indicators
  - Channel broadcasting
  - Recent activity log
  - Authentication check before access

---

#### 24. **AllGuidesPage.jsx** - 280+ lines
- **Purpose**: Guide discovery and browsing page with search, filtering, and pagination
- **Key Imports**:
  - Pagination components
  - lucide-react (10+ icons)
  - React hooks (useEffect, useMemo, useState)
  - React Router (Link, useOutletContext)
  - useGuides hook, AuthContext, supabase
  - GuideRecommendations component
- **Hooks Used**: useEffect, useMemo, useState, useOutletContext, useGuides
- **Exported Component**: `AllGuidesPage` (default export)
- **Key Features**:
  - Search query filtering across title, keywords, content
  - Tag-based filtering with tag extraction from keywords
  - View mode toggle (grid/list)
  - Pagination with 12 guides per page
  - Author avatar caching
  - Filter UI with open/close toggle
  - Tag search filtering
  - Responsive grid/list layout
  - React Query integration for caching

---

#### 25. **AdminLogin.jsx** - 100+ lines
- **Purpose**: Admin password-protected login page
- **Key Imports**:
  - React hooks (useState)
  - React Router (useNavigate, Link)
  - lucide-react (Lock, Shield, Eye, EyeOff, ArrowLeft)
- **Hooks Used**: useState, useNavigate
- **Exported Component**: `AdminLogin` (default export)
- **Key Features**:
  - Password-based authentication (VITE_ADMIN_PASSWORD)
  - Session storage for admin state
  - Login time tracking for 1-hour expiration
  - Password visibility toggle
  - Loading state during verification
  - Inline CSS styling
  - Back to home link

---

### Community Subdirectory Pages (7 files)

#### 26. **community/ProfilePage.jsx** - 300+ lines
- **Purpose**: User profile page in community section with post history and edit capabilities
- **Key Imports**:
  - React hooks (useState, useEffect, useRef)
  - React Router (useParams, useNavigate)
  - lucide-react (10+ icons)
  - communityApi, uploadImageToImgBB
  - AuthContext, PostCard component, toast
- **Hooks Used**: useState, useEffect, useRef, useParams, useNavigate
- **Exported Component**: `ProfilePage` (default export)
- **Key Features**:
  - User profile fetching by username
  - Edit modal for profile fields (display name, bio, location, website)
  - Avatar and banner image upload with progress tracking
  - User posts display
  - Own profile detection and edit permissions
  - Image upload via ImgBB
  - Refresh functionality

---

#### 27. **community/NotificationsPage.jsx** - 140+ lines
- **Purpose**: Notifications feed showing user interactions (likes, comments, follows, mentions)
- **Key Imports**:
  - React hooks (useEffect, useState)
  - date-fns (differenceInMinutes, differenceInHours, differenceInDays)
  - lucide-react (Bell, Heart, MessageSquare, UserPlus, AtSign, Check)
  - communityApi, AuthContext, avatar utilities
- **Hooks Used**: useEffect, useState
- **Exported Component**: `NotificationsPage` (default export)
- **Key Features**:
  - Notification type configuration (like, comment, follow, mention)
  - Time formatting (relative: "1m", "2h", "3d")
  - Notification icon and color coding by type
  - Tab filtering (All, Mentions)
  - Auto-mark as read on page visit
  - User avatar display
  - Loading and empty states
  - Authentication check

---

#### 28. **community/MessagesPage.jsx** - 150+ lines
- **Purpose**: Direct messaging page showing conversations and message history
- **Key Imports**:
  - React hooks (useState, useEffect)
  - lucide-react (Mail, MessageCircle, Send, Loader2)
  - AuthContext, communityApi
  - supabase (real-time subscription)
- **Hooks Used**: useState, useEffect
- **Exported Component**: `MessagesPage` (default export)
- **Key Features**:
  - Conversation list display
  - Search for direct messages
  - Real-time subscription to new messages
  - Auto-refresh on new message insert
  - Conversation ordering by last message
  - User avatar in conversation
  - Empty state with login prompts
  - Loading state

---

#### 29. **community/GroupPage.jsx** - 380+ lines
- **Purpose**: Community group/space page with posts, members, and admin controls
- **Key Imports**:
  - lucide-react (12+ icons)
  - React hooks (useEffect, useRef, useState)
  - React Router (useNavigate, useParams)
  - PostCard, Composer components
  - communityApi, uploadImageToImgBB
  - AuthContext, toast
- **Hooks Used**: useEffect, useRef, useState, useParams, useNavigate
- **Exported Component**: `GroupPage` (default export)
- **Key Features**:
  - Group details fetching
  - Join/leave toggle
  - Admin-only edit modal
  - Group icon and banner upload with progress
  - Delete group with confirmation
  - Members list modal
  - Post composer integration
  - Tab switching (Posts, Members, About)
  - Real-time member list updates
  - Deletion confirmation with text matching

---

#### 30. **community/ExplorePage.jsx** - 180+ lines
- **Purpose**: Explore and search page for discovering communities, people, and trends
- **Key Imports**:
  - lucide-react (Flame, Hash, Loader2, Search, TrendingUp, Users, X)
  - React hooks (useEffect, useState)
  - React Router (useNavigate)
  - PostCard component
  - AuthContext, communityApi
- **Hooks Used**: useEffect, useState, useNavigate
- **Exported Component**: `ExplorePage` (default export)
- **Key Features**:
  - URL search parameter handling
  - Trends display on initial load
  - User/community search with debounce
  - Post filtering by search query
  - Loading states for search
  - Empty states with guidance
  - Search results for users and posts
  - Hashtag/topic trends display

---

#### 31. **community/CommunitiesPage.jsx** - 300+ lines
- **Purpose**: Browse and manage communities (join/leave) with create community functionality
- **Key Imports**:
  - lucide-react (Users, Plus, X, Globe, Lock, ShieldCheck, Camera, Loader2)
  - React hooks (useEffect, useState, useRef)
  - React Router (useNavigate)
  - uploadImageToImgBB
  - communityApi, AuthContext, toast
- **Hooks Used**: useEffect, useState, useRef, useNavigate
- **Exported Component**: `CommunitiesPage` (default export)
- **Key Features**:
  - Community list with join status
  - Create new community modal
  - Community icon and banner upload
  - Join/leave toggle
  - Upload progress tracking
  - Community privacy settings (Public/Private)
  - Member count display
  - Authentication check for creating communities

---

#### 32. **community/BookmarksPage.jsx** - 120+ lines
- **Purpose**: View bookmarked posts (premium feature)
- **Key Imports**:
  - React hooks (useEffect, useState)
  - lucide-react (Bookmark, Sparkles, Star)
  - PostCard component
  - communityApi, AuthContext
  - useNavigate from react-router-dom
- **Hooks Used**: useEffect, useState, useNavigate
- **Exported Component**: `BookmarksPage` (default export)
- **Key Features**:
  - Bookmarked posts display
  - Authentication check
  - Empty state for unauthenticated users
  - Empty state for users with no bookmarks
  - Loading skeleton animation
  - Post card integration
  - Delete from bookmarks functionality

---

## 🔧 KEY PATTERNS & TECHNOLOGIES

### Hooks Most Commonly Used (across all files):
1. **useState** - Present in 100% of components
2. **useEffect** - Present in ~90% of components
3. **useNavigate** - Form pages, auth flows, redirects
4. **useParams** - Dynamic routing (profiles, posts, guides)
5. **useCallback** - Performance optimization in large pages
6. **useRef** - Refs to DOM elements, preventing double execution, scroll anchors
7. **useMemo** - Computed/filtered data sets
8. **useOutletContext** - Shared state from layout wrapper
9. **Custom Hooks**: useGuides, useAuth, useGuideInteraction, useTheme

### External Dependencies:
- **React Router**: Navigation, params, query strings, outlet context
- **Supabase**: Real-time subscriptions, database queries, authentication
- **Lucide React**: Icon library (~15-20 icons per file on average)
- **Markdown Rendering**: react-markdown, marked, react-syntax-highlighter
- **Charts**: Custom AreaChart, Tremor components (potential)
- **Animations**: Lottie, custom CSS animations
- **UI Components**: Custom components, magicui (BlurFade, BorderBeam)
- **Date Utilities**: date-fns, differenceInMinutes/Hours/Days
- **Image Upload**: ImgBB integration
- **Toast Notifications**: sonner library
- **Form Handling**: Controlled inputs with useState

### Context Usage:
- **AuthContext** - User authentication, login state
- **ThemeContext** - Dark/light mode toggle
- **useOutletContext** - Layout-level modals and shared state

### API Integration Patterns:
- **supabase** - Database, real-time subscriptions
- **communityApi** - Posts, profiles, messages, notifications
- **guidesApi** - Guide CRUD operations
- **supportApi** - Support tickets and messages
- **adsApi** - Advertisement management
- **Fetch API** - REST endpoints like /api/content, /api/auth/*

---

## 📐 FILE SIZE DISTRIBUTION

| Range | Count | Examples |
|-------|-------|----------|
| <100 lines | 6 | FAQPage, CookiePolicy, ChartDemo, etc. |
| 100-200 lines | 11 | VerifyEmailPage, ResetPasswordPage, etc. |
| 200-400 lines | 10 | UserStatsPage, GuidePage excerpt, etc. |
| 400-600 lines | 3 | AdminConsole, AuthPage, etc. |
| 1000+ lines | 2 | ZetsuGuideAIPage (1,757), GuidePage (1,554) |

---

## 🎯 CONVERSION NOTES FOR TYPESCRIPT

### File Complexity Tiers:
- **Tier 1 (Simple)**: FAQPage, CookiePolicy, ChartDemo, NotFoundPage, TermsOfService, PrivacyPolicy, CommunityPlaceholderPage - minimal state, mostly static
- **Tier 2 (Moderate)**: Most community pages, login pages, email verification - basic hooks, API calls, form handling
- **Tier 3 (Complex)**: GuidePage, ZetsuGuideAIPage, StaffConsole, AllGuidesPage - multiple hooks, complex state management, real-time subscriptions
- **Tier 4 (Very Complex)**: HomePage, AuthPage, UserWorkspacePage - nested components, context consumption, gallery/carousel logic

### Common Typing Patterns to Implement:
- Interface for User, Guide, Post, Notification types
- API response types from Supabase queries
- Component prop types (including children)
- State typing for useState<Type>
- Event handler typing (React.FormEvent, React.MouseEvent, etc.)
- Custom hook return types

### Common Issues to Watch:
- Supabase query response typing
- useRef initialization (Loader refs, input refs, etc.)
- Icon props from lucide-react
- Optional/nullable profile/user data
- Array vs single item in useState
- API error handling and typing
- Component composition with React.FC or function declarations
