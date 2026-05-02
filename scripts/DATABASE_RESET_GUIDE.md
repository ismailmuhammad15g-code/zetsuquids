# 🔥 Database Reset Script Guide 🔥

## مقدمة
هذا السكريبت يحذف **ALL DATA** من قاعدة البيانات Supabase بشكل آمن وموثوق.

**⚠️ WARNING: هذا الإجراء لا يمكن التراجع عنه!**

---

## المتطلبات

### 1. تثبيت المكتبات المطلوبة
```bash
pip install python-dotenv supabase
```

### 2. متغيرات البيئة المطلوبة
اكتب في ملف `.env` الخاص بك:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**كيفية الحصول على المفاتيح:**
1. اذهب إلى Supabase Dashboard
2. اختر Project → Settings → API
3. انسخ:
   - `Project URL` → `SUPABASE_URL`
   - `Service Role Secret` → `SUPABASE_SERVICE_KEY` (احذر! هذا مفتاح حساس جداً)

---

## كيفية الاستخدام

### بدون تحذيرات (Confirmation Mode)
```bash
cd /workspaces/zetsuquids
python scripts/nuke_database.py
```

هذا سيطلب منك تأكيد:
1. اكتب: `yes`
2. اكتب: `DELETE ALL DATA`

### Mode الإجبار (بدون طلب تأكيد)
```bash
python scripts/nuke_database.py --force
```

⚠️ استخدم هذا فقط عندما تكون متأكداً 100%

---

## خطوات التنفيذ

السكريبت يقوم بـ 6 خطوات:

1. **التحقق من الإعدادات** - التأكد من وجود المفاتيح
2. **الاتصال بـ Supabase** - التأكد من الاتصال صحيح
3. **تحليل قاعدة البيانات** - عد الصفوف الموجودة
4. **طلب تأكيد** - التأكد من رغبتك الفعلية (إلا إذا كنت في mode الإجبار)
5. **حذف البيانات** - حذف من جميع الجداول بالترتيب الصحيح
6. **التحقق** - التأكد من أن كل شيء تم حذفه

---

## الجداول المحذوفة

السكريبت يحذف من **38 جدول** بالترتيب الصحيح:

### Community Features
- community_poll_votes
- community_poll_options
- community_polls
- community_post_hashtags
- community_follows
- community_notifications
- post_bookmarks

### Posts
- post_likes
- post_comments
- posts

### Users
- community_members
- community_conversations
- community_messages
- community_groups

### Guides
- guide_versions
- guide_inline_comments
- guide_ratings
- guide_comments
- guide_time_logs
- guide_views
- user_guide_interactions

### User Data
- user_follows
- claimed_rewards
- user_chatbot_usage
- zetsuguide_conversations
- zetsuguide_usage_logs

### Support
- support_messages
- support_conversations
- bug_reports

### UI Components
- ui_component_likes
- ui_components

### Logging
- usage_logs

### Credits & Referrals
- zetsuguide_referrals
- zetsuguide_credits

### Profiles
- zetsuguide_user_profiles
- zetsuguide_ads
- community_hashtags
- guides (الجدول الرئيسي)

---

## الميزات الأمان

✅ **Multi-level Confirmation**: يطلب تأكيد على مرحلتين
✅ **Proper Foreign Key Order**: يحذف الجداول بالترتيب الصحيح
✅ **Error Handling**: يتعامل مع الأخطاء بشكل آمن
✅ **Verification**: يتحقق من أن كل شيء تم حذفه
✅ **Detailed Reporting**: يعرض تقرير مفصل لكل حذف

---

## الأخطاء الشائعة

### ❌ `SUPABASE_URL not found`
**الحل:** تأكد من أن `.env` يحتوي على `SUPABASE_URL`

### ❌ `SUPABASE_SERVICE_KEY not found`
**الحل:** تأكد من أن لديك `SUPABASE_SERVICE_KEY` في `.env`
(هذا ليس `ANON_KEY` - يجب أن يكون `SERVICE_ROLE_SECRET`)

### ❌ `Connection failed`
**الحل:** تأكد من أن المفاتيح صحيحة والإنترنت يعمل

### ❌ `No module named 'supabase'`
**الحل:** قم بتثبيت المكتبة:
```bash
pip install supabase
```

---

## مثال على التنفيذ الكامل

```bash
# 1. اذهب للمشروع
cd /workspaces/zetsuquids

# 2. تأكد من وجود .env مع المفاتيح
cat .env | grep SUPABASE_

# 3. قم بتثبيت المكتبات (إن لم تكن مثبتة)
pip install python-dotenv supabase

# 4. تشغيل السكريبت
python scripts/nuke_database.py

# 5. أكمل التأكيدات:
#    اكتب: yes
#    اكتب: DELETE ALL DATA

# 6. انتظر حتى اكتمال العملية
```

---

## النتيجة المتوقعة

```
================================================================================
  🔥 SUPABASE DATABASE NUCLEAR RESET 🔥
================================================================================

ℹ️  Step 1: Validating configuration...
✅ Configuration valid

ℹ️  Step 2: Initializing Supabase client...
✅ Connection successful

[1/38] community_poll_votes     🔥 Deleting... ✅ (42 rows)
[2/38] community_poll_options   🔥 Deleting... ✅ (128 rows)
...

================================================================================
  ✅ VERIFYING DELETION ✅
================================================================================

✨ Database is now completely empty! (0 rows)

================================================================================
  🎉 OPERATION COMPLETE 🎉
================================================================================

✅ All data has been successfully deleted!
✅ Your database is now production-ready for testing!
```

---

## ملاحظات هامة

1. **GitHub Storage**: السكريبت يحذف فقط من Supabase (قاعدة البيانات)
   - GitHub Storage يبقى كما هو (إن كنت تستخدمه)
   - يمكنك تنظيفه يدوياً إن لزم الحال

2. **Auth Users**: السكريبت لا يحذف auth users من Supabase Auth
   - إذا أردت حذفها، استخدم Supabase Dashboard → Authentication
   - أو قم بحذفهم من API

3. **النسخ الاحتياطية**: تأكد من عمل نسخة احتياطية قبل التشغيل!

4. **الأداء**: الحذف قد يستغرق دقائق إذا كان هناك بيانات كثيرة

---

## الدعم

إذا واجهت مشاكل:
1. تحقق من أن المفاتيح صحيحة
2. تأكد من الاتصال بالإنترنت
3. جرب بـ `--force` في حالة المشاكل مع التأكيدات

---

**Ready to go production! 🚀**
