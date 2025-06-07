"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { WaitlistSubmission } from "@/lib/db"

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<WaitlistSubmission[]>([])
  const [stats, setStats] = useState({ total: 0, lastWeek: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch submissions
        const submissionsResponse = await fetch("/api/waitlist?limit=1000")
        const submissionsData = await submissionsResponse.json()

        if (submissionsData.success) {
          setSubmissions(submissionsData.submissions)
        } else {
          setError(submissionsData.message || "Failed to fetch submissions")
        }

        // Fetch stats
        const statsResponse = await fetch("/api/waitlist?stats=true")
        const statsData = await statsResponse.json()

        if (statsData.success) {
          setStats(statsData.stats)
        }
      } catch (err) {
        setError("An error occurred while fetching data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate location distribution
  const locationCounts = submissions.reduce(
    (acc, sub) => {
      const location = sub.location || "Unknown"
      acc[location] = (acc[location] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate parent location distribution
  const parentLocationCounts = submissions.reduce(
    (acc, sub) => {
      const location = sub.parent_location || "Unknown"
      acc[location] = (acc[location] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate care needs distribution
  const careNeedsCounts = submissions.reduce(
    (acc, sub) => {
      const needs = sub.care_needs || "Unknown"
      acc[needs] = (acc[needs] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate submissions by source
  const sourceCounts = submissions.reduce(
    (acc, sub) => {
      const source = sub.source || "Unknown"
      acc[source] = (acc[source] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate submissions by day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const submissionsByDay = submissions.reduce(
    (acc, sub) => {
      const date = new Date(sub.created_at)
      if (date >= thirtyDaysAgo) {
        const dateStr = date.toISOString().split("T")[0]
        acc[dateStr] = (acc[dateStr] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  // Sort by date
  const sortedDates = Object.keys(submissionsByDay).sort()

  // Create data for chart
  const chartData = {
    labels: sortedDates,
    values: sortedDates.map((date) => submissionsByDay[date]),
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Waitlist Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button className="float-right font-bold" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading dashboard data...</div>
      ) : (
        <>
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
                <CardTitle className="text-lg">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {submissions.length > 0
                    ? `${((Object.values(sourceCounts).reduce((a, b) => a + b, 0) / submissions.length) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="locations">
            <TabsList>
              <TabsTrigger value="locations">User Locations</TabsTrigger>
              <TabsTrigger value="parentLocations">Parent Locations</TabsTrigger>
              <TabsTrigger value="careNeeds">Care Needs</TabsTrigger>
              <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="locations" className="p-4 border rounded-md">
              <h2 className="text-xl font-bold mb-4">User Locations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(locationCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([location, count]) => (
                    <Card key={location}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{location}</span>
                          <span className="text-lg font-bold">{count}</span>
                        </div>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${(count / submissions.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-1">
                          {((count / submissions.length) * 100).toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="parentLocations" className="p-4 border rounded-md">
              <h2 className="text-xl font-bold mb-4">Parent Locations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(parentLocationCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([location, count]) => (
                    <Card key={location}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{location}</span>
                          <span className="text-lg font-bold">{count}</span>
                        </div>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-accent h-full rounded-full"
                            style={{ width: `${(count / submissions.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-1">
                          {((count / submissions.length) * 100).toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="careNeeds" className="p-4 border rounded-md">
              <h2 className="text-xl font-bold mb-4">Care Needs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(careNeedsCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([need, count]) => (
                    <Card key={need}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{need}</span>
                          <span className="text-lg font-bold">{count}</span>
                        </div>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${(count / submissions.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-1">
                          {((count / submissions.length) * 100).toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="sources" className="p-4 border rounded-md">
              <h2 className="text-xl font-bold mb-4">Traffic Sources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sourceCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => (
                    <Card key={source}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{source}</span>
                          <span className="text-lg font-bold">{count}</span>
                        </div>
                        <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-accent h-full rounded-full"
                            style={{ width: `${(count / submissions.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-1">
                          {((count / submissions.length) * 100).toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="p-4 border rounded-md">
              <h2 className="text-xl font-bold mb-4">Submissions Timeline (Last 30 Days)</h2>
              <div className="h-64">
                {sortedDates.length > 0 ? (
                  <div className="flex h-full items-end">
                    {sortedDates.map((date) => {
                      const count = submissionsByDay[date]
                      const maxCount = Math.max(...Object.values(submissionsByDay))
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0

                      return (
                        <div key={date} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-primary mx-1 rounded-t" style={{ height: `${height}%` }}></div>
                          <div className="text-xs mt-2 transform -rotate-45 origin-top-left">
                            {new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available for the last 30 days
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
