-- 1. وظيفة لزيادة عدد المشاهدات بشكل آمن
CREATE OR REPLACE FUNCTION increment_post_view(post_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. تصحيح صلاحيات تحديث المجتمعات (Community Groups)
-- المشكلة كانت في نقص سياسة UPDATE التي تسمح لمنشئ المجتمع بتعديله
DROP POLICY IF EXISTS "Creators can update their own groups" ON community_groups;
CREATE POLICY "Creators can update their own groups" ON community_groups 
FOR UPDATE USING (auth.uid() = creator_id);

-- 3. تأكيد صلاحيات العرض والإضافة
DROP POLICY IF EXISTS "Anyone can view groups" ON community_groups;
CREATE POLICY "Anyone can view groups" ON community_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can create groups" ON community_groups;
CREATE POLICY "Auth users can create groups" ON community_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
