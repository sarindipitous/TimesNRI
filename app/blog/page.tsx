import { getPublishedBlogPosts } from "@/lib/blog-db"
import { BlogPostCard } from "@/components/blog-post-card"

export const metadata = {
  title: "Blog - Times NRI",
  description: "Insights and tips for NRI families caring for elderly parents in India",
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts(12, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Our Blog</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Insights, tips, and guidance for NRI families caring for elderly parents in India
            </p>
            <div className="w-24 h-1 bg-primary mx-auto mt-6 rounded-full"></div>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No posts published yet</h3>
                <p className="text-gray-600 leading-relaxed">
                  We're working on creating valuable content for you. Check back soon for insights and tips!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {posts.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Article</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-2xl shadow-lg overflow-hidden">
                    {posts[0].featured_image && (
                      <div className="aspect-video lg:aspect-square overflow-hidden">
                        <img
                          src={posts[0].featured_image || "/placeholder.svg"}
                          alt={posts[0].title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>
                          {new Date(posts[0].published_at || posts[0].created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span>{posts[0].author}</span>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{posts[0].title}</h3>
                      {posts[0].excerpt && <p className="text-gray-600 mb-6 leading-relaxed">{posts[0].excerpt}</p>}
                      <a
                        href={`/blog/${posts[0].slug}`}
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Read Article
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* All Posts Grid */}
              {posts.length > 1 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">All Articles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.slice(1).map((post) => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
