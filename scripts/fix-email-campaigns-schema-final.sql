-- Drop and recreate email campaigns table with proper schema
DROP TABLE IF EXISTS email_campaign_logs CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;

-- Create email campaigns table with clean schema
CREATE TABLE email_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    from_name VARCHAR(255) NOT NULL DEFAULT 'Times NRI Team',
    from_email VARCHAR(255) NOT NULL DEFAULT 'noreply@timesnri.com',
    html_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    target_type VARCHAR(50) NOT NULL DEFAULT 'all',
    target_criteria JSONB DEFAULT '{}',
    selected_recipients JSONB DEFAULT '[]',
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email campaign logs table
CREATE TABLE email_campaign_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    email_service VARCHAR(50),
    external_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at);
CREATE INDEX idx_email_campaign_logs_campaign_id ON email_campaign_logs(campaign_id);
CREATE INDEX idx_email_campaign_logs_status ON email_campaign_logs(status);

-- Create trigger for updated_at
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
