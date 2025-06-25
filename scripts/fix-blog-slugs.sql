-- Check current blog posts and their slugs
SELECT id, title, slug, status FROM blog_posts;

-- Update any posts with empty or null slugs
UPDATE blog_posts 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
)
WHERE slug IS NULL OR slug = '' OR LENGTH(TRIM(slug)) = 0;

-- Show updated results
SELECT id, title, slug, status FROM blog_posts;
