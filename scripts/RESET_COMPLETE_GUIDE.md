# 🔥 الدليل الكامل لحذف قاعدة البيانات 🔥

## 📚 المحتويات

- [الخيار الأول: استخدام Python Script (الأسهل)](#الخيار-الأول-python-script)
- [الخيار الثاني: استخدام SQL مباشرة (الأسرع)](#الخيار-الثاني-sql-مباشرة)
- [أسئلة شائعة](#أسئلة-شائعة)

---

## الخيار الأول: Python Script

### المميزات:
✅ تحذيرات متعددة (safer)
✅ تقرير مفصل عن كل حذف
✅ التحقق التلقائي من النتائج
✅ معالجة أخطاء ممتازة
✅ رسائل واضحة بالألوان

### الخطوات:

#### 1️⃣ تثبيت المكتبات

```bash
cd /workspaces/zetsuquids
pip install -r scripts/requirements.txt
```

#### 2️⃣ إعداد متغيرات البيئة

تأكد من أن ملف `.env` يحتوي على:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**كيفية الحصول على المفاتيح:**
1.📱 اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. 🔐 اختر Project → Settings → API
3. 📋 انسخ المفاتيح:
   - `Project URL` → `SUPABASE_URL`
   - `Service Role Secret` → `SUPABASE_SERVICE_KEY`

#### 3️⃣ تشغيل السكريبت

**بدون تحذيرات (Mode Confirmation) - الأفضل:**
```bash
python scripts/nuke_database.py
```

**ثم اكتب التأكيدات:**
1. اكتب: `yes`
2. اكتب: `DELETE ALL DATA`

**بـ Mode إجباري (بدون تأكيدات):**
```bash
python scripts/nuke_database.py --force
```

⚠️ استخدم `--force` فقط إذا كنت متأكداً 100%

### النتيجة المتوقعة:

```
================================================================================
  🔥 SUPABASE DATABASE NUCLEAR RESET 🔥
================================================================================

ℹ️  Step 1: Validating configuration...
✅ Configuration valid
  URL: https://your-project.supabase.co...

ℹ️  Step 2: Initializing Supabase client...
✅ Connection successful

ℹ️  Step 3: Analyzing current database state...
📊 Fetching table sizes...
✅ Total rows in database: 1234

Tables with data:
  • guides: 42 rows
  • zetsuguide_user_profiles: 15 rows
  • posts: 89 rows
  • [etc...]

⚠️  THIS WILL PERMANENTLY DELETE ALL DATA!
⚠️  This action CANNOT be undone!

⚠️  Type 'yes' to proceed: yes
⚠️  Type 'DELETE ALL DATA' to confirm: DELETE ALL DATA

================================================================================
  🔥 DELETING DATA 🔥
================================================================================

[1/38] community_poll_votes     🔥 Deleting... ✅ (42 rows)
[2/38] community_poll_options   🔥 Deleting... ✅ (128 rows)
[3/38] community_polls          🔥 Deleting... ✅ (35 rows)
[...]

================================================================================
  ✅ VERIFYING DELETION ✅
================================================================================

✨ Database is now completely empty! (0 rows)

================================================================================
  📋 DELETION SUMMARY
================================================================================

Total rows BEFORE: 1234
Total rows DELETED: 1234

✅ community_poll_votes     |        42 →        0
✅ community_poll_options   |       128 →        0
✅ community_polls          |        35 →        0
[...]

================================================================================
  🎉 OPERATION COMPLETE 🎉
================================================================================

✅ All data has been successfully deleted!
✅ Your database is now production-ready for testing!
```

---

## الخيار الثاني: SQL مباشرة

### المميزات:
⚡ الأسرع
🔌 بدون الحاجة إلى Python
📊 تنفيذ مباشر في قاعدة البيانات
🎯 يعمل دائماً (حتى لو كان Python غير مثبت)

### الخطوات:

#### 1️⃣ اذهب إلى Supabase

1. 📱 اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. 🔐 اختر Project
3. 🛠️ اضغط على **SQL Editor** من القائمة الجانبية

#### 2️⃣ افتح Script

في المشروع:
```bash
cat /workspaces/zetsuquids/scripts/RESET_DATABASE.sql
```

#### 3️⃣ انسخ الكود

- انسخ محتوى الملف `RESET_DATABASE.sql`

#### 4️⃣ الصق في Supabase

في Supabase SQL Editor:
1. نافذة SQL جديدة
2. الصق الكود
3. اضغط **Execute** (الزر الأزرق في الأعلى)

#### 5️⃣ انتظر النتائج

ستشوف messages مثل:
```
✅ Deleted from community_poll_votes
✅ Deleted from community_poll_options
✅ Deleted from community_polls
[...]
🎉 SUCCESS! Database is now completely empty!
```

---

## اختيار الأسلوب الأنسب

| المعيار | Python Script | SQL Direct |
|--------|---------------|-----------|
| **السهولة** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **الأمان** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **السرعة** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **التقرير** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **الاعتمادية** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**اختياري:**
- ✅ **Python Script**: إذا أردت تحذيرات وتقارير مفصلة
- ✅ **SQL Direct**: إذا كنت في عجلة من الأمر

---

## الجداول المحذوفة

```
📊 Community Features:
   • community_poll_votes
   • community_poll_options
   • community_polls
   • community_post_hashtags
   • community_follows
   • community_notifications
   • post_bookmarks

📊 Posts & Comments:
   • post_likes
   • post_comments
   • posts

📊 Users & Community:
   • community_members
   • community_conversations
   • community_messages
   • community_groups

📊 Guides & Content:
   • guide_versions
   • guide_inline_comments
   • guide_ratings
   • guide_comments
   • guide_time_logs
   • guide_views
   • user_guide_interactions

📊 User Activity:
   • user_follows
   • claimed_rewards
   • user_chatbot_usage
   • zetsuguide_conversations
   • zetsuguide_usage_logs

📊 Support System:
   • support_messages
   • support_conversations
   • bug_reports

📊 UI & Logging:
   • ui_component_likes
   • ui_components
   • usage_logs

📊 Credits & System:
   • zetsuguide_referrals
   • zetsuguide_credits
   • zetsuguide_user_profiles
   • zetsuguide_ads
   • community_hashtags

📊 Main Table:
   • guides (الجدول الرئيسي)

TOTAL: 38 جداول
```

---

## أسئلة شائعة

### ❓ هل ستحذف البيانات من GitHub أيضاً؟

**الإجابة:** ❌ لا، فقط من Supabase
- GitHub Storage يبقى كما هو
- إذا أردت حذفه، يجب تنظيفه يدوياً

### ❓ هل ستحذف Auth Users؟

**الإجابة:** ❌ لا، فقط بيانات الجداول
- Auth users في Supabase Authentication يبقى كما هو
- إذا أردت حذفهم، اذهب إلى Dashboard → Authentication

### ❓ هل يمكن التراجع عن الحذف؟

**الإجابة:** ❌ لا، هذا الإجراء نهائي!
- **تأكد من عمل نسخة احتياطية قبل البدء**
- Supabase backup يمكن استخدامه إذا كان مفعلاً

### ❓ كم وقت يستغرق الحذف؟

**الإجابة:** ⏱️ يعتمد على كمية البيانات
- إذا كان هناك 1000 صف: ~10 ثواني
- إذا كان هناك 100,000 صف: ~1-2 دقيقة

### ❓ ماذا لو فشل الحذف؟

**الإجابة:** 🔧 جرب:

1. تأكد من المفاتيح (`SUPABASE_SERVICE_KEY`)
2. جرب SQL Method بدلاً من Python
3. إعد المحاولة

### ❓ هل يمكن حذف جدول واحد فقط؟

**الإجابة:** ✅ نعم!

**باستخدام Python:**
```python
from supabase import create_client
client = create_client(URL, KEY)
client.table("guides").delete().neq("id", -999999).execute()
```

**باستخدام SQL:**
```sql
DELETE FROM public.guides WHERE true;
```

### ❓ ماذا بعد الحذف؟

**الإجابة:** ✨ استمتع!

1. ✅ Database فارغة تماماً
2. ✅ جاهزة للـ production testing
3. ✅ يمكنك البدء بإضافة بيانات حقيقية

---

## ⚠️ تحذيرات مهمة

### مهم جداً:

1. **عمل نسخة احتياطية:**
   - إذا كان لديك بيانات مهمة، احفظها أولاً
   - Supabase → Settings → Backups

2. **استخدام Service Key:**
   - استخدم `SUPABASE_SERVICE_KEY` وليس `ANON_KEY`
   - `ANON_KEY` قد لا يعمل مع بعض الحذوفات

3. **الإنترنت:**
   - تأكد من الاتصال السليم
   - لا تغلق الـ script أثناء التنفيذ

4. **الصبر:**
   - قد يستغرق دقائق إذا كان هناك بيانات كثيرة
   - لا تلغي العملية في النصف

---

## 🚀 الخطوات النهائية

```bash
# 1. تأكد من .env
cat .env | grep SUPABASE_

# 2. تشغيل الحذف
python scripts/nuke_database.py

# 3. اكتب التأكيدات
# • yes
# • DELETE ALL DATA

# 4. انتظر اكتمال العملية

# 5. تحقق من النتائج
# ✅ Database is now completely empty!

# 6. استمتع بـ production testing! 🎉
```

---

## 📞 الدعم

إذا واجهت مشاكل:

| المشكلة | الحل |
|--------|------|
| `SUPABASE_URL not found` | تأكد من `.env` |
| `SUPABASE_SERVICE_KEY not found` | أضف المفتاح في `.env` |
| `Connection failed` | تحقق من المفاتيح والإنترنت |
| `No module named 'supabase'` | `pip install supabase` |
| الحذف بطيء جداً | يعتمد على كمية البيانات |

---

## ✅ تم!

أنت الآن جاهز لحذف كل البيانات بأمان! 🎉

**Good luck! 🚀**
