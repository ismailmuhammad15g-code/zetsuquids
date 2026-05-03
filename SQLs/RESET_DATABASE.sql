-- 1. حذف النسخ التابعة للأدلة أولا حتى لا يمنعنا النظام
DELETE FROM guide_versions;

-- 2. إبادة جميع الأدلة الوهمية أو الحقيقية
DELETE FROM guides;

-- 3. للتأكد من انقراضها:
SELECT count(*) as total_guides_left FROM guides;
