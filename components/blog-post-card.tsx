import Link from "next/link"
import { Calendar, User, ArrowRight, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  featured_image?: string | null
  tags?: string | null
  status: "draft" | "published"
  published_at?: Date | null
  created_at: Date
  updated_at: Date
}

interface BlogPostCardProps {
  post: BlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const publishDate = post.published_at || post.created_at
  const tags =
    post.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) || []

  // Estimate reading time (rough calculation)
  const readingTime = Math.ceil(post.content.replace(/<[^>]*>/g, "").split(" ").length / 200)

  return (
    <Card className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 hover:scale-[1.02]">
      {post.featured_image && (
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={post.featured_image || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-6">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-3 py-1 rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">{post.excerpt}</p>}

        {/* Meta info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readingTime} min read
            </span>
          </div>
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {post.author}
          </span>
        </div>

        {/* Read more link */}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-200 group-hover:text-primary/80"
        >
          Read Article
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  )
}
