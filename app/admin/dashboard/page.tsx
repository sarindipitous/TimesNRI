"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, MapPin, Heart, Star, UserPlus, Share2, Trophy, Target } from "lucide-react"

interface WaitlistSubmission {
  id: number
  email: string
  name?: string
  source?: string
  location?: string
  parent_location?: string
  care_needs?: string
  care_plan?: string
  care_plan_interest?: string
  waitlist_number?: number
  created_at: string
}

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  content: string
  featured: boolean
  display_order: number
  published: boolean
  created_at: string
  updated_at: string
}

interface ReferralStats {
  totalReferrers: number
  totalReferrals: number
  topReferrers: Array<{
    referrer_email: string
    referrer_name?: string
    referral_count: number
  }>
  recentReferrals: Array<{
    referrer_email: string
    referred_email: string
    created_at: string
  }>
}

export default function AdminDashboard() {
  const [waitlistData, setWaitlistData] = useState<WaitlistSubmission[]>([])
  const [blogData, setBlogData] = useState<BlogPost[]>([])
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch waitlist data
      const waitlistResponse = await fetch("/api/waitlist")
      if (waitlistResponse.ok) {
        const waitlistResult = await waitlistResponse.json()
        setWaitlistData(waitlistResult.submissions || [])
      }

      // Fetch blog data
      const blogResponse = await fetch("/api/blog")
      if (blogResponse.ok) {
        const blogResult = await blogResponse.json()
        setBlogData(blogResult.posts || [])
      }

      // Fetch referral stats
      const referralResponse = await fetch("/api/referrals/stats")
      if (referralResponse.ok) {
        const referralResult = await referralResponse.json()
        setReferralStats(referralResult)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchReferrals = async () => {
    if (!searchEmail.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/referrals?referrerEmail=${encodeURIComponent(searchEmail)}&detailed=true`)
      if (response.ok) {
        const result = await response.json()
        setSearchResults(result.referrals || [])
      }
    } catch (error) {
      console.error("Error searching referrals:", error)
      setSearchResults([])
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const stats = {
    totalSubmissions: waitlistData.length,
    lastWeekSubmissions: waitlistData.filter(
      (sub) => new Date(sub.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length,
    totalBlogs: blogData.length,
    publishedBlogs: blogData.filter((post) => post.published).length,
    featuredBlogs: blogData.filter((post) => post.featured).length,
    locationBreakdown: waitlistData.reduce(
      (acc, sub) => {
        const location = sub.parent_location || "Unknown"
        acc[location] = (acc[location] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
    carePlanBreakdown: waitlistData.reduce(
      (acc, sub) => {
        const plan = sub.care_plan || "Not specified"
        acc[plan] = (acc[plan] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={fetchData} variant="outline">
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Waitlist</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">+{stats.lastWeekSubmissions} this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</div>
                <p className="text-xs text-muted-foreground">{referralStats?.totalReferrers || 0} active referrers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published Blogs</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.publishedBlogs}</div>
                <p className="text-xs text-muted-foreground">{stats.featuredBlogs} featured</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalSubmissions > 0
                    ? Math.round(
                        (stats.lastWeekSubmissions / Math.max(stats.totalSubmissions - stats.lastWeekSubmissions, 1)) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">vs last period</p>
              </CardContent>
            </Card>
          </div>

          {/* Location & Care Plan Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Parent Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.locationBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([location, count]) => (
                      <div key={location} className="flex justify-between items-center">
                        <span className="text-sm">{location}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Care Plan Interest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.carePlanBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([plan, count]) => (
                      <div key={plan} className="flex justify-between items-center">
                        <span className="text-sm">{plan}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Waitlist Submissions</CardTitle>
              <CardDescription>Latest people who joined the waitlist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {waitlistData.slice(0, 10).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{submission.name || "Anonymous"}</span>
                        <Badge variant="outline">#{submission.waitlist_number}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{submission.email}</p>
                      <div className="flex gap-2 text-xs text-gray-500">
                        {submission.location && <span>📍 {submission.location}</span>}
                        {submission.parent_location && <span>🏠 Parents in {submission.parent_location}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{new Date(submission.created_at).toLocaleDateString()}</p>
                      {submission.care_plan && (
                        <Badge variant="secondary" className="mt-1">
                          {submission.care_plan.split(":")[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          {/* Referral Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Search Referrals
              </CardTitle>
              <CardDescription>Enter an email to see their referral activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter referrer email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchReferrals()}
                />
                <Button onClick={searchReferrals}>Search</Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Referrals by {searchEmail}:</h4>
                  {searchResults.map((referral, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{referral.referred_email}</span>
                        <Badge variant={referral.referred_id ? "default" : "secondary"}>
                          {referral.referred_id ? "Registered" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Referred on {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Referrers */}
          {referralStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Referrers
                </CardTitle>
                <CardDescription>People who have referred the most users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referralStats.topReferrers.map((referrer, index) => (
                    <div
                      key={referrer.referrer_email}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-accent text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{referrer.referrer_name || "Anonymous"}</p>
                          <p className="text-sm text-gray-600">{referrer.referrer_email}</p>
                        </div>
                      </div>
                      <Badge variant="default">
                        {referrer.referral_count} referral{referrer.referral_count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Referrals */}
          {referralStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Recent Referrals
                </CardTitle>
                <CardDescription>Latest referral activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referralStats.recentReferrals.map((referral, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{referral.referred_email}</p>
                        <p className="text-sm text-gray-600">Referred by {referral.referrer_email}</p>
                      </div>
                      <p className="text-sm text-gray-500">{new Date(referral.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="blog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>Manage your blog content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blogData.slice(0, 10).map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.title}</span>
                        {post.featured && <Badge variant="default">Featured</Badge>}
                        <Badge variant={post.published ? "default" : "secondary"}>
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{post.excerpt}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{new Date(post.updated_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">Order: {post.display_order}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
