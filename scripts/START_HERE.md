# 🔥 START HERE - حذف البيانات 🔥

## خادم 30 ثانية!

اتبع **واحد فقط** من هذه الخطوات:

---

# ✅ الخيار 1: SQL (الأسرع ⚡)

**الخطوات:**

1. اذهب إلى [Supabase](https://app.supabase.com) → SQL Editor
2. انسخ محتوى: `scripts/RESET_DATABASE.sql`
3. الصق في SQL Editor
4. اضغط **Execute**
5. **تم!** ✅

**الوقت: 30 ثانية**

---

# ✅ الخيار 2: Python (الموصى به ✨)

**الخطوات:**

```bash
# تشغيل
python3 scripts/nuke_database.py

# اكتب عند الطلب:
# 1️⃣  yes
# 2️⃣  DELETE ALL DATA

# تم! ✅
```

**المتطلب الوحيد:**
```
pip install -r scripts/requirements.txt
```

---

# ⚠️ المتطلب: ملف `.env`

**يجب أن يحتوي على:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**الحصول عليهما:**
1. Supabase Dashboard
2. Settings → API
3. انسخ المفاتيح

---

# 📚 توثيق إضافية

| الملف | الوصف |
|------|-------|
| `QUICK_START.md` | بدء سريع |
| `README.md` | نظرة عامة |
| `RESET_COMPLETE_GUIDE.md` | دليل شامل (تفصيل كامل) |
| `DATABASE_RESET_GUIDE.md` | معلومات إضافية |

---

# 🎯 النتيجة

```
✅ Database completely empty
✅ 0 rows remaining
✅ Ready for production testing
✅ All 38 tables cleared
```

---

# 🆘 مشاكل سريعة؟

**SQL لا يعمل؟**
→ جرب Python

**Python لا يعمل؟**
→ تأكد من `pip install supabase`

**كلاهما لا يعمل؟**
→ تحقق من `.env` والمفاتيح

---

## 🚀 Ready?

اختر واحد وابدأ!

**SQL؟** ← الأسرع
**Python؟** ← الأكثر أماناً

---

**Good luck! 🎉**
