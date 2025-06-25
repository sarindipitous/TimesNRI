"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, Eye, Search, RefreshCw, Wrench, GripVertical, Star } from "lucide-react"
import Link from "next/link"

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
  featured: boolean
  display_order: number
  published_at?: Date | null
  created_at: Date
  updated_at: Date
}

interface BlogStats {
  total: number
  published: number
  drafts: number
  recent: number
  featured: number
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [stats, setStats] = useState<BlogStats>({ total: 0, published: 0, drafts: 0, recent: 0, featured: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [setupLoading, setSetupLoading] = useState(false)
  const [fixingSlug, setFixingSlug] = useState(false)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  useEffect(() => {
    fetchPosts()
    fetchStats()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/blog?admin=true&limit=50")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts)
      } else {
        console.error("Invalid response format:", data)
        setPosts([])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/blog?stats=true")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const deletePost = async (id: number) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchPosts()
        await fetchStats()
      } else {
        alert("Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Error deleting post")
    }
  }

  const toggleFeatured = async (id: number, featured: boolean) => {
    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured }),
      })

      if (response.ok) {
        await fetchPosts()
        await fetchStats()
      } else {
        alert("Failed to update featured status")
      }
    } catch (error) {
      console.error("Error updating featured status:", error)
      alert("Error updating featured status")
    }
  }

  const setupDatabase = async () => {
    try {
      setSetupLoading(true)
      const response = await fetch("/api/setup-blog-db")
      const data = await response.json()

      if (data.success) {
        alert("Blog database setup completed successfully!")
        await fetchPosts()
        await fetchStats()
      } else {
        alert(`Setup failed: ${data.message}`)
      }
    } catch (error) {
      console.error("Error setting up database:", error)
      alert("Error setting up database")
    } finally {
      setSetupLoading(false)
    }
  }

  const fixSlugs = async () => {
    try {
      setFixingSlug(true)
      const response = await fetch("/api/fix-blog-slugs", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert(`Fixed ${data.fixed || 0} blog post slugs`)
        await fetchPosts()
        await fetchStats()
      } else {
        alert(`Failed to fix slugs: ${data.error}`)
      }
    } catch (error) {
      console.error("Error fixing slugs:", error)
      alert("Error fixing slugs")
    } finally {
      setFixingSlug(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItem(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null)
      return
    }

    const newPosts = [...posts]
    const draggedIndex = newPosts.findIndex((p) => p.id === draggedItem)
    const targetIndex = newPosts.findIndex((p) => p.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Remove dragged item and insert at target position
    const [draggedPost] = newPosts.splice(draggedIndex, 1)
    newPosts.splice(targetIndex, 0, draggedPost)

    // Update local state immediately for better UX
    setPosts(newPosts)

    // Send update to server
    try {
      const postIds = newPosts.map((p) => p.id)
      const response = await fetch("/api/blog/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postIds }),
      })

      if (!response.ok) {
        // Revert on error
        await fetchPosts()
        alert("Failed to update blog order")
      }
    } catch (error) {
      console.error("Error updating blog order:", error)
      await fetchPosts()
      alert("Error updating blog order")
    }

    setDraggedItem(null)
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Management</h1>
        <div className="flex gap-2">
          <Button onClick={setupDatabase} variant="outline" disabled={setupLoading}>
            {setupLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            Setup Database
          </Button>
          <Button onClick={fixSlugs} variant="outline" disabled={fixingSlug}>
            {fixingSlug ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
            Fix Slugs
          </Button>
          <Link href="/admin/blog/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.published}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.drafts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.featured}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{stats.recent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Posts Table */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Posts ({filteredPosts.length})</TabsTrigger>
          <TabsTrigger value="published">
            Published ({filteredPosts.filter((p) => p.status === "published").length})
          </TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({filteredPosts.filter((p) => p.status === "draft").length})</TabsTrigger>
          <TabsTrigger value="featured">Featured ({filteredPosts.filter((p) => p.featured).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PostsTable
            posts={filteredPosts}
            loading={loading}
            onDelete={deletePost}
            onToggleFeatured={toggleFeatured}
            formatDate={formatDate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedItem={draggedItem}
          />
        </TabsContent>

        <TabsContent value="published">
          <PostsTable
            posts={filteredPosts.filter((p) => p.status === "published")}
            loading={loading}
            onDelete={deletePost}
            onToggleFeatured={toggleFeatured}
            formatDate={formatDate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedItem={draggedItem}
          />
        </TabsContent>

        <TabsContent value="drafts">
          <PostsTable
            posts={filteredPosts.filter((p) => p.status === "draft")}
            loading={loading}
            onDelete={deletePost}
            onToggleFeatured={toggleFeatured}
            formatDate={formatDate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedItem={draggedItem}
          />
        </TabsContent>

        <TabsContent value="featured">
          <PostsTable
            posts={filteredPosts.filter((p) => p.featured)}
            loading={loading}
            onDelete={deletePost}
            onToggleFeatured={toggleFeatured}
            formatDate={formatDate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedItem={draggedItem}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PostsTable({
  posts,
  loading,
  onDelete,
  onToggleFeatured,
  formatDate,
  onDragStart,
  onDragOver,
  onDrop,
  draggedItem,
}: {
  posts: BlogPost[]
  loading: boolean
  onDelete: (id: number) => void
  onToggleFeatured: (id: number, featured: boolean) => void
  formatDate: (date: string | Date | null | undefined) => string
  onDragStart: (e: React.DragEvent, id: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: number) => void
  draggedItem: number | null
}) {
  if (loading) {
    return (
      <div className="border rounded-md">
        <div className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          Loading posts...
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="border rounded-md">
        <div className="p-8 text-center text-gray-500">
          <p className="text-lg mb-2">No posts found</p>
          <p className="text-sm">Create your first blog post to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow
              key={post.id}
              draggable
              onDragStart={(e) => onDragStart(e, post.id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, post.id)}
              className={`cursor-move ${draggedItem === post.id ? "opacity-50" : ""}`}
            >
              <TableCell>
                <GripVertical className="h-4 w-4 text-gray-400" />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium line-clamp-1">{post.title}</div>
                  {post.excerpt && <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">{post.excerpt}</div>}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{post.slug || "NO SLUG"}</code>
              </TableCell>
              <TableCell>{post.author}</TableCell>
              <TableCell>
                <Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={post.featured}
                    onCheckedChange={(checked) => onToggleFeatured(post.id, !!checked)}
                  />
                  {post.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                </div>
              </TableCell>
              <TableCell>{formatDate(post.status === "published" ? post.published_at : post.created_at)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {post.status === "published" && post.slug && (
                    <Link href={`/blog/${post.slug}`} target="_blank">
                      <Button size="sm" variant="outline" title="View Post">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Link href={`/admin/blog/edit/${post.id}`}>
                    <Button size="sm" variant="outline" title="Edit Post">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(post.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete Post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
