"use server"

import { sql } from "./db"
import { revalidatePath } from "next/cache"

const hasDb = Boolean(process.env.DATABASE_URL?.trim())

function noDb<T>(fallback: T, fnName: string): T {
  console.warn(`[blog-db] ${fnName} skipped – DATABASE_URL not set. Returning fallback.`)
  return fallback
}

export interface BlogPost {
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

export async function getPublishedBlogPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
  if (!hasDb) return noDb([], "getPublishedBlogPosts")

  try {
    console.log("Fetching published blog posts...")
    const rows = await sql<BlogPost[]>`
      SELECT *
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY 
        CASE WHEN published_at IS NOT NULL THEN published_at ELSE created_at END DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    console.log(`Found ${rows.length} published posts`)
    return rows
  } catch (e) {
    console.error("getPublishedBlogPosts error", e)
    return []
  }
}

export async function getAllBlogPosts(limit = 50, offset = 0): Promise<BlogPost[]> {
  if (!hasDb) return noDb([], "getAllBlogPosts")

  try {
    const rows = await sql<BlogPost[]>`
      SELECT *
      FROM blog_posts
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return rows
  } catch (e) {
    console.error("getAllBlogPosts error", e)
    return []
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!hasDb) return noDb(null, "getBlogPostBySlug")

  try {
    const rows = await sql<BlogPost[]>`
      SELECT *
      FROM blog_posts
      WHERE slug = ${slug} AND status = 'published'
      LIMIT 1
    `
    return rows[0] ?? null
  } catch (e) {
    console.error("getBlogPostBySlug error", e)
    return null
  }
}

export async function getBlogPostById(id: number): Promise<BlogPost | null> {
  if (!hasDb) return noDb(null, "getBlogPostById")

  try {
    const rows = await sql<BlogPost[]>`
      SELECT *
      FROM blog_posts
      WHERE id = ${id}
      LIMIT 1
    `
    return rows[0] ?? null
  } catch (e) {
    console.error("getBlogPostById error", e)
    return null
  }
}

export async function createBlogPost(data: {
  title: string
  slug?: string
  excerpt: string
  content: string
  author: string
  featured_image?: string | null
  tags?: string | null
  status?: "draft" | "published"
}): Promise<BlogPost> {
  if (!hasDb) return noDb({} as BlogPost, "createBlogPost")

  try {
    // Generate slug if not provided
    let slug = data.slug
    if (!slug || slug.trim() === "") {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100)

      // Ensure slug is unique
      let uniqueSlug = slug
      let counter = 1
      while (true) {
        const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${uniqueSlug} LIMIT 1`
        if (existing.length === 0) break
        uniqueSlug = `${slug}-${counter}`
        counter++
      }
      slug = uniqueSlug
    }

    const publishedAt = data.status === "published" ? new Date() : null

    const [row] = await sql<BlogPost[]>`
      INSERT INTO blog_posts (
        title,
        slug,
        excerpt,
        content,
        author,
        featured_image,
        tags,
        status,
        published_at
      )
      VALUES (
        ${data.title},
        ${slug},
        ${data.excerpt},
        ${data.content},
        ${data.author},
        ${data.featured_image},
        ${data.tags},
        ${data.status || "draft"},
        ${publishedAt}
      )
      RETURNING *
    `

    // Revalidate blog pages
    revalidatePath("/blog")
    if (data.status === "published") {
      revalidatePath(`/blog/${slug}`)
    }

    return row
  } catch (e) {
    console.error("createBlogPost error", e)
    throw new Error("Failed to create blog post")
  }
}

export async function updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost | null> {
  if (!hasDb) return noDb(null, "updateBlogPost")

  try {
    console.log("Updating blog post:", id, data)

    if (Object.keys(data).length === 0) return null

    // Get the current post to compare
    const currentPost = await getBlogPostById(id)
    if (!currentPost) {
      throw new Error("Post not found")
    }

    // Handle published_at when status changes to published
    if (data.status === "published" && currentPost.status !== "published") {
      data.published_at = new Date()
    }

    // Build the update query dynamically but safely
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`)
      updateValues.push(data.title)
      paramIndex++
    }
    if (data.slug !== undefined) {
      updateFields.push(`slug = $${paramIndex}`)
      updateValues.push(data.slug)
      paramIndex++
    }
    if (data.excerpt !== undefined) {
      updateFields.push(`excerpt = $${paramIndex}`)
      updateValues.push(data.excerpt)
      paramIndex++
    }
    if (data.content !== undefined) {
      updateFields.push(`content = $${paramIndex}`)
      updateValues.push(data.content)
      paramIndex++
    }
    if (data.author !== undefined) {
      updateFields.push(`author = $${paramIndex}`)
      updateValues.push(data.author)
      paramIndex++
    }
    if (data.featured_image !== undefined) {
      updateFields.push(`featured_image = $${paramIndex}`)
      updateValues.push(data.featured_image)
      paramIndex++
    }
    if (data.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex}`)
      updateValues.push(data.tags)
      paramIndex++
    }
    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(data.status)
      paramIndex++
    }
    if (data.published_at !== undefined) {
      updateFields.push(`published_at = $${paramIndex}`)
      updateValues.push(data.published_at)
      paramIndex++
    }

    // Always update the updated_at field
    updateFields.push(`updated_at = NOW()`)

    if (updateFields.length === 1) {
      // Only updated_at
      return currentPost
    }

    const query = `
      UPDATE blog_posts 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `
    updateValues.push(id)

    console.log("Update query:", query)
    console.log("Update values:", updateValues)

    const [row] = await sql<BlogPost[]>(query, ...updateValues)

    if (row) {
      // Revalidate blog pages
      revalidatePath("/blog")
      revalidatePath("/admin/blog")
      if (row.status === "published") {
        revalidatePath(`/blog/${row.slug}`)
      }
      // Also revalidate the old slug if it changed
      if (data.slug && currentPost.slug !== data.slug && currentPost.status === "published") {
        revalidatePath(`/blog/${currentPost.slug}`)
      }
    }

    return row ?? null
  } catch (e) {
    console.error("updateBlogPost error", e)
    throw new Error(`Failed to update blog post: ${e instanceof Error ? e.message : "Unknown error"}`)
  }
}

export async function deleteBlogPost(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteBlogPost")

  try {
    // Get the post before deleting to revalidate its page
    const post = await getBlogPostById(id)

    const result = await sql`
      DELETE FROM blog_posts
      WHERE id = ${id}
    `

    if (result.count > 0) {
      // Revalidate blog pages
      revalidatePath("/blog")
      revalidatePath("/admin/blog")
      if (post && post.status === "published") {
        revalidatePath(`/blog/${post.slug}`)
      }
    }

    return result.count > 0
  } catch (e) {
    console.error("deleteBlogPost error", e)
    return false
  }
}

export async function searchBlogPosts(query: string, limit = 10): Promise<BlogPost[]> {
  if (!hasDb) return noDb([], "searchBlogPosts")

  try {
    const searchTerm = `%${query}%`
    const rows = await sql<BlogPost[]>`
      SELECT *
      FROM blog_posts
      WHERE status = 'published'
        AND (
          title ILIKE ${searchTerm} OR
          content ILIKE ${searchTerm} OR
          tags ILIKE ${searchTerm}
        )
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT ${limit}
    `
    return rows
  } catch (e) {
    console.error("searchBlogPosts error", e)
    return []
  }
}

export async function generateUniqueSlug(title: string): Promise<string> {
  if (!hasDb) return noDb("", "generateUniqueSlug")

  try {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    let slug = base
    let i = 1

    while (true) {
      const rows = await sql`SELECT 1 FROM blog_posts WHERE slug = ${slug} LIMIT 1`
      if (rows.length === 0) break
      slug = `${base}-${i++}`
    }
    return slug
  } catch (e) {
    console.error("generateUniqueSlug error", e)
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "untitled"
    )
  }
}

export async function getBlogStats(): Promise<{
  total: number
  published: number
  drafts: number
  recent: number
}> {
  if (!hasDb) return noDb({ total: 0, published: 0, drafts: 0, recent: 0 }, "getBlogStats")

  try {
    const [stats] = await sql`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END)::int as published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END)::int as drafts,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::int as recent
      FROM blog_posts
    `
    return {
      total: Number(stats.total) || 0,
      published: Number(stats.published) || 0,
      drafts: Number(stats.drafts) || 0,
      recent: Number(stats.recent) || 0,
    }
  } catch (e) {
    console.error("getBlogStats error", e)
    return { total: 0, published: 0, drafts: 0, recent: 0 }
  }
}
