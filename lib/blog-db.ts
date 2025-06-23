"use server"

import { sql } from "./db"

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
    const rows = await sql<BlogPost[]>`
      SELECT *
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
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
  slug: string
  excerpt: string
  content: string
  author: string
  featured_image?: string | null
  tags?: string | null
  status?: "draft" | "published"
}): Promise<BlogPost> {
  if (!hasDb) return noDb({} as BlogPost, "createBlogPost")

  try {
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
        ${data.slug},
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
    return row
  } catch (e) {
    console.error("createBlogPost error", e)
    throw new Error("Failed to create blog post")
  }
}

export async function updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost | null> {
  if (!hasDb) return noDb(null, "updateBlogPost")

  try {
    if (Object.keys(data).length === 0) return null

    // Handle published_at when status changes to published
    if (data.status === "published" && !data.published_at) {
      data.published_at = new Date()
    }

    const setClause = Object.entries(data)
      .filter(([key]) => key !== "id" && key !== "created_at")
      .map(([key, value]) => `${key} = $${key}`)
      .join(", ")

    if (!setClause) return null

    const [row] = await sql<BlogPost[]>`
      UPDATE blog_posts
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return row ?? null
  } catch (e) {
    console.error("updateBlogPost error", e)
    return null
  }
}

export async function deleteBlogPost(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteBlogPost")

  try {
    const result = await sql`
      DELETE FROM blog_posts
      WHERE id = ${id}
    `
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
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        COUNT(*) FILTER (WHERE status = 'draft') as drafts,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent
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
