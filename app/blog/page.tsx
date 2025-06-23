import { getPublishedBlogPosts } from "@/lib/blog-db"
import { BlogPostCard } from "@/components/blog-post-card"

export const metadata = {
  title: "Blog - Times NRI",
  description: "Insights and tips for NRI families caring for elderly parents in India",
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts(12, 0)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog</h1>
          <p className="text-lg text-gray-600">
            Insights and tips for NRI families caring for elderly parents in India
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts published yet</h3>
              <p className="text-gray-600">We're working on creating valuable content for you. Check back soon!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
