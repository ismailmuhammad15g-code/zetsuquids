-- Add author_email column to marketplace_scripts
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS author_email TEXT;

-- Backfill existing scripts from seller_support
UPDATE marketplace_scripts ms
SET author_email = ss.email
FROM seller_support ss
WHERE ms.author_id::text = ss.seller_id
AND ms.author_email IS NULL;

-- Backfill from user profiles (both columns are uuid)
UPDATE marketplace_scripts ms
SET author_email = zp.user_email
FROM zetsuguide_user_profiles zp
WHERE ms.author_id = zp.user_id
AND ms.author_email IS NULL;
