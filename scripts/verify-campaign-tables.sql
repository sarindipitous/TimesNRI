-- Verify that email campaign tables exist and have correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('email_campaigns', 'email_campaign_logs')
ORDER BY table_name, ordinal_position;

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('email_campaigns', 'email_campaign_logs');

-- Count existing campaigns (if any)
SELECT 
    'email_campaigns' as table_name,
    COUNT(*) as row_count
FROM email_campaigns
UNION ALL
SELECT 
    'email_campaign_logs' as table_name,
    COUNT(*) as row_count
FROM email_campaign_logs;

-- Check for any existing campaigns and their status
SELECT 
    id,
    name,
    status,
    target_type,
    total_recipients,
    sent_count,
    failed_count,
    created_at
FROM email_campaigns
ORDER BY created_at DESC
LIMIT 10;
