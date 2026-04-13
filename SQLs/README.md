# 📊 SQL Files Index - ZetsuGuide Project

## 📋 نظرة عامة
هذا المجلد يحتوي على **62 ملف SQL** من مشروع ZetsuGuide. تم جمعها من كل المشروع لتسهيل الوصول والإدارة.

---

## 🗂️ تصنيف الملفات

### 1️⃣ **ملفات الإعداد الأساسية** (Setup Files)
```
✅ supabase-setup.sql               - الإعداد الأساسي لـ Supabase
✅ COMPLETE_SETUP.sql                - الإعداد الكامل للمشروع
✅ setup_profiles.sql                - إعداد جداول الملفات الشخصية
✅ setup_usage_logs.sql              - إعداد جداول السجلات
✅ setup_follow_system.sql           - إعداد نظام المتابعة
```

### 2️⃣ **ملفات نظام الرصيد والمكافآت** (Credits System)
```
✅ zetsuguide-credits.sql                    - نظام الرصيد الرئيسي
✅ create_credits_table.sql                  - إنشاء جدول الأرصدة
✅ credit_fix_with_counter_calculate.sql     - إصلاح الأرصدة
✅ daily_credits.sql                         - نظام الأرصدة اليومية
✅ deduct_credits_rpc.sql                    - خصم الأرصدة
✅ fix_credits_schema.sql                    - إصلاح مخطط الأرصدة
✅ fix-credits-now.sql                       - إصلاح سريع للأرصدة
✅ fix_daily_credits_function.sql            - إصلاح وظيفة الأرصدة اليومية
✅ supabase_migration_credit_reservation.sql - ترحيل حجز الأرصدة
```

### 3️⃣ **ملفات نظام الإحالة** (Referral System)
```
✅ fix-referral-credits.sql           - إصلاح أرصدة الإحالة
✅ fix_referral_bonus.sql             - إصلاح مكافآت الإحالة
✅ fix_referral_bonus_v2.sql          - تحديث مكافآت الإحالة
✅ fix_referral_direct.sql            - إصلاح الإحالات المباشرة
✅ recover_referrals.sql              - استرجاع الإحالات
✅ recalculate_referrals.sql          - إعادة حساب الإحالات
✅ CHECK_REFERRALS.sql                - التحقق من الإحالات
```

### 4️⃣ **ملفات استخدام النظام** (Usage & Analytics)
```
✅ create_usage_logs_table.sql        - إنشاء جدول السجلات
✅ fix_usage_logs_rls.sql             - إصلاح سياسات الأمان للسجلات
✅ setup_usage_logs.sql               - إعداد سجلات الاستخدام
✅ track_time_spent.sql               - تتبع الوقت المستغرق
✅ check_user_credits.sql             - التحقق من أرصدة المستخدم
```

### 5️⃣ **ملفات نظام المتابعة والتفاعل** (Follow & Interaction)
```
✅ setup_follow_system.sql            - إعداد نظام المتابعة
✅ create_recommendations_system.sql  - إنشاء نظام التوصيات
✅ 20260213_create_community_posts.sql - إنشاء مشاركات المجتمع
✅ 20260213_community_interactions.sql - تفاعلات المجتمع
✅ 20260213_likes_rpc.sql             - وظيفة الإعجابات
✅ community_hashtag_trigger.sql      - فعّال الهاشتاج في المجتمع
✅ FIX_COMMUNITY_FULL.sql             - إصلاح المجتمع الكامل
✅ FIX_COMMUNITY_PHASE_1.sql          - مرحلة إصلاح المجتمع 1
```

### 6️⃣ **ملفات الإصلاحات العامة** (General Fixes)
```
✅ fix_all_fks.sql                    - إصلاح جميع المفاتيح الخارجية
✅ fix_database_constraints.sql       - إصلاح قيود قاعدة البيانات
✅ fix_unread_counts.sql              - إصلاح عدادات غير المقروءة
✅ force_fix_constraints.sql          - فرض إصلاح القيود
✅ simple_fix.sql                     - إصلاح بسيط
✅ FIX_IMMEDIATELY.sql                - إصلاح فوري
✅ FIX-SUPABASE-TABLE.sql             - إصلاح جداول Supabase
✅ fix-slug-column.sql                - إصلاح عمود الرابط
✅ fix-chat-history-rls.sql           - إصلاح سياسات سجل الدردشة
✅ RESET_STATS.sql                    - إعادة تعيين الإحصائيات
```

### 7️⃣ **ملفات الميزات الإضافية** (Features)
```
✅ chat-history-table.sql             - جدول سجل الدردشة
✅ chatbot_usage.sql                  - استخدام Chatbot
✅ commentsystem.sql                  - نظام التعليقات
✅ create_bug_reports_table.sql       - جدول تقارير الأخطاء
✅ create_support_chat_schema.sql     - مخطط دردشة الدعم
✅ delete_and_cleanup_support_chat.sql - حذف وتنظيف دردشة الدعم
✅ rating.sql                         - نظام التقييمات
✅ guide_views_table.sql              - جدول مشاهدات الأدلة
✅ add_image_support.sql              - دعم الصور
✅ add_bio_column.sql                 - إضافة عمود السيرة
✅ add_onboarding_flag.sql            - إضافة علم الإعداد
✅ add_status_column.sql              - إضافة عمود الحالة
✅ add_author_fields_to_guides.sql    - إضافة حقول المؤلف للأدلة
```

### 8️⃣ **ملفات المصادقة والأمان** (Auth & Security)
```
✅ guides_rls_policies.sql            - سياسات الأمان للأدلة
✅ reset_chatbot_tokens.sql           - إعادة تعيين رموز Chatbot
✅ reset_reserved_credits.sql         - إعادة تعيين الأرصدة المحجوزة
✅ secure_claim_task.sql              - مطالبة آمنة بالمهام
✅ secure_claim_task_v2.sql           - مطالبة آمنة بالمهام v2
```

### 9️⃣ **ملفات الحذف وإدارة الحسابات** (Deletion & Account Management)
```
✅ deleteaccounts.sql                 - حذف الحسابات
```

### 🔟 **ملفات الترحيل والتحديثات** (Migrations)
```
✅ MIGRATION_001_add_author_system.sql    - ترحيل 001: إضافة نظام المؤلف
✅ 20260213_setup_guide_versions.sql      - إعداد إصدارات الأدلة
✅ 20260213_community_interactions.sql    - ترحيل التفاعلات
✅ badge_migration.sql                    - ترحيل الشارات
```

### ⚠️ **ملفات التصحيح والمراقبة** (Debug & Monitoring)
```
✅ debug_conversations.sql            - تصحيح المحادثات
```

---

## 🚀 كيفية الاستخدام

### **تشغيل الملفات في Supabase:**

#### الطريقة 1: تشغيل ملف واحد
```sql
1. افتح Supabase Dashboard
2. انتقل إلى SQL Editor
3. انسخ محتوى أي ملف .sql
4. الصق في محرر SQL
5. اضغط "Run"
```

#### الطريقة 2: تشغيل متتالي (الترتيب الموصى به)
```
1. ابدأ بـ: supabase-setup.sql
2. ثم: COMPLETE_SETUP.sql
3. ثم: setup_profiles.sql
4. ثم: setup_usage_logs.sql
5. ثم باقي الملفات حسب الحاجة
```

#### الطريقة 3: استخدام CLI (سطر الأوامر)
```bash
# تثبيت Supabase CLI أولاً
npm install -g supabase

# تشغيل ملف SQL
supabase db push < SQLs/supabase-setup.sql
```

---

## 📊 إحصائيات الملفات

| الفئة | عدد الملفات |
|-------|-----------|
| ملفات الإعداد | 5 |
| ملفات نظام الرصيد | 9 |
| ملفات الإحالة | 7 |
| ملفات الاستخدام | 5 |
| ملفات المتابعة | 8 |
| ملفات الإصلاح العامة | 11 |
| ملفات الميزات | 13 |
| ملفات الأمان | 5 |
| ملفات الحذف | 1 |
| ملفات الترحيل | 4 |
| **المجموع** | **62** |

---

## ⚠️ تنبيهات مهمة

### ⛔ **لا تشغل هذه الملفات بدون فهم محتواها:**
- `deleteaccounts.sql` - يحذف بيانات المستخدمين
- أي ملف يبدأ بـ `FIX_` أو `RESET_` قد يعدل بيانات قيمة

### ✅ **قبل تشغيل أي ملف:**
1. **خذ نسخة احتياطية** من قاعدة البيانات
2. **اقرأ التعليقات** في بداية الملف
3. **فهم الغرض** من الملف
4. **اختبر على بيئة تطوير** أولاً

### 🔐 **ملفات حساسة:**
- `supabase-setup.sql` - يُنشئ الجداول الأساسية
- `COMPLETE_SETUP.sql` - إعداد كامل
- أي ملف يتضمن RLS (Row Level Security)

---

## 📝 ملاحظات إضافية

- جميع الملفات باللغة **SQL قياسية**
- معظم الملفات مخصصة لـ **Supabase PostgreSQL**
- بعض الملفات تحتوي على **Functions** و **RPC Procedures**
- الملفات منظمة حسب **الميزة والغرض**

---

## 🆘 الدعم

إذا واجهت أي مشاكل:
- تحقق من **تعليقات الملف** (بداية كل ملف)
- راجع **سجل الأخطاء** في Supabase
- تواصل مع: **zetsuserv@gmail.com**

---

**آخر تحديث:** 2026-04-12
**عدد الملفات:** 62 ملف SQL
**الحجم الإجمالي:** جميع ملفات المشروع
