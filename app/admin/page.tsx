"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { updateWaitlistEntry, deleteWaitlistEntry } from "@/app/actions/waitlist"
import type { WaitlistSubmission } from "@/lib/db"

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<WaitlistSubmission[]>([])
  const [stats, setStats] = useState({ total: 0, lastWeek: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    location: "",
    parentLocation: "",
    careNeeds: "",
  })

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/waitlist?limit=100")
      const data = await response.json()

      if (data.success) {
        setSubmissions(data.submissions)
      } else {
        setError(data.message || "Failed to fetch submissions")
      }
    } catch (err) {
      setError("An error occurred while fetching data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/waitlist?stats=true")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  useEffect(() => {
    fetchSubmissions()
    fetchStats()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredSubmissions = submissions.filter(
    (sub) =>
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.parent_location?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const startEdit = (submission: WaitlistSubmission) => {
    setEditingId(submission.id)
    setEditForm({
      name: submission.name || "",
      email: submission.email,
      location: submission.location || "",
      parentLocation: submission.parent_location || "",
      careNeeds: submission.care_needs || "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const saveEdit = async (id: number) => {
    try {
      const formData = new FormData()
      formData.append("id", id.toString())
      formData.append("name", editForm.name)
      formData.append("email", editForm.email)
      formData.append("location", editForm.location)
      formData.append("parentLocation", editForm.parentLocation)
      formData.append("careNeeds", editForm.careNeeds)

      const result = await updateWaitlistEntry(formData)

      if (result.success) {
        setEditingId(null)
        fetchSubmissions()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Failed to update entry")
      console.error(err)
    }
  }

  const deleteEntry = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      const formData = new FormData()
      formData.append("id", id.toString())

      const result = await deleteWaitlistEntry(formData)

      if (result.success) {
        fetchSubmissions()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Failed to delete entry")
      console.error(err)
    }
  }

  const setupDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/setup-db")
      const data = await response.json()

      if (data.success) {
        alert("Database setup completed successfully!")
        fetchSubmissions()
      } else {
        setError(data.message || "Failed to setup database")
      }
    } catch (err) {
      setError("An error occurred during database setup")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const testDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/test-db")
      const data = await response.json()

      alert(JSON.stringify(data, null, 2))
    } catch (err) {
      setError("An error occurred during database test")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Waitlist Admin</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button className="float-right font-bold" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.lastWeek}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Database Tools</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={setupDatabase} disabled={loading}>
              Setup Database
            </Button>
            <Button onClick={testDatabase} variant="outline" disabled={loading}>
              Test Connection
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by email, name, or location..."
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
          <TabsTrigger value="recent">Recent (7 Days)</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Parent Location</TableHead>
                  <TableHead>Care Needs</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      {editingId === submission.id ? (
                        <>
                          <TableCell>
                            <Input name="email" value={editForm.email} onChange={handleEditFormChange} />
                          </TableCell>
                          <TableCell>
                            <Input name="name" value={editForm.name} onChange={handleEditFormChange} />
                          </TableCell>
                          <TableCell>
                            <Input name="location" value={editForm.location} onChange={handleEditFormChange} />
                          </TableCell>
                          <TableCell>
                            <Input
                              name="parentLocation"
                              value={editForm.parentLocation}
                              onChange={handleEditFormChange}
                            />
                          </TableCell>
                          <TableCell>
                            <Input name="careNeeds" value={editForm.careNeeds} onChange={handleEditFormChange} />
                          </TableCell>
                          <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveEdit(submission.id)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{submission.email}</TableCell>
                          <TableCell>{submission.name || "-"}</TableCell>
                          <TableCell>{submission.location || "-"}</TableCell>
                          <TableCell>{submission.parent_location || "-"}</TableCell>
                          <TableCell>{submission.care_needs || "-"}</TableCell>
                          <TableCell>
                            {new Date(submission.created_at).toLocaleDateString()}
                            {isRecent(submission.created_at) && <Badge className="ml-2 bg-green-500">New</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(submission)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteEntry(submission.id)}>
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Parent Location</TableHead>
                  <TableHead>Care Needs</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions
                    .filter((sub) => isRecent(sub.created_at))
                    .map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>{submission.email}</TableCell>
                        <TableCell>{submission.name || "-"}</TableCell>
                        <TableCell>{submission.location || "-"}</TableCell>
                        <TableCell>{submission.parent_location || "-"}</TableCell>
                        <TableCell>{submission.care_needs || "-"}</TableCell>
                        <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(submission)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteEntry(submission.id)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function isRecent(date: Date | string): boolean {
  const d = new Date(date)
  const now = new Date()
  const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7))
  return d >= sevenDaysAgo
}
