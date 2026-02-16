# 🧪 اختبار ميزة Views Tracking بعد الإصلاح

## ✅ السيناريوهات المطلوب اختبارها

### 1. 🔒 منع المؤلف من زيادة المشاهدات

**الخطوات:**

1. سجل دخول بحساب المؤلف
2. افتح guide أنت من قام بإنشائه
3. انزل scroll إلى 85% أو أكثر

**النتيجة المتوقعة:**

```
Console: 🔒 Security: Author cannot record views on their own guide
Views count: لا يزيد
```

**✅ اختبر:** [ ]

---

### 2. ⏰ منع reload المتكرر من زيادة المشاهدات

**الخطوات:**

1. سجل دخول بحساب عادي (ليس المؤلف)
2. افتح guide
3. انزل scroll إلى 85%
4. انتظر 2 ثانية
5. اضغط F5 (reload)
6. انزل scroll مرة أخرى إلى 85%
7. كرر الخطوات 5-6 عدة مرات

**النتيجة المتوقعة:**

```
أول مرة: ✅ View recorded successfully!
المرات التالية: ⏰ View already recorded. Next view allowed in X hours.
Views count: +1 فقط (لا يزيد مع reload)
```

**✅ اختبر:** [ ]

---

### 3. 👤 مستخدم جديد يشاهد guide

**الخطوات:**

1. سجل دخول بحساب مختلف (ليس المؤلف ولم يشاهد من قبل)
2. افتح guide
3. انزل scroll إلى 85%

**النتيجة المتوقعة:**

```
Console: ✅ View recorded successfully!
Views count: يزيد +1
localStorage: يتم حفظ timestamp
```

**✅ اختبر:** [ ]

---

### 4. 🕒 اختبار الـ 24-hour cooldown

**الخطوات:**

1. سجل دخول بحساب عادي
2. افتح guide وسجل view
3. انتظر 24 ساعة + 1 دقيقة
4. افتح نفس الـ guide مرة أخرى
5. انزل scroll إلى 85%

**النتيجة المتوقعة:**

```
بعد 24 ساعة: ✅ View recorded successfully! (مرة أخرى)
Views count: يزيد +1
```

**✅ اختبر:** [ ] (يتطلب انتظار 24 ساعة)

---

### 5. 🌐 زائر anonymous (غير مسجل)

**الخطوات:**

1. افتح المتصفح في Incognito/Private mode
2. افتح guide (بدون تسجيل دخول)
3. انزل scroll إلى 85%
4. اضغط F5 (reload)
5. انزل scroll مرة أخرى

**النتيجة المتوقعة:**

```
أول مرة: ✅ View recorded successfully!
Reload: ⏰ View already recorded. Next view allowed in X hours.
session_id: يتم حفظه في localStorage
Views count: +1 فقط
```

**✅ اختبر:** [ ]

---

### 6. 🚫 اختبار Database Policy (RLS)

**الخطوات:**

1. افتح Supabase Dashboard
2. اذهب إلى Table Editor → guide_views
3. حاول insert يدوياً:

```sql
INSERT INTO guide_views (guide_id, user_id, session_id)
VALUES (
  1, -- guide_id
  'author-user-id-here', -- user_id of the author
  NULL
);
```

**النتيجة المتوقعة:**

```
❌ Error: Policy violation
Message: new row violates row-level security policy
```

**✅ اختبر:** [ ]

---

### 7. 📊 اختبار عرض Views Count

**الخطوات:**

1. افتح guide له views
2. تحقق من badge الأزرق بجانب التاريخ

**النتيجة المتوقعة:**

```
يظهر: 👁️ X views
Format: مع comma للأرقام الكبيرة (1,234 views)
```

**✅ اختبر:** [ ]

---

### 8. 🔄 اختبار Multiple Users

**الخطوات:**

1. User A: يشاهد guide → +1
2. User B: يشاهد نفس الـ guide → +1
3. User C: يشاهد نفس الـ guide → +1
4. User A: يشاهد مرة أخرى (خلال 24 ساعة) → +0
5. User B: reload → +0

**النتيجة المتوقعة:**

```
Total Views: 3
كل user لديه cooldown منفصل
```

**✅ اختبر:** [ ]

---

## 🎯 Checklist النهائي

- [ ] المؤلف لا يستطيع زيادة views لـ guides الخاصة به
- [ ] Reload لا يزيد views
- [ ] 24-hour cooldown يعمل بشكل صحيح
- [ ] Anonymous users لديهم session tracking
- [ ] Database policy يمنع المؤلف
- [ ] Views count يظهر بشكل صحيح
- [ ] Console messages واضحة ومفيدة
- [ ] localStorage يحفظ timestamps

---

## 🐛 كيفية الإبلاغ عن Bug

إذا وجدت أي مشكلة:

1. **وصف المشكلة:**
   - ما الذي كنت تفعله؟
   - ما الذي توقعته أن يحدث؟
   - ما الذي حدث فعلياً؟

2. **Console Output:**

   ```
   انسخ أي رسائل من console
   ```

3. **localStorage Check:**

   ```javascript
   // افتح Console واكتب:
   Object.keys(localStorage).filter((k) => k.includes("guide_view"));
   ```

4. **Database Check:**
   ```sql
   SELECT * FROM guide_views
   WHERE guide_id = YOUR_GUIDE_ID
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

## 📝 Test Results Template

```markdown
## Test Date: **\_**

### Test 1: منع المؤلف

- Status: [ ] Pass [ ] Fail
- Notes: **\*\***\_\_\_**\*\***

### Test 2: منع Reload

- Status: [ ] Pass [ ] Fail
- Notes: **\*\***\_\_\_**\*\***

### Test 3: مستخدم جديد

- Status: [ ] Pass [ ] Fail
- Notes: **\*\***\_\_\_**\*\***

### Test 4: 24h Cooldown

- Status: [ ] Pass [ ] Fail
- Notes: **\*\***\_\_\_**\*\***

### Test 5: Anonymous

- Status: [ ] Pass [ ] Fail
- Notes: **\*\***\_\_\_**\*\***

### Test 6: Database Policy

- Status: [ ] Pass [ ] Fail
- Notes: **\*\***\_\_\_**\*\***

### Test 7: Views Display

- Status: [ ] Pass [ ] Fail
- Notes: **\*\***\_\_\_**\*\***

### Test 8: Multiple Users

- Status: [ ] Pass [ ] Fail
- Notes: **\*\***\_\_\_**\*\***
```

---

## 🎉 عند النجاح

إذا نجحت جميع الاختبارات:

```
✅ Views Tracking System is SECURE!
✅ No spam possible
✅ Authors cannot inflate their own views
✅ 24-hour cooldown working
✅ Database protection active
✅ All scenarios covered
```

**الأمان 100%!** 🔒
