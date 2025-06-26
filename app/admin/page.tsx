"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, Mail, Database, TrendingUp } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  waitlistCount: number
  blogCount: number
  publishedBlogs: number
  recentSignups: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>({
    waitlistCount: 0,
    blogCount: 0,
    publishedBlogs: 0,
    recentSignups: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch waitlist stats
      const waitlistResponse = await fetch("/api/waitlist")
      const waitlistData = await waitlistResponse.json()

      // Fetch blog stats
      const blogResponse = await fetch("/api/blog?stats=true")
      const blogData = await blogResponse.json()

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentSignups =
        waitlistData.submissions?.filter((sub: any) => new Date(sub.created_at) > oneWeekAgo).length || 0

      setStats({
        waitlistCount: waitlistData.submissions?.length || 0,
        blogCount: blogData.stats?.total || 0,
        publishedBlogs: blogData.stats?.published || 0,
        recentSignups,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "View Full Dashboard",
      description: "Detailed analytics and insights",
      href: "/admin/dashboard",
      icon: TrendingUp,
      color: "bg-blue-500",
    },
    {
      title: "Manage Blog Posts",
      description: "Create and edit blog content",
      href: "/admin/blog",
      icon: FileText,
      color: "bg-green-500",
    },
    {
      title: "Email Configuration",
      description: "Setup welcome emails and templates",
      href: "/admin/email",
      icon: Mail,
      color: "bg-purple-500",
    },
    {
      title: "Database Tools",
      description: "Seed database with sample data",
      href: "/admin/seed",
      icon: Database,
      color: "bg-orange-500",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600">Welcome to the Times NRI admin panel</p>
        </div>
        <Button onClick={fetchDashboardStats} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waitlist</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitlistCount}</div>
            <p className="text-xs text-muted-foreground">+{stats.recentSignups} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blogCount}</div>
            <p className="text-xs text-muted-foreground">{stats.publishedBlogs} published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.waitlistCount > 0 ? Math.round((stats.recentSignups / stats.waitlistCount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">vs last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across your admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New waitlist signups</p>
                <p className="text-xs text-gray-600">{stats.recentSignups} new users this week</p>
              </div>
              <Badge variant="secondary">{stats.recentSignups}</Badge>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Blog posts published</p>
                <p className="text-xs text-gray-600">{stats.publishedBlogs} posts are live</p>
              </div>
              <Badge variant="secondary">{stats.publishedBlogs}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
