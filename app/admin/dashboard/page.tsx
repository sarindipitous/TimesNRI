"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Share2, MapPin, Mail, User, ArrowRight } from "lucide-react"
import Link from "next/link"

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
  referred_by?: string
  created_at: string
}

interface DashboardStats {
  waitlist: {
    total: number
    thisWeek: number
    withReferrals: number
  }
  recentSubmissions: WaitlistSubmission[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    waitlist: { total: 0, thisWeek: 0, withReferrals: 0 },
    recentSubmissions: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard-data")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your Times NRI platform</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waitlist</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitlist.total}</div>
            <p className="text-xs text-muted-foreground">{stats.waitlist.thisWeek} new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitlist.thisWeek}</div>
            <p className="text-xs text-muted-foreground">New registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitlist.withReferrals}</div>
            <p className="text-xs text-muted-foreground">With referral source</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Waitlist Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Waitlist Submissions</CardTitle>
            <CardDescription>Latest people who joined the waitlist</CardDescription>
          </div>
          <Link href="/admin/waitlist">
            <Button variant="outline" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Waitlist submissions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentSubmissions.slice(0, 10).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{submission.name || "Anonymous"}</p>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{submission.email}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">#{submission.waitlist_number || submission.id}</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {submission.parent_location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{submission.parent_location}</span>
                      </div>
                    )}
                    <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/waitlist">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Manage Waitlist</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">View and manage all waitlist entries</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/blog">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="font-medium">Blog Management</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Create and manage blog posts</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/email">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Email Config</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Configure email settings</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/api/debug-waitlist" target="_blank">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Debug Data</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">View raw database data</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
