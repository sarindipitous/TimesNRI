"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, Download, Filter, Trash2, Eye, Mail, MapPin, Heart, User, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

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
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<WaitlistSubmission | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchWaitlistData()
  }, [])

  const fetchWaitlistData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching waitlist data...")
      const response = await fetch("/api/waitlist")
      const data = await response.json()

      console.log("API Response:", data)

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch data")
      }

      setSubmissions(data.submissions || [])
      console.log(`Loaded ${data.submissions?.length || 0} submissions`)
    } catch (err) {
      console.error("Error fetching waitlist:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const deleteSubmission = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) return

    try {
      setDeletingId(id)
      console.log(`Attempting to delete submission with ID: ${id}`)

      const response = await fetch(`/api/waitlist/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log(`Delete response status: ${response.status}`)
      const data = await response.json()
      console.log("Delete response data:", data)

      if (!data.success) {
        throw new Error(data.error || "Failed to delete")
      }

      // Remove from local state
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id))

      toast({
        title: "Success",
        description: "Entry deleted successfully!",
      })

      console.log(`Successfully deleted submission with ID: ${id}`)
    } catch (err) {
      console.error("Delete error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to delete"

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      !searchTerm ||
      submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.care_needs?.toLowerCase().includes(searchTerm.toLowerCase())

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
    a.download = `waitlist-complete-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p>Loading waitlist data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Waitlist Management</h1>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-600">
              <h3 className="font-medium">Error: {error}</h3>
              <p className="text-sm mt-2">
                Try visiting <code>/api/waitlist</code> directly to see the raw API response.
              </p>
              <Button onClick={fetchWaitlistData} className="mt-4 bg-transparent" variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Complete Waitlist Management</h1>
          <p className="text-gray-600">
            Total entries: <strong>{submissions.length}</strong> | Showing:{" "}
            <strong>{filteredSubmissions.length}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchWaitlistData} variant="outline">
            Refresh Data
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or care needs..."
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
          <CardTitle>All Waitlist Entries ({filteredSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No entries found</h3>
              <p className="text-gray-600">
                {submissions.length === 0 ? (
                  <>
                    No waitlist submissions yet.{" "}
                    <a href="/api/waitlist" className="text-blue-600 underline">
                      Check API directly
                    </a>
                  </>
                ) : (
                  "Try adjusting your search criteria."
                )}
              </p>
            </div>
          ) : (
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
                    <TableHead>Date</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <Badge variant="outline">#{submission.id}</Badge>
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
                        {submission.source ? (
                          <Badge variant="outline" className="text-xs">
                            {submission.source}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">No source</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{submission.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.parent_location ? (
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{submission.parent_location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.care_needs ? (
                          <div className="max-w-32">
                            <span className="text-xs text-gray-600 line-clamp-2">{submission.care_needs}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.care_plan ? (
                          <Badge variant="secondary" className="text-xs">
                            {submission.care_plan.length > 20
                              ? submission.care_plan.substring(0, 20) + "..."
                              : submission.care_plan}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Not selected</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.care_plan_interest ? (
                          <Badge variant="outline" className="text-xs">
                            {submission.care_plan_interest}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Complete Details - #{submission.id}</DialogTitle>
                                <DialogDescription>All information provided by this user</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Name</label>
                                    <p className="text-sm">{submission.name || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-sm">{submission.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Source</label>
                                    <p className="text-sm">{submission.source || "Not specified"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                                    <p className="text-sm">{new Date(submission.created_at).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Location</label>
                                    <p className="text-sm">{submission.location || "Not specified"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Parent Location</label>
                                    <p className="text-sm">{submission.parent_location || "Not specified"}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Care Needs</label>
                                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                                    {submission.care_needs || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Care Plan Selected</label>
                                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                                    {submission.care_plan || "Not selected"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Care Plan Interest</label>
                                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                                    {submission.care_plan_interest || "Not specified"}
                                  </p>
                                </div>
                                {submission.referred_by && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Referred By</label>
                                    <p className="text-sm mt-1 p-3 bg-blue-50 rounded">{submission.referred_by}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSubmission(submission.id)}
                            disabled={deletingId === submission.id}
                            className="text-red-600 hover:text-red-800"
                          >
                            {deletingId === submission.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
