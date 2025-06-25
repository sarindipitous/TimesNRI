-- Add featured flag and display_order to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_display_order ON blog_posts(display_order);

-- Set initial display_order based on creation date (newest first)
UPDATE blog_posts 
SET display_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at DESC) 
  FROM blog_posts bp2 
  WHERE bp2.id = blog_posts.id
);
