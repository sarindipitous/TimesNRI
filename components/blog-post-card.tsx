import Link from "next/link"
import { Calendar, User, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  featured?: boolean
}

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const publishDate = post.published_at || post.created_at

  // DEBUG: Log the slug being used
  console.log("BlogPostCard - Post:", post.title, "Slug:", post.slug, "Link will be:", `/blog/${post.slug}`)

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${featured ? "md:col-span-2" : ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(publishDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {post.author}
          </span>
        </div>

        <h3
          className={`font-bold text-gray-900 group-hover:text-primary transition-colors ${
            featured ? "text-2xl" : "text-xl"
          }`}
        >
          {post.title}
        </h3>

        {post.tags && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.split(",").map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium group-hover:gap-3 transition-all"
        >
          Read more
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
