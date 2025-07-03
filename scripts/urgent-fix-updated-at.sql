-- URGENT FIX: Add missing updated_at column to email_campaigns table
-- This fixes the "record 'new' has no field 'updated_at'" error

-- Step 1: Add the missing updated_at column
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Update existing records to have updated_at values
UPDATE email_campaigns 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Step 3: Verify the fix
SELECT 'Schema fix verification:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'email_campaigns' AND column_name = 'updated_at';

-- Step 4: Check data integrity
SELECT 'Data integrity check:' as status;
SELECT COUNT(*) as total_campaigns FROM email_campaigns;
SELECT COUNT(*) as campaigns_with_updated_at FROM email_campaigns WHERE updated_at IS NOT NULL;
SELECT COUNT(*) as campaigns_missing_updated_at FROM email_campaigns WHERE updated_at IS NULL;

SELECT 'Fix completed - you can now send campaigns!' as result;
