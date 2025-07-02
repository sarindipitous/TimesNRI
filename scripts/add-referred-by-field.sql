-- Add referred_by field to waitlist_submissions table if it doesn't exist
DO $$ 
BEGIN
    -- Check if referred_by column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waitlist_submissions' 
        AND column_name = 'referred_by'
    ) THEN
        ALTER TABLE waitlist_submissions 
        ADD COLUMN referred_by VARCHAR(255);
        
        RAISE NOTICE 'Added referred_by column to waitlist_submissions table';
    ELSE
        RAISE NOTICE 'referred_by column already exists in waitlist_submissions table';
    END IF;
END $$;

-- Create index for better performance on referral queries
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_referred_by 
ON waitlist_submissions(referred_by);

-- Show current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'waitlist_submissions' 
ORDER BY ordinal_position;
