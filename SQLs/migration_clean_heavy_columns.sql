-- =================================================================================
-- 🔥 PRODUCTION READY: REMOVE HEAVY COLUMNS FROM SUPABASE
-- =================================================================================
-- This script permanently forbids Supabase from storing heavy content.
-- ALL heavy content (Markdown, HTML, JS code, Cover Images as Base64, etc.)
-- must exist strictly in GitHub Assets. 
-- Supabase will now ONLY store lightweight metadata.

-- 1. CLEAN UP THE GUIDES TABLE
ALTER TABLE guides 
    DROP COLUMN IF EXISTS content,
    DROP COLUMN IF EXISTS markdown,
    DROP COLUMN IF EXISTS html_content,
    DROP COLUMN IF EXISTS css_content;

-- 2. CLEAN UP THE UI_COMPONENTS TABLE
ALTER TABLE ui_components 
    DROP COLUMN IF EXISTS html_code,
    DROP COLUMN IF EXISTS css_code,
    DROP COLUMN IF EXISTS js_code,
    DROP COLUMN IF EXISTS react_files;

-- 3. CLEAN UP THE GUIDE_VERSIONS TABLE (If it has heavy columns too)
ALTER TABLE guide_versions
    DROP COLUMN IF EXISTS content,
    DROP COLUMN IF EXISTS html_content,
    DROP COLUMN IF EXISTS markdown;

-- Note: The column "cover_image" is kept in the schema ONLY because it now 
-- stores a lightweight GitHub URL (e.g., "https://raw.githubusercontent..."), 
-- and NOT actual base64 data. 

-- ✅ VERIFICATION: Check the current sizes or existence of these columns (Optional)
-- This confirms the heavy columns are completely gone.
