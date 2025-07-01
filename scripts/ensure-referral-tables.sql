-- ============================================================================
-- PRODUCTION-READY DATABASE SCHEMA FOR TIMES NRI WAITLIST & REFERRAL SYSTEM
-- ============================================================================

-- Enable UUID extension for better ID generation (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create waitlist_submissions table with proper constraints and indexes
CREATE TABLE IF NOT EXISTS waitlist_submissions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    source VARCHAR(100) DEFAULT 'direct',
    location VARCHAR(255),
    parent_location VARCHAR(255),
    care_needs TEXT,
    care_plan VARCHAR(500),
    care_plan_interest TEXT,
    waitlist_number INTEGER GENERATED ALWAYS AS IDENTITY,
    referred_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist_submissions(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON waitlist_submissions(referred_by);
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON waitlist_submissions(source);
CREATE INDEX IF NOT EXISTS idx_waitlist_location ON waitlist_submissions(location);
CREATE INDEX IF NOT EXISTS idx_waitlist_parent_location ON waitlist_submissions(parent_location);

-- Add email constraint for better validation
ALTER TABLE waitlist_submissions 
ADD CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create referrals table for tracking referral relationships
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL,
    referred_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'converted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES waitlist_submissions(id) ON DELETE CASCADE,
    UNIQUE(referrer_id, referred_email)
);

-- Create indexes for referrals table
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

-- Create referral_details table for enhanced tracking
CREATE TABLE IF NOT EXISTS referral_details (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL,
    referred_email VARCHAR(255) NOT NULL,
    referred_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'converted')),
    conversion_value DECIMAL(10,2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES waitlist_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES waitlist_submissions(id) ON DELETE SET NULL,
    UNIQUE(referrer_id, referred_email)
);

-- Create indexes for referral_details table
CREATE INDEX IF NOT EXISTS idx_referral_details_referrer_id ON referral_details(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_details_referred_email ON referral_details(referred_email);
CREATE INDEX IF NOT EXISTS idx_referral_details_referred_id ON referral_details(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_details_status ON referral_details(status);
CREATE INDEX IF NOT EXISTS idx_referral_details_created_at ON referral_details(created_at DESC);

-- Create email_config table for email settings
CREATE TABLE IF NOT EXISTS email_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for email_config
CREATE INDEX IF NOT EXISTS idx_email_config_key ON email_config(config_key);
CREATE INDEX IF NOT EXISTS idx_email_config_enabled ON email_config(is_enabled);

-- Insert default email configuration
INSERT INTO email_config (config_key, config_value, is_enabled) VALUES
('welcome_email_enabled', 'true', true),
('welcome_email_subject', 'Welcome to Times NRI - You''re on the waitlist!', true),
('welcome_email_from_name', 'Times NRI Team', true),
('welcome_email_from_email', 'timesnri@timesinternet.in', true),
('welcome_email_template', '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Times NRI</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Times NRI!</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">You''re now on our waitlist</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hi {{name}},</p>
        
        <p>Thank you for joining the Times NRI waitlist! We''re building something special for NRI families like yours.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Your Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>Email:</strong> {{email}}</li>
                <li style="margin: 8px 0;"><strong>Parent Location:</strong> {{parent_location}}</li>
                <li style="margin: 8px 0;"><strong>Care Plan Interest:</strong> {{care_plan}}</li>
                <li style="margin: 8px 0;"><strong>Waitlist Number:</strong> #{{waitlist_number}}</li>
            </ul>
        </div>
        
        <p>We''ll keep you updated on our progress and let you know as soon as we launch in {{parent_location}}.</p>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1976d2;">Want Priority Access?</h3>
            <p style="margin-bottom: 15px;">Share Times NRI with other NRI families and move up the waitlist!</p>
            <p style="margin-bottom: 15px;"><strong>Your referral link:</strong></p>
            <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px;">{{referral_link}}</p>
        </div>
        
        <p>Best regards,<br>
        <strong>The Times NRI Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
            Times NRI - Caring for your parents, wherever you are<br>
            <a href="https://times-nri.vercel.app" style="color: #667eea;">times-nri.vercel.app</a>
        </p>
    </div>
</body>
</html>', true)
ON CONFLICT (config_key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_waitlist_submissions_updated_at ON waitlist_submissions;
CREATE TRIGGER update_waitlist_submissions_updated_at
    BEFORE UPDATE ON waitlist_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_details_updated_at ON referral_details;
CREATE TRIGGER update_referral_details_updated_at
    BEFORE UPDATE ON referral_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_config_updated_at ON email_config;
CREATE TRIGGER update_email_config_updated_at
    BEFORE UPDATE ON email_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for referral statistics
CREATE OR REPLACE VIEW referral_stats AS
SELECT 
    ws.id,
    ws.email,
    ws.name,
    COUNT(r.id) as total_referrals,
    COUNT(CASE WHEN r.status = 'registered' THEN 1 END) as registered_referrals,
    COUNT(CASE WHEN r.status = 'converted' THEN 1 END) as converted_referrals,
    ws.created_at
FROM waitlist_submissions ws
LEFT JOIN referrals r ON ws.id = r.referrer_id
GROUP BY ws.id, ws.email, ws.name, ws.created_at;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Add some helpful comments
COMMENT ON TABLE waitlist_submissions IS 'Main table storing waitlist signups with referral tracking';
COMMENT ON TABLE referrals IS 'Simple referral tracking table';
COMMENT ON TABLE referral_details IS 'Enhanced referral tracking with additional metadata';
COMMENT ON TABLE email_config IS 'Configuration settings for email templates and preferences';
COMMENT ON VIEW referral_stats IS 'Aggregated referral statistics per user';

-- Verify tables were created successfully
DO $$
BEGIN
    RAISE NOTICE 'Database schema setup completed successfully!';
    RAISE NOTICE 'Tables created: waitlist_submissions, referrals, referral_details, email_config';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Triggers created for automatic timestamp updates';
    RAISE NOTICE 'Default email configuration inserted';
END $$;
