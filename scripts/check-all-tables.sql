-- Comprehensive database health check for Times NRI
-- This script checks for all required tables and columns

-- Check if main tables exist
SELECT 
  'waitlist_submissions' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'waitlist_submissions'
  ) AS table_exists;

SELECT 
  'referrals' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'referrals'
  ) AS table_exists;

SELECT 
  'referral_details' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'referral_details'
  ) AS table_exists;

SELECT 
  'blog_posts' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'blog_posts'
  ) AS table_exists;

SELECT 
  'email_config' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'email_config'
  ) AS table_exists;

-- Check waitlist_submissions columns
SELECT 
  'waitlist_submissions' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'waitlist_submissions'
ORDER BY ordinal_position;

-- Check blog_posts columns (for featured and display_order)
SELECT 
  'blog_posts' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blog_posts'
ORDER BY ordinal_position;

-- Check email_config columns
SELECT 
  'email_config' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'email_config'
ORDER BY ordinal_position;
