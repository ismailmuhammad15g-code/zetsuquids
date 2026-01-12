-- ⚠️ هذا سيحذف الجدول القديم ويعيد إنشاءه
-- شغل هذا في Supabase SQL Editor

-- حذف الجدول القديم
DROP TABLE IF EXISTS guides CASCADE;

-- إنشاء الجدول الجديد
CREATE TABLE guides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  markdown TEXT DEFAULT '',
  html_content TEXT DEFAULT '',
  css_content TEXT DEFAULT '',
  keywords TEXT[] DEFAULT '{}',
  content_type TEXT DEFAULT 'markdown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل الوصول العام
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح بكل العمليات
CREATE POLICY "Allow all operations" ON guides
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- إنشاء index للبحث السريع
CREATE INDEX idx_guides_slug ON guides (slug);
CREATE INDEX idx_guides_created_at ON guides (created_at DESC);
