-- First, let's check if the column exists and add it if it doesn't
DO $$ 
BEGIN
    -- Check if care_plan_interest column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waitlist_submissions' 
        AND column_name = 'care_plan_interest'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE waitlist_submissions ADD COLUMN care_plan_interest TEXT;
        RAISE NOTICE 'Added care_plan_interest column';
    ELSE
        RAISE NOTICE 'care_plan_interest column already exists';
    END IF;
    
    -- Also check if care_plan column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waitlist_submissions' 
        AND column_name = 'care_plan'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE waitlist_submissions ADD COLUMN care_plan TEXT;
        RAISE NOTICE 'Added care_plan column';
    ELSE
        RAISE NOTICE 'care_plan column already exists';
    END IF;
END $$;
