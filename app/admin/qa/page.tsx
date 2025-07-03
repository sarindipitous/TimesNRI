"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Mail,
  Users,
  Settings,
  Play,
  Activity,
} from "lucide-react"

interface HealthCheckResult {
  healthy: boolean
  critical?: boolean
  ready_for_production?: boolean
  summary?: any
  errors?: string[]
  warnings?: string[]
  recommendations?: string[]
  [key: string]: any
}

export default function QAPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    campaigns: HealthCheckResult | null
    existing: HealthCheckResult | null
    flow: HealthCheckResult | null
  }>({
    campaigns: null,
    existing: null,
    flow: null,
  })

  const runHealthCheck = async (type: "campaigns" | "existing" | "flow") => {
    setLoading(true)
    try {
      let endpoint = ""
      switch (type) {
        case "campaigns":
          endpoint = "/api/campaigns-health"
          break
        case "existing":
          endpoint = "/api/existing-functionality-check"
          break
        case "flow":
          endpoint = "/api/test-campaign-flow"
          break
      }

      const response = await fetch(endpoint, {
        method: type === "flow" ? "POST" : "GET",
      })
      const data = await response.json()

      setResults((prev) => ({
        ...prev,
        [type]: data,
      }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [type]: {
          healthy: false,
          critical: true,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    } finally {
      setLoading(false)
    }
  }

  const runAllChecks = async () => {
    setLoading(true)
    await Promise.all([runHealthCheck("existing"), runHealthCheck("campaigns"), runHealthCheck("flow")])
    setLoading(false)
  }

  const getStatusIcon = (result: HealthCheckResult | null) => {
    if (!result) return <Settings className="h-5 w-5 text-gray-400" />
    if (result.critical) return <XCircle className="h-5 w-5 text-red-500" />
    if (!result.healthy) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  const getStatusBadge = (result: HealthCheckResult | null) => {
    if (!result) return <Badge variant="secondary">Not Tested</Badge>
    if (result.critical) return <Badge className="bg-red-100 text-red-800">Critical Issues</Badge>
    if (!result.healthy) return <Badge className="bg-yellow-100 text-yellow-800">Issues Found</Badge>
    return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QA Dashboard</h1>
          <p className="text-gray-600">Comprehensive system health check for email campaigns</p>
        </div>
        <Button onClick={runAllChecks} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Run All Checks
        </Button>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Existing Features</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(results.existing)}
              {getStatusBadge(results.existing)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Waitlist, Email Service, Admin Pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign System</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(results.campaigns)}
              {getStatusBadge(results.campaigns)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Database, APIs, Integration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">End-to-End Flow</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(results.flow)}
              {getStatusBadge(results.flow)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Create, Read, Delete Campaign</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="existing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="existing">Existing Features</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign System</TabsTrigger>
          <TabsTrigger value="flow">End-to-End Test</TabsTrigger>
        </TabsList>

        <TabsContent value="existing">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Existing Functionality Check</CardTitle>
                  <CardDescription>
                    Verify that existing features still work after campaign system addition
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => runHealthCheck("existing")} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Test
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.existing ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-4">
                    {getStatusIcon(results.existing)}
                    <div>
                      <div className="font-medium">
                        {results.existing.healthy ? "All Systems Operational" : "Issues Detected"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {results.existing.summary && (
                          <>
                            Waitlist: {results.existing.summary.waitlist_working ? "✅" : "❌"} | Email:{" "}
                            {results.existing.summary.email_working ? "✅" : "❌"} | APIs:{" "}
                            {results.existing.summary.apis_working ? "✅" : "❌"}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Data Samples */}
                  {results.existing.data_samples && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">System Data</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Waitlist Entries:</span>{" "}
                          {results.existing.data_samples.waitlist_count || 0}
                        </div>
                        <div>
                          <span className="font-medium">Email Config:</span>{" "}
                          {results.existing.data_samples.email_config?.enabled || "Not set"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {results.existing.issues && results.existing.issues.length > 0 && (
                    <Alert className="border-red-500">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Critical Issues:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {results.existing.issues.map((issue, index) => (
                            <li key={index} className="text-red-700">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Warnings */}
                  {results.existing.warnings && results.existing.warnings.length > 0 && (
                    <Alert className="border-yellow-500">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Warnings:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {results.existing.warnings.map((warning, index) => (
                            <li key={index} className="text-yellow-700">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Click "Test" to check existing functionality</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campaign System Health</CardTitle>
                  <CardDescription>Check database tables, API routes, and email campaign functionality</CardDescription>
                </div>
                <Button variant="outline" onClick={() => runHealthCheck("campaigns")} disabled={loading}>
                  <Database className="h-4 w-4 mr-2" />
                  Check System
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.campaigns ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-4">
                    {getStatusIcon(results.campaigns)}
                    <div>
                      <div className="font-medium">
                        {results.campaigns.ready_for_production
                          ? "Production Ready"
                          : results.campaigns.healthy
                            ? "System Healthy"
                            : "Issues Found"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {results.campaigns.summary && (
                          <>
                            DB: {results.campaigns.summary.database_ready ? "✅" : "❌"} | API:{" "}
                            {results.campaigns.summary.api_ready ? "✅" : "❌"} | Email:{" "}
                            {results.campaigns.summary.email_ready ? "✅" : "❌"}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Database Status */}
                  {results.campaigns.database && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Database Status</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Connected:</span>{" "}
                          {results.campaigns.database.connected ? "✅" : "❌"}
                        </div>
                        <div>
                          <span className="font-medium">Tables:</span>
                          {results.campaigns.database.tables?.email_campaigns ? "✅" : "❌"} Campaigns,
                          {results.campaigns.database.tables?.email_campaign_logs ? "✅" : "❌"} Logs
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {results.campaigns.errors && results.campaigns.errors.length > 0 && (
                    <Alert className="border-red-500">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Errors:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {results.campaigns.errors.map((error, index) => (
                            <li key={index} className="text-red-700">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Recommendations */}
                  {results.campaigns.recommendations && results.campaigns.recommendations.length > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Recommendations:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {results.campaigns.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Check System" to verify campaign functionality
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>End-to-End Flow Test</CardTitle>
                  <CardDescription>Test complete campaign lifecycle: create → retrieve → delete</CardDescription>
                </div>
                <Button variant="outline" onClick={() => runHealthCheck("flow")} disabled={loading}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {results.flow ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-4">
                    {getStatusIcon(results.flow)}
                    <div>
                      <div className="font-medium">
                        {results.flow.overall_success ? "All Tests Passed" : "Some Tests Failed"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Cleanup: {results.flow.cleanup_performed ? "✅ Performed" : "❌ Failed"}
                      </div>
                    </div>
                  </div>

                  {/* Test Results */}
                  {results.flow.tests && (
                    <div className="space-y-3">
                      {Object.entries(results.flow.tests).map(([testName, testResult]: [string, any]) => (
                        <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {testResult.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium capitalize">{testName.replace(/_/g, " ")}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {testResult.success ? "Passed" : testResult.error || "Failed"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {results.flow.recommendations && results.flow.recommendations.length > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Next Steps:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {results.flow.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Run Test" to perform end-to-end campaign testing
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
