import { getPublishedBlogPosts } from "@/lib/blog-db"
import { BlogPostCard } from "@/components/blog-post-card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Blog - Times NRI",
  description: "Insights and tips for NRI families caring for elderly parents in India",
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts(12, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-600/5"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            Latest Insights
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Care <span className="text-primary">Insights</span> & Tips
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Expert guidance and practical advice for NRI families navigating elderly care in India
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-12">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h3>
                <p className="text-gray-600 leading-relaxed">
                  We're crafting valuable content to help you navigate elderly care. Check back soon for expert
                  insights!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {posts.length > 0 && (
                <div className="mb-16">
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-0">
                      {posts[0].featured_image && (
                        <div className="aspect-[4/3] lg:aspect-auto">
                          <img
                            src={posts[0].featured_image || "/placeholder.svg"}
                            alt={posts[0].title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        <Badge variant="default" className="w-fit mb-4">
                          Featured Article
                        </Badge>
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                          {posts[0].title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
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
                        {posts[0].excerpt && (
                          <p className="text-gray-600 mb-8 leading-relaxed text-lg">{posts[0].excerpt}</p>
                        )}
                        <a
                          href={`/blog/${posts[0].slug}`}
                          className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          Read Full Article
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Posts Grid */}
              {posts.length > 1 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">More Articles</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.slice(1).map((post) => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
