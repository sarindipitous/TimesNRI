"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Eye,
  Trash2,
  Download,
  Users,
  TrendingUp,
  Calendar,
  UserCheck,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import type { WaitlistSubmission } from "@/lib/db"

interface WaitlistStats {
  total: number
  lastWeek: number
  totalReferrals: number
  uniqueReferrers: number
}

export default function WaitlistAdminPage() {
  const [submissions, setSubmissions] = useState<WaitlistSubmission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<WaitlistSubmission[]>([])
  const [stats, setStats] = useState<WaitlistStats>({ total: 0, lastWeek: 0, totalReferrals: 0, uniqueReferrers: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubmission, setSelectedSubmission] = useState<WaitlistSubmission | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/waitlist")
      const data = await response.json()

      if (data.success) {
        setSubmissions(data.submissions || [])
        setFilteredSubmissions(data.submissions || [])

        // Calculate referral stats
        const referrals = data.submissions?.filter((s: WaitlistSubmission) => s.referred_by) || []
        const uniqueReferrers = new Set(referrals.map((s: WaitlistSubmission) => s.referred_by)).size

        setStats({
          total: data.stats?.total || data.submissions?.length || 0,
          lastWeek: data.stats?.lastWeek || 0,
          totalReferrals: referrals.length,
          uniqueReferrers,
        })
      } else {
        console.error("Failed to fetch waitlist data:", data.error)
        toast({
          title: "Error",
          description: "Failed to load waitlist data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching waitlist data:", error)
      toast({
        title: "Error",
        description: "Failed to load waitlist data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setFilteredSubmissions(submissions)
      return
    }

    const filtered = submissions.filter(
      (submission) =>
        submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.parent_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.care_needs?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.care_plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.referred_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.source?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredSubmissions(filtered)
  }, [searchTerm, submissions])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Entry deleted successfully",
        })
        await fetchData() // Refresh the data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete entry",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

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
      "Interest",
      "Referrer",
      "Created At",
    ]

    const csvContent = [
      headers.join(","),
      ...filteredSubmissions.map((submission) =>
        [
          submission.id,
          `"${submission.name || ""}"`,
          `"${submission.email}"`,
          `"${submission.source || ""}"`,
          `"${submission.location || ""}"`,
          `"${submission.parent_location || ""}"`,
          `"${submission.care_needs || ""}"`,
          `"${submission.care_plan || ""}"`,
          `"${submission.care_plan_interest || ""}"`,
          `"${submission.referred_by || ""}"`,
          `"${new Date(submission.created_at).toLocaleString()}"`,
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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const truncateText = (text: string, maxLength = 20) => {
    if (!text) return ""
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Waitlist Management</h1>
          <p className="text-muted-foreground">Manage and track waitlist submissions</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lastWeek}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Referred signups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Referrers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueReferrers}</div>
            <p className="text-xs text-muted-foreground">Active referrers</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by email, name, location, referrer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Waitlist Entries ({filteredSubmissions.length})</CardTitle>
          <CardDescription>
            {searchTerm && `Showing ${filteredSubmissions.length} of ${submissions.length} entries`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Parent Location</TableHead>
                  <TableHead>Care Needs</TableHead>
                  <TableHead>Care Plan</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-mono text-sm">#{submission.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {submission.name || "Not provided"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{submission.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{submission.source || "unknown"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{submission.location || "Not specified"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{submission.parent_location || "Not specified"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{submission.care_needs || "Not specified"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{truncateText(submission.care_plan || "Not selected")}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {truncateText(submission.care_plan_interest || "Not specified")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {submission.referred_by ? (
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-green-600" />
                          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                            {truncateText(submission.referred_by, 15)}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Direct signup</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatDate(submission.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(submission)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(submission.id)}
                          disabled={isDeleting === submission.id}
                        >
                          {isDeleting === submission.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No entries found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "No waitlist submissions yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedSubmission && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Waitlist Entry #{selectedSubmission.id}
                {selectedSubmission.referred_by && (
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Referred
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="referral">Referral Info</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedSubmission.name || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">{selectedSubmission.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Source</Label>
                      <Badge variant="secondary" className="mt-1">
                        {selectedSubmission.source || "unknown"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date Joined</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(selectedSubmission.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Your Location</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSubmission.location || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Parent Location</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSubmission.parent_location || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Care Needs</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSubmission.care_needs || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Care Plan Interest</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSubmission.care_plan || "Not selected"}
                      </p>
                    </div>
                  </div>

                  {selectedSubmission.care_plan_interest && (
                    <div>
                      <Label className="text-sm font-medium">Plan Interest Details</Label>
                      <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                        {selectedSubmission.care_plan_interest}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="referral" className="space-y-4">
                  {selectedSubmission.referred_by ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <UserCheck className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">This user was referred</p>
                          <p className="text-sm text-green-600">
                            Referred by: <span className="font-mono">{selectedSubmission.referred_by}</span>
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Referrer Email</Label>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">{selectedSubmission.referred_by}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Referral Link Used</Label>
                        <div className="mt-1 p-2 bg-muted rounded text-sm font-mono break-all">
                          {process.env.NEXT_PUBLIC_SITE_URL || "https://times-nri.vercel.app"}?ref=
                          {encodeURIComponent(selectedSubmission.referred_by)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Direct Signup</h3>
                      <p className="text-muted-foreground">This user signed up directly without a referral link</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">This User's Referral Link</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm font-mono break-all">
                      {process.env.NEXT_PUBLIC_SITE_URL || "https://times-nri.vercel.app"}?ref=
                      {encodeURIComponent(selectedSubmission.email)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This user can share this link to refer others</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
