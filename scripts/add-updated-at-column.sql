-- Add updated_at column to email_campaigns table
-- This script safely adds the missing updated_at column

DO $$ 
BEGIN
    -- Check if updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_campaigns' AND column_name = 'updated_at'
    ) THEN
        -- Add the updated_at column
        ALTER TABLE email_campaigns ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing records to have updated_at = created_at
        UPDATE email_campaigns 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE 'Added updated_at column to email_campaigns table and populated existing records';
    ELSE
        RAISE NOTICE 'updated_at column already exists in email_campaigns table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'email_campaigns' AND column_name = 'updated_at';

-- Show sample of updated records
SELECT id, name, created_at, updated_at 
FROM email_campaigns 
ORDER BY id DESC 
LIMIT 3;
