# 🔥 حذف البيانات - تعليمات سريعة 🔥

## ⚡ الطريقة الأسرع (SQL)

### الخطوات:

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اضغط **SQL Editor** (القائمة اليسرى)
3. انسخ: `cat scripts/RESET_DATABASE.sql`
4. الصق في SQL Editor
5. اضغط **Execute** (الزر الأزرق)
6. انتظر النتائج ✅

**الوقت: ~30 ثانية**

---

## 🐍 الطريقة الآمنة (Python)

### الخطوات:

```bash
# 1. تثبيت المكتبات
pip install -r scripts/requirements.txt

# 2. تشغيل السكريبت
python3 scripts/nuke_database.py

# 3. اكتب:
#    yes
#    DELETE ALL DATA

# 4. انتظر اكتمال العملية
```

**الوقت: ~1-2 دقائق (مع التأكيدات)**

---

## 🚀 النتيجة النهائية

```
✅ Database is now completely empty!
✨ All data has been deleted!
🎉 Ready for production testing!
```

---

## 📋 الملفات المتاحة

| الملف | الوصف |
|------|-------|
| `nuke_database.py` | سكريبت Python الرئيسي (الموصى به) |
| `reset_simple.py` | سكريبت Python بسيط (backup) |
| `RESET_DATABASE.sql` | سكريبت SQL مباشر (الأسرع) |
| `requirements.txt` | مكتبات Python |
| `run_reset.sh` | واجهة shell (اختياري) |
| `RESET_COMPLETE_GUIDE.md` | دليل شامل |

---

## ⚠️ المتطلب الواحيد

**.env** يجب أن يحتوي على:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**كيفية الحصول:**
- Dashboard → Settings → API
- انسخ `Project URL` و `Service Role Secret`

---

## 🆘 مشاكل شائعة

**❌ SUPABASE_URL not found**
→ أضفه في `.env`

**❌ SUPABASE_SERVICE_KEY not found**
→ أضفه في `.env`

**❌ Connection failed**
→ تحقق من المفاتيح صحيحة

**❌ No module named 'supabase'**
→ `pip install supabase`

---

## 🎯 اختر الطريقة:

| المعيار | SQL | Python |
|--------|-----|--------|
| السرعة | ⚡⚡⚡ | ⚡⚡ |
| الأمان | ✅✅✅ | ✅✅✅✅✅ |
| التقרير | ✅✅ | ✅✅✅✅✅ |
| سهوله | ✅✅✅ | ✅✅✅✅ |

**اختياري:**
- SQL إذا كنت في عجلة
- Python إذا أردت تأكيدات وتقارير

---

## ✅ جاهز؟

```bash
# الخيار 1: Python
python3 scripts/nuke_database.py

# الخيار 2: SQL
# انسخ RESET_DATABASE.sql وشغل في Supabase
```

---

**Good luck! 🎉**
