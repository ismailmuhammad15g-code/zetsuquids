-- ==================================================================================
-- ترقية حساب المؤسس (إسماعيل) إلى مدير خارق (Super Admin)
-- ==================================================================================
-- هذا الملف يحتوي على أوامر SQL لتعديل قواعد الحماية (Row Level Security - RLS)
-- في قاعدة بيانات Supabase. الهدف هو إعطاء الصلاحية المطلقة للإيميل الخاص بك
-- للتعديل، الحذف، والإضافة في أي مكان بالموقع (تحديداً الأدلة Guides) وتجاوز كل القيود.
-- 
-- الإيميل المستهدف: ismailmuhammad15g@gmail.com
--
-- طريقة الاستخدام:
-- 1. افتح لوحة تحكم Supabase
-- 2. اذهب إلى SQL Editor
-- 3. أنشئ استعلام جديد (New Query)
-- 4. انسخ كل هذا الكود والصقه هناك، ثم اضغط على RUN
-- ==================================================================================

-- أولاً: إعطاء صلاحية مطلقة للمدير الخارق على جدول الأدلة (Guides)
-- هذا الكود يضمن أن الإيميل المحدد لديه صلاحيات (ALL) ليفعل أي شيء
DROP POLICY IF EXISTS "Superadmin full access to guides" ON guides;
CREATE POLICY "Superadmin full access to guides"
ON guides
FOR ALL
USING (auth.jwt() ->> 'email' = 'ismailmuhammad15g@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'ismailmuhammad15g@gmail.com');

-- ثانياً: تحديث سياسة "حذف الدليل" لكي تسمح إما لصاحب الدليل الأصلي، أو للمدير الخارق بالحذف
DROP POLICY IF EXISTS "Users can delete their own guides" ON guides;
CREATE POLICY "Users can delete their own guides" ON guides 
FOR DELETE
USING (
    auth.jwt() ->> 'email' = user_email 
    OR auth.jwt() ->> 'email' = 'ismailmuhammad15g@gmail.com'
);

-- ثالثاً: تحديث سياسة "تعديل الدليل" لكي تسمح إما لصاحب الدليل الأصلي، أو للمدير الخارق بالتعديل
-- (مما يسمح لك بإضافة صورة الغلاف لأي شخص، وتعديل المحتوى، إلخ)
DROP POLICY IF EXISTS "Users can update their own guides" ON guides;
CREATE POLICY "Users can update their own guides" ON guides 
FOR UPDATE
USING (
    auth.jwt() ->> 'email' = user_email 
    OR auth.jwt() ->> 'email' = 'ismailmuhammad15g@gmail.com'
);

-- (اختياري) رابعاً: إعطاء صلاحية مطلقة للمدير الخارق على جدول التعليقات إذا رغبت في حذفها
DROP POLICY IF EXISTS "Superadmin full access to comments" ON guide_comments;
CREATE POLICY "Superadmin full access to comments"
ON guide_comments
FOR ALL
USING (auth.jwt() ->> 'email' = 'ismailmuhammad15g@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'ismailmuhammad15g@gmail.com');

-- تمت الترقية بنجاح! 🎉
