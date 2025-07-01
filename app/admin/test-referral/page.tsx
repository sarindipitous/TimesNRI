"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, RefreshCw, CheckCircle, XCircle, Info, Database, Link, Users, TestTube } from "lucide-react"

interface TestResult {
  name: string
  status: "PASS" | "FAIL" | "INFO"
  details: any
}

interface TestSummary {
  total_tests: number
  passed: number
  failed: number
  info: number
}

export default function TestReferralPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [summary, setSummary] = useState<TestSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  const runTests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-referral")
      const data = await response.json()

      if (data.success) {
        setTests(data.tests)
        setSummary(data.summary)
        setLastRun(data.timestamp)
      } else {
        console.error("Test failed:", data.error)
      }
    } catch (error) {
      console.error("Error running tests:", error)
    } finally {
      setLoading(false)
    }
  }

  const cleanupTestData = async () => {
    try {
      const response = await fetch("/api/test-referral", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert("Test data cleaned up successfully")
      } else {
        alert(`Cleanup failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Cleanup error: ${error}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "INFO":
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "bg-green-50 border-green-200 text-green-800"
      case "FAIL":
        return "bg-red-50 border-red-200 text-red-800"
      case "INFO":
        return "bg-blue-50 border-blue-200 text-blue-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Referral System QA
          </h1>
          <p className="text-muted-foreground">Comprehensive testing of the referral system</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={cleanupTestData} variant="outline" size="sm">
            Clean Test Data
          </Button>
          <Button onClick={runTests} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Run Tests
          </Button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_tests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Info</CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Results
              {lastRun && (
                <Badge variant="outline" className="ml-auto">
                  Last run: {new Date(lastRun).toLocaleTimeString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <Alert key={index} className={getStatusColor(test.status)}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{test.name}</h4>
                        <Badge variant="outline" className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                      </div>
                      <AlertDescription>
                        <pre className="text-xs bg-white/50 p-2 rounded border overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Testing Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Manual Testing Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="referral-flow" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="referral-flow">Referral Flow</TabsTrigger>
              <TabsTrigger value="api-testing">API Testing</TabsTrigger>
              <TabsTrigger value="admin-testing">Admin Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="referral-flow" className="space-y-4">
              <h3 className="text-lg font-medium">Test Referral Flow</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Create a referral link: <code>https://your-domain.com?ref=test@example.com</code>
                </li>
                <li>Open the link in a new browser/incognito window</li>
                <li>Fill out the waitlist form completely</li>
                <li>Check that "Referred by: test@example.com" appears in the form</li>
                <li>Submit the form and verify success message</li>
                <li>Check the admin dashboard to see the referral data</li>
              </ol>
            </TabsContent>

            <TabsContent value="api-testing" className="space-y-4">
              <h3 className="text-lg font-medium">Test API Endpoints</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Waitlist API:</strong>
                  <code className="ml-2 p-1 bg-gray-100 rounded">/api/waitlist</code>
                </div>
                <div>
                  <strong>Dashboard API:</strong>
                  <code className="ml-2 p-1 bg-gray-100 rounded">/api/dashboard-data</code>
                </div>
                <div>
                  <strong>Test API:</strong>
                  <code className="ml-2 p-1 bg-gray-100 rounded">/api/test-referral</code>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="admin-testing" className="space-y-4">
              <h3 className="text-lg font-medium">Test Admin Dashboard</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Visit <code>/admin/waitlist</code>
                </li>
                <li>Verify that all waitlist entries are displayed</li>
                <li>Check that referral data shows in the "Referrer" column</li>
                <li>Test the search functionality with referrer emails</li>
                <li>Click on an entry to view detailed referral information</li>
                <li>Verify referral statistics in the header cards</li>
              </ol>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open("/api/waitlist", "_blank")}>
              View Waitlist API
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("/api/dashboard-data", "_blank")}>
              View Dashboard API
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("/admin/waitlist", "_blank")}>
              Open Admin Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("/?ref=test@example.com", "_blank")}>
              Test Referral Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
