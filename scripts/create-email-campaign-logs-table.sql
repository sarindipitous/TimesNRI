-- Create email campaign logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_campaign_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    email_service VARCHAR(50),
    external_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON email_campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON email_campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_recipient_email ON email_campaign_logs(recipient_email);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_campaign_logs_updated_at ON email_campaign_logs;
CREATE TRIGGER update_campaign_logs_updated_at
    BEFORE UPDATE ON email_campaign_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_logs_updated_at();
