import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"
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
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      {post.featured_image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={post.featured_image || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      <CardHeader className="flex-1">
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(publishDate)}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {post.author}
          </span>
        </div>

        <h2 className="text-xl font-semibold line-clamp-2 mb-3">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed">{post.excerpt}</p>}
      </CardHeader>

      <CardContent className="pt-0">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Link
          href={`/blog/${post.slug}`}
          className="text-primary hover:text-primary/80 font-medium text-sm inline-flex items-center"
        >
          Read more →
        </Link>
      </CardContent>
    </Card>
  )
}
