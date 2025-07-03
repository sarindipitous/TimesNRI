-- Create email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    from_name VARCHAR(255) NOT NULL DEFAULT 'Times NRI Team',
    from_email VARCHAR(255) NOT NULL DEFAULT 'noreply@timesnri.com',
    html_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, paused
    target_type VARCHAR(50) NOT NULL DEFAULT 'all', -- all, selected, filtered
    target_criteria JSONB, -- for filtering criteria
    selected_recipients JSONB, -- for selected recipients
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email campaign logs table for tracking individual sends
CREATE TABLE IF NOT EXISTS email_campaign_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, failed, bounced
    sent_at TIMESTAMP,
    error_message TEXT,
    email_service VARCHAR(50), -- resend, mailgun, sendgrid
    external_id VARCHAR(255), -- ID from email service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_campaign_id ON email_campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_status ON email_campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_recipient_email ON email_campaign_logs(recipient_email);
