-- Fix email campaigns schema
-- This script ensures the email_campaigns and email_campaign_logs tables exist with proper structure

-- Drop existing tables if they exist (to ensure clean state)
DROP TABLE IF EXISTS email_campaign_logs CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;

-- Create email_campaigns table
CREATE TABLE email_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed')),
    target_type VARCHAR(50) DEFAULT 'all' CHECK (target_type IN ('all', 'selected', 'filtered')),
    target_criteria JSONB DEFAULT '{}',
    selected_recipients JSONB DEFAULT '[]',
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create email_campaign_logs table
CREATE TABLE email_campaign_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    email_service VARCHAR(50),
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at);
CREATE INDEX idx_email_campaign_logs_campaign_id ON email_campaign_logs(campaign_id);
CREATE INDEX idx_email_campaign_logs_status ON email_campaign_logs(status);
CREATE INDEX idx_email_campaign_logs_recipient_email ON email_campaign_logs(recipient_email);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_campaigns_updated_at 
    BEFORE UPDATE ON email_campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a test campaign for validation
INSERT INTO email_campaigns (
    name, 
    subject, 
    from_name, 
    from_email, 
    html_content, 
    target_type
) VALUES (
    'Test Campaign - Schema Validation',
    'Test Email Subject',
    'Times NRI Team',
    'noreply@timesnri.com',
    '<h1>Test Email</h1><p>This is a test email to validate the schema.</p>',
    'all'
);

-- Verify the tables were created successfully
SELECT 'email_campaigns table created' as status, COUNT(*) as test_records FROM email_campaigns;
SELECT 'email_campaign_logs table created' as status FROM email_campaign_logs LIMIT 1;
