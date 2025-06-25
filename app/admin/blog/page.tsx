"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Post {
  id: string
  title: string
  slug: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([])

  const fetchPosts = async () => {
    const response = await fetch("/api/blog")
    const data = await response.json()
    setPosts(data)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const response = await fetch(`/api/blog/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchPosts() // Refresh the list
      } else {
        alert("Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Error deleting post")
    }
  }

  const handleFixSlugs = async () => {
    if (!confirm("This will fix any blog posts with missing slugs. Continue?")) return

    try {
      const response = await fetch("/api/fix-blog-slugs", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert(`Successfully fixed ${data.posts?.length || 0} blog post slugs`)
        fetchPosts() // Refresh the list
      } else {
        alert(`Failed to fix slugs: ${data.error}`)
      }
    } catch (error) {
      console.error("Error fixing slugs:", error)
      alert("Error fixing slugs")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <div>
          <Link href="/admin/blog/new">
            <Button>Create New</Button>
          </Link>
          <Button onClick={handleFixSlugs} variant="outline" size="sm">
            Fix Slugs
          </Button>
        </div>
      </div>

      <Table>
        <TableCaption>A list of your recent blog posts.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium">{post.id}</TableCell>
              <TableCell>{post.title}</TableCell>
              <TableCell>{post.slug}</TableCell>
              <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/blog/edit/${post.id}`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
