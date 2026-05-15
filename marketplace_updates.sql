-- إنشاء جدول التعليقات للسكربتات
CREATE TABLE IF NOT EXISTS marketplace_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES marketplace_scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name VARCHAR(255) DEFAULT 'User',
  author_avatar TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- تفعيل حماية RLS للتعليقات
ALTER TABLE marketplace_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public comments viewable" ON marketplace_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON marketplace_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- إضافة أعمدة بيانات المستخدم للمراجعات (التقييمات)
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS author_name VARCHAR(255) DEFAULT 'User';
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS author_avatar TEXT;

-- تحديث سياسات الحماية للمشتريات لتسمح للمستخدم بإضافة شراء (لمحاكاة الشراء)
DROP POLICY IF EXISTS "Users can insert purchases" ON marketplace_purchases;
CREATE POLICY "Users can insert purchases" ON marketplace_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can view own purchases" ON marketplace_purchases FOR SELECT USING (auth.uid() = buyer_id);
