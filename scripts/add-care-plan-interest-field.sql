-- Add care_plan_interest field to waitlist_submissions table
ALTER TABLE waitlist_submissions 
ADD COLUMN IF NOT EXISTS care_plan_interest TEXT;
