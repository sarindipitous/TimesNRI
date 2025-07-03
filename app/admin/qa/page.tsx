"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from "lucide-react"

interface HealthCheck {
  success: boolean
  status: string
  checks?: Record<string, boolean>
  tests?: Record<string, boolean>
  errors: string[]
  timestamp: string
}

export default function QAPage() {
  const [loading, setLoading] = useState(false)
  const [campaignHealth, setCampaignHealth] = useState<HealthCheck | null>(null)
  const [existingFunctionality, setExistingFunctionality] = useState<HealthCheck | null>(null)
  const [campaignFlow, setCampaignFlow] = useState<HealthCheck | null>(null)

  const runHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/campaigns-health")
      const data = await response.json()
      setCampaignHealth(data)
    } catch (error) {
      setCampaignHealth({
        success: false,
        status: "error",
        errors: ["Failed to run health check"],
        timestamp: new Date().toISOString(),
      })
    }
  }

  const runExistingFunctionalityCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/existing-functionality-check")
      const data = await response.json()
      setExistingFunctionality(data)
    } catch (error) {
      setExistingFunctionality({
        success: false,
        status: "error",
        errors: ["Failed to run existing functionality check"],
        timestamp: new Date().toISOString(),
      })
    }
  }

  const runCampaignFlowTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-campaign-flow", { method: "POST" })
      const data = await response.json()
      setCampaignFlow(data)
    } catch (error) {
      setCampaignFlow({
        success: false,
        status: "error",
        errors: ["Failed to run campaign flow test"],
        timestamp: new Date().toISOString(),
      })
    }
  }

  const runAllChecks = async () => {
    setLoading(true)
    await Promise.all([runHealthCheck(), runExistingFunctionalityCheck(), runCampaignFlowTest()])
    setLoading(false)
  }

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return <AlertCircle className="h-5 w-5 text-gray-400" />
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (success: boolean | undefined, status: string) => {
    if (success === undefined) {
      return <Badge variant="outline">Not Run</Badge>
    }
    return success ? (
      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
    ) : (
      <Badge variant="destructive">Issues Found</Badge>
    )
  }

  const overallHealth = campaignHealth?.success && existingFunctionality?.success && campaignFlow?.success

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QA Dashboard</h1>
          <p className="text-gray-600">Comprehensive system health and functionality testing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAllChecks} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Run All Checks
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallHealth)}
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getStatusBadge(overallHealth, "overall")}
            <span className="text-sm text-gray-600">
              {overallHealth === true && "All systems operational"}
              {overallHealth === false && "Issues detected - review details below"}
              {overallHealth === undefined && "Run checks to see system status"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="campaign-system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaign-system">Campaign System</TabsTrigger>
          <TabsTrigger value="existing-features">Existing Features</TabsTrigger>
          <TabsTrigger value="end-to-end">End-to-End Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="campaign-system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(campaignHealth?.success)}
                Campaign System Health
              </CardTitle>
              <CardDescription>Verifies that the new email campaign system is properly configured</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>System Status</span>
                {getStatusBadge(campaignHealth?.success, campaignHealth?.status || "")}
              </div>

              {campaignHealth?.checks && (
                <div className="space-y-2">
                  <h4 className="font-medium">Component Checks</h4>
                  {Object.entries(campaignHealth.checks).map(([check, status]) => (
                    <div key={check} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{check.replace(/([A-Z])/g, " $1").trim()}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span>{status ? "Pass" : "Fail"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {campaignHealth?.errors && campaignHealth.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {campaignHealth.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          {error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={runHealthCheck} disabled={loading} variant="outline">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Rerun Health Check
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="existing-features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(existingFunctionality?.success)}
                Existing Features Integrity
              </CardTitle>
              <CardDescription>Ensures that existing functionality remains unaffected by new changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>System Status</span>
                {getStatusBadge(existingFunctionality?.success, existingFunctionality?.status || "")}
              </div>

              {existingFunctionality?.checks && (
                <div className="space-y-2">
                  <h4 className="font-medium">Feature Checks</h4>
                  {Object.entries(existingFunctionality.checks).map(([check, status]) => (
                    <div key={check} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{check.replace(/([A-Z])/g, " $1").trim()}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span>{status ? "Working" : "Issue"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {existingFunctionality?.errors && existingFunctionality.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {existingFunctionality.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          {error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={runExistingFunctionalityCheck} disabled={loading} variant="outline">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Rerun Feature Check
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="end-to-end">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(campaignFlow?.success)}
                End-to-End Campaign Flow
              </CardTitle>
              <CardDescription>Tests the complete campaign creation, management, and deletion workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Test Status</span>
                {getStatusBadge(campaignFlow?.success, campaignFlow?.status || "")}
              </div>

              {campaignFlow?.tests && (
                <div className="space-y-2">
                  <h4 className="font-medium">Workflow Tests</h4>
                  {Object.entries(campaignFlow.tests).map(([test, status]) => (
                    <div key={test} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{test.replace(/([A-Z])/g, " $1").trim()}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span>{status ? "Pass" : "Fail"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {campaignFlow?.errors && campaignFlow.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {campaignFlow.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          {error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={runCampaignFlowTest} disabled={loading} variant="outline">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Rerun Flow Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Production Readiness Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Production Readiness Checklist</CardTitle>
          <CardDescription>Complete these steps before deploying to production</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="db-script" />
              <label htmlFor="db-script" className="text-sm">
                Run database script: <code>scripts/create-email-campaigns-table.sql</code>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="health-check" />
              <label htmlFor="health-check" className="text-sm">
                All health checks pass (green status above)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="test-campaign" />
              <label htmlFor="test-campaign" className="text-sm">
                Create and send a test campaign to verify email delivery
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="backup" />
              <label htmlFor="backup" className="text-sm">
                Database backup completed (recommended)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
