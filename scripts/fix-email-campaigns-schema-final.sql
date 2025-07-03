-- Drop existing tables if they exist
DROP TABLE IF EXISTS email_campaign_logs CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;

-- Create email_campaigns table
CREATE TABLE email_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    from_name VARCHAR(255) NOT NULL DEFAULT 'Times NRI Team',
    from_email VARCHAR(255) NOT NULL DEFAULT 'noreply@timesnri.com',
    html_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed')),
    target_type VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'selected', 'filtered')),
    target_criteria JSONB DEFAULT '{}',
    selected_recipients JSONB DEFAULT '[]',
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create email_campaign_logs table
CREATE TABLE email_campaign_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    email_service VARCHAR(50),
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    html_content, 
    target_type,
    status
) VALUES (
    'Test Campaign - System Validation',
    'Test Email - Please Ignore',
    '<h1>Test Email</h1><p>This is a test email to validate the system. Please ignore.</p>',
    'selected',
    'draft'
);

-- Verify tables were created
SELECT 'email_campaigns' as table_name, COUNT(*) as record_count FROM email_campaigns
UNION ALL
SELECT 'email_campaign_logs' as table_name, COUNT(*) as record_count FROM email_campaign_logs;
