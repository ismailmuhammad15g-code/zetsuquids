# 🎨 Social Media Images Setup

## صور Open Graph مطلوبة

لكي تظهر روابط موقعك بشكل جميل عند مشاركتها على Social Media، تحتاج لإنشاء الصور التالية:

### 1. صورة Open Graph الرئيسية
- **المسار**: `public/social/og-image.jpg`
- **المقاس**: 1200 × 630 بكسل
- **الاستخدام**: Facebook, LinkedIn, WhatsApp
- **المحتوى المقترح**:
  ```
  ┌─────────────────────────────────────┐
  │                                     │
  │         ZetsuGuide Logo             │
  │                                     │
  │  Create, Share & Discover           │
  │    Developer Guides                 │
  │                                     │
  │  🚀 AI-Powered Guide Creation      │
  │  👥 Developer Community            │
  │  📚 Comprehensive Tutorials        │
  │                                     │
  └─────────────────────────────────────┘
  ```

### 2. صورة Twitter Card
- **المسار**: `public/social/twitter-image.jpg`
- **المقاس**: 1200 × 675 بكسل (نسبة 16:9)
- **الاستخدام**: Twitter/X
- **ملاحظة**: يمكن استخدام نفس صورة OG بعد تعديل المقاس

---

## 🛠️ أدوات لإنشاء الصور

### خيار 1: Canva (سهل وسريع)
1. اذهب إلى: https://www.canva.com
2. اختر "Custom Size": 1200 × 630
3. استخدم قوالب "Social Media Post"
4. أضف:
   - Logo موقعك
   - النص الرئيسي
   - ألوان موقعك (Gradient من البنفسجي للوردي)
   - أيقونات جذابة

### خيار 2: Figma (احترافي)
```
Template ready to use:
https://www.figma.com/community/file/880843487868192717
```

### خيار 3: Online Tools
- **OG Image Creator**: https://www.opengraph.xyz/
- **Social Image Maker**: https://www.bannerbear.com/tools/social-image-maker/

---

## 📁 البنية المطلوبة

```
public/
├── social/
│   ├── og-image.jpg         (1200 × 630)
│   └── twitter-image.jpg    (1200 × 675)
└── favicon.svg
```

---

## ✅ بعد إنشاء الصور

### 1. ضع الصور في المجلد
```bash
# أنشئ المجلد إذا لم يكن موجوداً
mkdir public/social

# ضع الصور في المجلد
# public/social/og-image.jpg
# public/social/twitter-image.jpg
```

### 2. ارفع التعديلات
```bash
git add public/social
git commit -m "Add social media images"
git push
```

### 3. اختبر الصور

#### Facebook Debugger
```
https://developers.facebook.com/tools/debug/
```
أدخل رابط موقعك واضغط "Scrape Again"

#### Twitter Card Validator
```
https://cards-dev.twitter.com/validator
```
أدخل رابط موقعك واختبر

#### LinkedIn Post Inspector
```
https://www.linkedin.com/post-inspector/
```

---

## 🎨 مواصفات التصميم المقترحة

### الألوان (من موقعك)
```css
- Primary: #8B5CF6 (purple-400)
- Secondary: #EC4899 (pink-600)
- Background: #FFFFFF
- Text: #000000
- Gradient: from-purple-400 to-pink-600
```

### الخطوط
- **العنوان**: Bold, 72-96px
- **الوصف**: Regular, 36-48px
- **تفاصيل**: Medium, 24-32px

### العناصر المقترحة
- ✅ Logo في الأعلى
- ✅ عنوان واضح
- ✅ وصف مختصر (1-2 سطر)
- ✅ 3 ميزات رئيسية مع أيقونات
- ✅ رابط الموقع في الأسفل (اختياري)
- ✅ Gradient background جذاب

---

## 🚀 نصائح لتصميم أفضل

1. **استخدم Contrast عالي**: الخلفية البيضاء مع نص أسود واضح
2. **اجعل Logo بارز**: في الزاوية العلوية أو المركز
3. **نص قليل ومفيد**: لا تكتب فقرات طويلة
4. **أيقونات واضحة**: استخدم emojis أو icons من Lucide
5. **Safe Zone**: اترك 100px هامش من الجوانب

---

## 📊 اختبار سريع

بعد رفع الصور، اختبر:
```
https://zetsuquids.vercel.app/social/og-image.jpg
https://zetsuquids.vercel.app/social/twitter-image.jpg
```

يجب أن تفتح الصور بدون مشاكل!

---

## 🆘 إذا لم تكن لديك مهارات التصميم

استخدم هذا النص في ChatGPT/DALL-E:
```
Create a professional Open Graph image (1200x630px) for a developer 
community website called "ZetsuGuide". 

Design elements:
- Clean white background with purple to pink gradient accent
- Bold "ZetsuGuide" logo/text at top
- Tagline: "Create, Share & Discover Developer Guides"
- Three icons representing: AI Guide Creation, Community, Tutorials
- Modern, professional, tech-focused aesthetic
- High contrast for social media visibility
```

أو استخدم DALL-E:
```
Professional social media banner for developer platform, 
1200x630 pixels, purple and pink gradient, clean design, 
tech icons, "ZetsuGuide" branding, modern UI style
```

---

**الحالة**: 🔴 الصور مطلوبة - يرجى إضافتها قبل النشر!
