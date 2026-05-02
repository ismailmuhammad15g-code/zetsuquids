# 🔥 Database Reset Scripts 🔥

حذف كامل وآمن وموثوق لكل البيانات من Supabase!

---

## 🚀 البدء السريع

### الطريقة الأولى: Python Script (الموصى به)

```bash
cd /workspaces/zetsuquids

# تثبيت المكتبات
pip install -r scripts/requirements.txt

# تشغيل السكريبت
python3 scripts/nuke_database.py
```

**ثم اكتب:**
1. `yes`
2. `DELETE ALL DATA`

### الطريقة الثانية: SQL مباشرة (الأسرع)

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر **SQL Editor**
3. انسخ محتوى `scripts/RESET_DATABASE.sql`
4. الصقه وشغّل **Execute**

---

## 📂 الملفات

- **`nuke_database.py`** - السكريبت الرئيسي (Python)
- **`RESET_DATABASE.sql`** - السكريبت بـ SQL
- **`requirements.txt`** - مكتبات Python المطلوبة
- **`run_reset.sh`** - launcher سهل (اختياري)
- **`RESET_COMPLETE_GUIDE.md`** - دليل شامل
- **`README.md`** - هذا الملف

---

## ⚙️ المتطلبات

### المفاتيح المطلوبة في `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### كيفية الحصول على المفاتيح:

1. 📱 Supabase Dashboard → Project
2. 🔐 Settings → API
3. 📋 انسخ:
   - `Project URL` → `SUPABASE_URL`
   - `Service Role Secret` → `SUPABASE_SERVICE_KEY`

---

## ⚠️ تحذيرات مهمة

1. **هذا الإجراء نهائي!** - لا يمكن التراجع عنه
2. **عمل نسخة احتياطية** - قبل التشغيل
3. **استخدام Service Key** - وليس Anon Key
4. **الاتصال بالإنترنت** - تأكد من الاتصال السليم

---

## 🎯 ماذا سيتم حذفه؟

✅ **38 جدول** من Supabase:
- كل الـ Guides
- كل المستخدمين والملفات
- كل المنشورات والتعليقات
- كل البيانات الأخرى
- **الكل 0 rows**

❌ **ما لن يتم حذفه:**
- GitHub Storage (بيانات منفصلة)
- Supabase Auth Users (إذا أردت حذفهم، اذهب إلى Dashboard)

---

## 📖 دليل شامل

للحصول على دليل كامل مع شرح مفصل:

```bash
cat scripts/RESET_COMPLETE_GUIDE.md
```

أو زيارة: `scripts/RESET_COMPLETE_GUIDE.md`

---

## 🆘 حل المشاكل

| المشكلة | الحل |
|--------|------|
| `SUPABASE_URL not found` | تحقق من `.env` |
| `SUPABASE_SERVICE_KEY not found` | أضف المفتاح في `.env` |
| `Connection failed` | تحقق من المفاتيح والإنترنت |
| `No module named 'supabase'` | `pip install supabase` |

---

## ✅ النتيجة المتوقعة

```
✨ Database is now completely empty! (0 rows)

✅ All data has been successfully deleted!
✅ Your database is now production-ready for testing!
```

---

## 🎉 تم!

Database الخاص بك الآن فارغ تماماً وجاهز للـ production testing!

**Good luck! 🚀**
