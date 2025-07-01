-- Ensure all required tables exist with proper structure

-- First, let's check and create the main waitlist_submissions table
CREATE TABLE IF NOT EXISTS waitlist_submissions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    source VARCHAR(100),
    location VARCHAR(255),
    parent_location VARCHAR(255),
    care_needs TEXT,
    care_plan TEXT,
    care_plan_interest TEXT,
    waitlist_number INTEGER,
    referred_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist_submissions(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON waitlist_submissions(referred_by);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES waitlist_submissions(id) ON DELETE CASCADE,
    referred_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_email)
);

-- Create referral_details table for more detailed tracking
CREATE TABLE IF NOT EXISTS referral_details (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES waitlist_submissions(id) ON DELETE CASCADE,
    referred_email VARCHAR(255) NOT NULL,
    referred_id INTEGER REFERENCES waitlist_submissions(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_email)
);

-- Add waitlist_number if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waitlist_submissions' 
        AND column_name = 'waitlist_number'
    ) THEN
        ALTER TABLE waitlist_submissions ADD COLUMN waitlist_number INTEGER;
        
        -- Update existing records with waitlist numbers
        WITH numbered_submissions AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
            FROM waitlist_submissions
            WHERE waitlist_number IS NULL
        )
        UPDATE waitlist_submissions 
        SET waitlist_number = numbered_submissions.rn
        FROM numbered_submissions
        WHERE waitlist_submissions.id = numbered_submissions.id;
    END IF;
END $$;

-- Add referred_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waitlist_submissions' 
        AND column_name = 'referred_by'
    ) THEN
        ALTER TABLE waitlist_submissions ADD COLUMN referred_by VARCHAR(255);
        CREATE INDEX idx_waitlist_referred_by ON waitlist_submissions(referred_by);
    END IF;
END $$;

-- Show table structure for verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('waitlist_submissions', 'referrals', 'referral_details')
ORDER BY table_name, ordinal_position;

-- Show current data count
SELECT 
    'waitlist_submissions' as table_name,
    COUNT(*) as record_count
FROM waitlist_submissions
UNION ALL
SELECT 
    'referrals' as table_name,
    COUNT(*) as record_count
FROM referrals
UNION ALL
SELECT 
    'referral_details' as table_name,
    COUNT(*) as record_count
FROM referral_details;
