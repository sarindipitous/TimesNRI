-- Check what columns exist in the waitlist_submissions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'waitlist_submissions' 
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'waitlist_submissions'
) as table_exists;

-- Show a sample of existing data to see what fields are populated
SELECT * FROM waitlist_submissions LIMIT 5;
