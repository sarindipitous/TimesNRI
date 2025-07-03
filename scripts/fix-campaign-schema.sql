-- Fix email campaigns table schema
-- This script addresses the missing updated_at column and ensures proper campaign table structure

-- Step 1: Add missing updated_at column if it doesn't exist
DO $$ 
BEGIN
    -- Check if updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_campaigns' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE email_campaigns ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to email_campaigns table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in email_campaigns table';
    END IF;
END $$;

-- Step 2: Update existing records to have updated_at value
UPDATE email_campaigns 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Step 3: Create trigger function to automatically update updated_at on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Ensure email_campaign_logs table exists with proper structure
CREATE TABLE IF NOT EXISTS email_campaign_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    email_service VARCHAR(50),
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON email_campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON email_campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_recipient_email ON email_campaign_logs(recipient_email);

-- Step 7: Verify the schema is correct
SELECT 'email_campaigns table schema:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'email_campaigns' 
ORDER BY ordinal_position;

SELECT 'email_campaign_logs table schema:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'email_campaign_logs' 
ORDER BY ordinal_position;

-- Step 8: Check for any data integrity issues
SELECT 'Campaigns without updated_at:' as info;
SELECT COUNT(*) as count FROM email_campaigns WHERE updated_at IS NULL;

SELECT 'Total campaigns:' as info;
SELECT COUNT(*) as count FROM email_campaigns;

SELECT 'Total campaign logs:' as info;
SELECT COUNT(*) as count FROM email_campaign_logs;

-- Step 9: Check campaigns with selected targeting for potential issues
SELECT 'Campaigns with selected targeting:' as info;
SELECT id, name, target_type, 
       CASE 
           WHEN selected_recipients IS NULL THEN 'NULL'
           WHEN selected_recipients = '[]' THEN 'EMPTY_ARRAY'
           ELSE 'HAS_DATA'
       END as selected_recipients_status,
       total_recipients, status
FROM email_campaigns 
WHERE target_type = 'selected'
ORDER BY id;

-- Step 10: Final verification message
SELECT 'Schema fix completed successfully!' as result;
