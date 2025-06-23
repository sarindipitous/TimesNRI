import { getBlogPostBySlug } from "@/lib/blog-db"
import { notFound } from "next/navigation"
import { Calendar, User, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Props {
  params: { slug: string }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const publishDate = post.published_at || post.created_at

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <article className="prose prose-lg max-w-none">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

            <div className="flex items-center gap-6 text-gray-600 mb-6">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {new Date(publishDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {post.author}
              </span>
            </div>

            {post.featured_image && (
              <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
                <img
                  src={post.featured_image || "/placeholder.svg"}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </header>

          <div className="prose-content" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </div>
    </main>
  )
}
