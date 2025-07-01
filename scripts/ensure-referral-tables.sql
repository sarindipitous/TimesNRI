-- Ensure referrals table exists
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL,
    referred_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referrer_id, referred_email)
);

-- Ensure referral_details table exists
CREATE TABLE IF NOT EXISTS referral_details (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL,
    referred_email VARCHAR(255) NOT NULL,
    referred_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referrer_id, referred_email)
);

-- Ensure waitlist_submissions has referred_by column
ALTER TABLE waitlist_submissions 
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referral_details_referrer_id ON referral_details(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_details_referred_id ON referral_details(referred_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON waitlist_submissions(referred_by);

-- Show table structures for verification
\d referrals;
\d referral_details;
\d waitlist_submissions;
