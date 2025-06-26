"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, Download, Filter, MapPin, Mail, User, Calendar, Heart, Share2 } from "lucide-react"

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

export default function WaitlistAdminPage() {
  const [submissions, setSubmissions] = useState<WaitlistSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    withReferrals: 0,
    locations: {} as Record<string, number>,
  })

  useEffect(() => {
    fetchWaitlistData()
  }, [])

  const fetchWaitlistData = async () => {
    try {
      setLoading(true)
      // Fetch more entries - increase limit to 1000
      const response = await fetch("/api/waitlist?limit=1000&offset=0")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Waitlist data received:", data)

      const waitlistData = data.submissions || []
      setSubmissions(waitlistData)

      // Calculate stats
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const thisWeekCount = waitlistData.filter(
        (sub: WaitlistSubmission) => new Date(sub.created_at) > oneWeekAgo,
      ).length

      const withReferrals = waitlistData.filter((sub: WaitlistSubmission) => sub.referred_by).length

      const locations = waitlistData.reduce((acc: Record<string, number>, sub: WaitlistSubmission) => {
        const location = sub.parent_location || sub.location || "Unknown"
        acc[location] = (acc[location] || 0) + 1
        return acc
      }, {})

      setStats({
        total: waitlistData.length,
        thisWeek: thisWeekCount,
        withReferrals,
        locations,
      })
    } catch (error) {
      console.error("Error fetching waitlist data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      !searchTerm ||
      submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLocation =
      !filterLocation ||
      submission.parent_location?.toLowerCase().includes(filterLocation.toLowerCase()) ||
      submission.location?.toLowerCase().includes(filterLocation.toLowerCase())

    return matchesSearch && matchesLocation
  })

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Source",
      "Location",
      "Parent Location",
      "Care Needs",
      "Care Plan",
      "Care Plan Interest",
      "Referred By",
      "Created At",
    ]

    const csvContent = [
      headers.join(","),
      ...filteredSubmissions.map((sub) =>
        [
          sub.id,
          `"${sub.name || ""}"`,
          `"${sub.email}"`,
          `"${sub.source || ""}"`,
          `"${sub.location || ""}"`,
          `"${sub.parent_location || ""}"`,
          `"${sub.care_needs || ""}"`,
          `"${sub.care_plan || ""}"`,
          `"${sub.care_plan_interest || ""}"`,
          `"${sub.referred_by || ""}"`,
          `"${new Date(sub.created_at).toLocaleDateString()}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Waitlist Management</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading waitlist data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Waitlist Management</h1>
          <p className="text-gray-600">Manage and view all waitlist submissions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchWaitlistData} variant="outline">
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Referrals</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.locations).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter by location..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries ({filteredSubmissions.length})</CardTitle>
          <CardDescription>
            {filteredSubmissions.length !== submissions.length &&
              `Showing ${filteredSubmissions.length} of ${submissions.length} entries`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-600">
                {submissions.length === 0
                  ? "No waitlist submissions yet."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Parent Location</TableHead>
                    <TableHead>Care Needs</TableHead>
                    <TableHead>Care Plan</TableHead>
                    <TableHead>Care Interest</TableHead>
                    <TableHead>Referred By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">#{submission.waitlist_number || submission.id}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{submission.name || "Anonymous"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{submission.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.source && (
                          <Badge variant="outline" className="text-xs">
                            {submission.source}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{submission.location}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.parent_location && (
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{submission.parent_location}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.care_needs && (
                          <div className="max-w-32">
                            <span className="text-xs text-gray-600 line-clamp-2">{submission.care_needs}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.care_plan && (
                          <Badge variant="secondary" className="text-xs">
                            {submission.care_plan.split(":")[0]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.care_plan_interest && (
                          <Badge variant="outline" className="text-xs">
                            {submission.care_plan_interest}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.referred_by && (
                          <div className="flex items-center gap-1">
                            <Share2 className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{submission.referred_by}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Breakdown */}
      {Object.keys(stats.locations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Location Breakdown</CardTitle>
            <CardDescription>Where your waitlist members are located</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.locations)
                .sort(([, a], [, b]) => b - a)
                .map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{location}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
