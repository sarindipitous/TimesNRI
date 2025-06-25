import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, ArrowRight } from "lucide-react"
import type { BlogPost } from "@/lib/blog-db"

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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-[1.02] group">
      {post.featured_image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={post.featured_image || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <CardHeader className="flex-1 pb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(publishDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {post.author}
          </span>
        </div>

        <h2 className="text-xl font-bold leading-tight mb-4 text-gray-900 group-hover:text-primary transition-colors">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed mb-4">{post.excerpt}</p>}
      </CardHeader>

      <CardContent className="pt-0 mt-auto">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-1">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm group-hover:gap-3 transition-all duration-200"
        >
          Read full article
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
