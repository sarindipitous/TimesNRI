-- Ensure all required columns exist in waitlist_submissions table
-- This script is safe to run multiple times

-- Add care_plan column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='waitlist_submissions' AND column_name='care_plan') THEN
        ALTER TABLE waitlist_submissions ADD COLUMN care_plan TEXT;
    END IF;
END $$;

-- Add care_plan_interest column if it doesn't exist (this is the textbox field)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='waitlist_submissions' AND column_name='care_plan_interest') THEN
        ALTER TABLE waitlist_submissions ADD COLUMN care_plan_interest TEXT;
    END IF;
END $$;

-- Add waitlist_number column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='waitlist_submissions' AND column_name='waitlist_number') THEN
        ALTER TABLE waitlist_submissions ADD COLUMN waitlist_number SERIAL;
    END IF;
END $$;

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'waitlist_submissions' 
ORDER BY ordinal_position;
