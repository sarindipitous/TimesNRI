import { getBlogPostBySlug } from "@/lib/blog-db"
import { notFound } from "next/navigation"
import { Calendar, User, ArrowLeft, Clock, Share2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ShareButton } from "@/components/share-button"

interface Props {
  params: { slug: string }
}

function ShareButtonPlaceholder({ title }: { title: string }) {
  return (
    <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
      <Share2 className="w-5 h-5" />
      <span>Share</span>
    </button>
  )
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const publishDate = post.published_at || post.created_at
  const tags =
    post.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) || []
  const readingTime = Math.ceil(post.content.replace(/<[^>]*>/g, "").split(" ").length / 200)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Article Header */}
        <header className="mb-12">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>
                {new Date(publishDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{readingTime} min read</span>
            </div>
            {/* Share Button Component */}
            <ShareButton title={post.title} />
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="aspect-video w-full overflow-hidden rounded-2xl mb-8 shadow-xl">
              <img
                src={post.featured_image || "/placeholder.svg"}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="prose prose-lg prose-gray max-w-none">
          <div className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Article Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.author}</p>
                <p className="text-sm text-gray-600">Times NRI Team</p>
              </div>
            </div>
            <Link
              href="/blog"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              More Articles
            </Link>
          </div>
        </footer>
      </article>
    </div>
  )
}
