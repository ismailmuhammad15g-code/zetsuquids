

// =========================================
// SEOHelmet Usage Examples
// =========================================

// مثال 1: في صفحة HomePage
import SEOHelmet from "../components/SEOHelmet";

function HomePage() {
  return (
    <>
      <SEOHelmet
        title="Home"
        description="Create and share comprehensive programming guides with AI assistance. Join our community of developers and explore tutorials, code examples, and best practices."
        keywords="developer guides, programming tutorials, AI guide generator, developer community"
      />

      <div>{/* محتوى الصفحة الرئيسية */}</div>
    </>
  );
}

// =========================================

// مثال 2: في صفحة AllGuidesPage
function AllGuidesPage() {
  return (
    <>
      <SEOHelmet
        title="All Developer Guides"
        description="Browse our comprehensive collection of developer guides, tutorials, and code examples. Learn programming, best practices, and modern development techniques."
        keywords="developer guides, programming tutorials, code examples, learning resources"
      />

      <div>{/* قائمة الـ guides */}</div>
    </>
  );
}

// =========================================

// مثال 3: في صفحة GuidePage (مع بيانات ديناميكية)
function GuidePage() {
  const [guide, setGuide] = useState(null);

  return (
    <>
      {guide && (
        <SEOHelmet
          title={guide.title}
          description={
            guide.content
              ? guide.content.substring(0, 150).replace(/[#*`]/g, "") + "..."
              : "A comprehensive developer guide"
          }
          author={guide.author_name || guide.user_email?.split("@")[0]}
          keywords={guide.keywords ? guide.keywords.join(", ") : ""}
          type="article"
        />
      )}

      <div>{/* محتوى الـ guide */}</div>
    </>
  );
}

// =========================================

// مثال 4: في صفحة UserWorkspacePage
function UserWorkspacePage() {
  const { username } = useParams();
  const [userProfile, setUserProfile] = useState(null);

  return (
    <>
      {userProfile && (
        <SEOHelmet
          title={`@${userProfile.author_name}'s Workspace`}
          description={
            userProfile.bio ||
            `View all guides and content created by @${userProfile.author_name}. ${userProfile.guides_count} guides published.`
          }
          type="profile"
          keywords={`${userProfile.author_name}, developer, guides, workspace`}
        />
      )}

      <div>{/* محتوى workspace */}</div>
    </>
  );
}

// =========================================

// مثال 5: في صفحة CommunityPage
function CommunityPage() {
  return (
    <>
      <SEOHelmet
        title="Developer Community"
        description="Join our thriving community of developers. Share posts, connect with other developers, and participate in discussions about programming and technology."
        keywords="developer community, programming forum, tech community, developer networking"
      />

      <div>{/* محتوى community */}</div>
    </>
  );
}

// =========================================

// مثال 6: في صفحة PricingPage
function PricingPage() {
  return (
    <>
      <SEOHelmet
        title="Pricing Plans"
        description="Choose the perfect plan for your needs. Get access to premium features, unlimited guide creation, and priority support. Flexible pricing for individuals and teams."
        keywords="pricing, plans, subscription, premium features"
      />

      <div>{/* جدول الأسعار */}</div>
    </>
  );
}

// =========================================

// مثال 7: صفحة مع noindex (لا تريد أرشفتها)
function AdminConsole() {
  return (
    <>
      <SEOHelmet
        title="Admin Console"
        description="Administrative dashboard"
        noindex={true} // ⚠️ منع محركات البحث من أرشفة هذه الصفحة
      />

      <div>{/* لوحة التحكم الإدارية */}</div>
    </>
  );
}

// =========================================

// مثال 8: في صفحة PostDetailsPage (Community Post)
function PostDetailsPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  return (
    <>
      {post && (
        <SEOHelmet
          title={post.content.substring(0, 60) + "..."}
          description={post.content.substring(0, 150) + "..."}
          author={post.author_name}
          type="article"
          keywords="community post, developer discussion, programming"
        />
      )}

      <div>{/* محتوى المنشور */}</div>
    </>
  );
}

// =========================================

// مثال 9: صفحة FAQ
function FAQPage() {
  return (
    <>
      <SEOHelmet
        title="Frequently Asked Questions"
        description="Find answers to common questions about ZetsuGuide. Learn about features, pricing, account management, and more."
        keywords="FAQ, frequently asked questions, help, support, how to"
      />

      <div>{/* قائمة الأسئلة والأجوبة */}</div>
    </>
  );
}

// =========================================

// مثال 10: صفحة Support
function SupportPage() {
  return (
    <>
      <SEOHelmet
        title="Contact Support"
        description="Need help? Contact our support team. We're here to answer your questions and help you get the most out of ZetsuGuide."
        keywords="support, help, contact, customer service"
      />

      <div>{/* نموذج الاتصال */}</div>
    </>
  );
}

// =========================================
// ملاحظات مهمة:
// =========================================

/*
1. ✅ ضع <SEOHelmet /> في بداية return statement

2. ✅ استخدم title مختصر وواضح (50-60 حرف)

3. ✅ description يجب أن يكون جذاب (150-160 حرف)

4. ✅ keywords: افصل بـ comma، 5-10 كلمات

5. ✅ type:
   - "website" للصفحات العامة (default)
   - "article" للمقالات والـ guides
   - "profile" لصفحات المستخدمين

6. ⚠️ noindex: استخدمه فقط للصفحات الإدارية
   (Admin, Staff, Auth pages)

7. 🔄 SEOHelmet يحدث meta tags تلقائياً عند تغيير البيانات

8. 📊 يمكن استخدامه في أي صفحة - حتى بدون props:
   <SEOHelmet /> // سيستخدم القيم الافتراضية
*/

// =========================================
// Testing SEO
// =========================================

/*
بعد إضافة SEOHelmet لصفحة معينة:

1. افتح الصفحة في المتصفح
2. اضغط F12 (Developer Tools)
3. اذهب إلى Elements tab
4. ابحث عن <head>
5. تحقق من وجود:
   - <title>Your Page Title | ZetsuGuide</title>
   - <meta name="description" content="...">
   - <meta property="og:title" content="...">
   - <meta property="og:description" content="...">
   - <link rel="canonical" href="...">

✅ إذا وجدت كل هذه العناصر، SEOHelmet يعمل بشكل صحيح!
*/

