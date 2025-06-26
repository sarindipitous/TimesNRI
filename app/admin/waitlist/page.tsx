"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, Download, Filter, Trash2 } from "lucide-react"

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

  useEffect(() => {
    fetchWaitlistData()
  }, [])

  const fetchWaitlistData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/waitlist")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch data")
      }

      setSubmissions(data.submissions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const deleteSubmission = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      setDeletingId(id)
      const response = await fetch(`/api/waitlist/${id}`, { method: "DELETE" })
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to delete")
      }

      setSubmissions((prev) => prev.filter((sub) => sub.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeletingId(null)
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
              <Button onClick={fetchWaitlistData} className="mt-4" variant="outline">
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
          <h1 className="text-2xl font-bold">Waitlist Management</h1>
          <p className="text-gray-600">Total entries: {submissions.length}</p>
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

      {/* Search and Filter */}
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
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No entries found</h3>
              <p className="text-gray-600">
                {submissions.length === 0 ? "No waitlist submissions yet." : "Try adjusting your search criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Parent Location</TableHead>
                    <TableHead>Care Needs</TableHead>
                    <TableHead>Care Plan</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <Badge variant="outline">#{submission.id}</Badge>
                      </TableCell>
                      <TableCell>{submission.name || "Anonymous"}</TableCell>
                      <TableCell>{submission.email}</TableCell>
                      <TableCell>{submission.source && <Badge variant="outline">{submission.source}</Badge>}</TableCell>
                      <TableCell>{submission.location}</TableCell>
                      <TableCell>{submission.parent_location}</TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate">{submission.care_needs}</div>
                      </TableCell>
                      <TableCell>
                        {submission.care_plan && <Badge variant="secondary">{submission.care_plan}</Badge>}
                      </TableCell>
                      <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
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
