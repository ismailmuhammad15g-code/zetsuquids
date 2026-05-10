-- 1. وظيفة لزيادة عدد المشاهدات بشكل آمن (ضروري جداً)
-- تم نقل العملية لجهة السيرفر لتجنب أخطاء المتصفح وصلاحيات الـ RLS
CREATE OR REPLACE FUNCTION increment_post_view(post_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. تأكيد صلاحيات التحديث (اختياري ولكن مفضل)
DROP POLICY IF EXISTS "Anyone can increment views_count" ON posts;
CREATE POLICY "Anyone can increment views_count" ON posts
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true); 
