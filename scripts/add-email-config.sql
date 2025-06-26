-- Create email configuration table
CREATE TABLE IF NOT EXISTS email_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default email configuration
INSERT INTO email_config (config_key, config_value, is_enabled) VALUES
('welcome_email_enabled', 'true', true),
('welcome_email_subject', 'Welcome to Times NRI - Your Senior Care Journey Begins', true),
('welcome_email_from_name', 'Times NRI Team', true),
('welcome_email_from_email', 'welcome@timesnri.com', true),
('welcome_email_template', '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Times NRI</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Times NRI!</h1>
            <p>Your Senior Care Journey Begins Here</p>
        </div>
        <div class="content">
            <p>Dear {{name}},</p>
            
            <p>Thank you for joining our waitlist! We''re thrilled to have you as part of the Times NRI community.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>We''ll notify you as soon as we launch in {{parent_location}}</li>
                <li>You''ll receive priority access to our services</li>
                <li>We''ll send you helpful resources about senior care in India</li>
            </ul>
            
            <p><strong>Your Waitlist Details:</strong></p>
            <ul>
                <li>Waitlist Number: #{{waitlist_number}}</li>
                <li>Care Plan Interest: {{care_plan}}</li>
                <li>Location: {{parent_location}}</li>
            </ul>
            
            <p>Want to move up the waitlist? Share your referral link with other NRIs:</p>
            <p><a href="{{referral_link}}" class="button">Share Your Referral Link</a></p>
            
            <p>If you have any questions, feel free to reply to this email. We''re here to help!</p>
            
            <p>Best regards,<br>The Times NRI Team</p>
        </div>
        <div class="footer">
            <p>Times NRI - Senior Care & Wellness Membership for NRIs</p>
            <p>You received this email because you joined our waitlist.</p>
        </div>
    </div>
</body>
</html>', true)
ON CONFLICT (config_key) DO NOTHING;
