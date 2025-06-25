-- Check if blog_posts table has the necessary columns for featured and ordering
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'blog_posts'
  AND column_name IN ('featured', 'display_order')
ORDER BY column_name;

-- Also check if the table exists at all
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'blog_posts'
) AS blog_posts_table_exists;

-- Show all columns in blog_posts table for reference
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blog_posts'
ORDER BY ordinal_position;
