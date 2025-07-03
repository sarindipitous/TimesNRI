-- Verify email campaigns tables exist and have correct structure
DO $$
BEGIN
    -- Check if email_campaigns table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
        RAISE NOTICE '✅ email_campaigns table exists';
        
        -- Check table structure
        PERFORM column_name FROM information_schema.columns 
        WHERE table_name = 'email_campaigns' AND column_name = 'id';
        IF FOUND THEN
            RAISE NOTICE '✅ email_campaigns has correct structure';
        ELSE
            RAISE NOTICE '❌ email_campaigns missing required columns';
        END IF;
    ELSE
        RAISE NOTICE '❌ email_campaigns table does not exist';
        RAISE NOTICE '📋 Run: scripts/create-email-campaigns-table.sql';
    END IF;

    -- Check if email_campaign_logs table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_campaign_logs') THEN
        RAISE NOTICE '✅ email_campaign_logs table exists';
        
        -- Check table structure
        PERFORM column_name FROM information_schema.columns 
        WHERE table_name = 'email_campaign_logs' AND column_name = 'campaign_id';
        IF FOUND THEN
            RAISE NOTICE '✅ email_campaign_logs has correct structure';
        ELSE
            RAISE NOTICE '❌ email_campaign_logs missing required columns';
        END IF;
    ELSE
        RAISE NOTICE '❌ email_campaign_logs table does not exist';
        RAISE NOTICE '📋 Run: scripts/create-email-campaigns-table.sql';
    END IF;

    -- Check existing campaigns
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
        DECLARE
            campaign_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO campaign_count FROM email_campaigns;
            RAISE NOTICE '📊 Found % existing campaigns', campaign_count;
        END;
    END IF;

    -- Check waitlist integration
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'waitlist_submissions') THEN
        DECLARE
            waitlist_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO waitlist_count FROM waitlist_submissions;
            RAISE NOTICE '👥 Found % waitlist submissions for targeting', waitlist_count;
        END;
    ELSE
        RAISE NOTICE '⚠️ waitlist_submissions table not found - campaigns may not work';
    END IF;

END $$;

-- Show table structures for verification
\d email_campaigns;
\d email_campaign_logs;

-- Show sample data if any exists
SELECT 'EXISTING CAMPAIGNS:' as info;
SELECT id, name, status, target_type, total_recipients, created_at 
FROM email_campaigns 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'RECENT CAMPAIGN LOGS:' as info;
SELECT cl.campaign_id, cl.recipient_email, cl.status, cl.sent_at, c.name as campaign_name
FROM email_campaign_logs cl
LEFT JOIN email_campaigns c ON cl.campaign_id = c.id
ORDER BY cl.created_at DESC 
LIMIT 10;
