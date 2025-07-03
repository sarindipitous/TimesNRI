"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function QAUpdateFixPage() {
  const [qaResults, setQaResults] = useState<any>(null)
  const [spamCheck, setSpamCheck] = useState<any>(null)
  const [flowTest, setFlowTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runQATests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/qa-update-campaign-fix")
      const data = await response.json()
      setQaResults(data)
    } catch (error) {
      console.error("QA test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkSpamRisk = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/check-email-spam-risk")
      const data = await response.json()
      setSpamCheck(data)
    } catch (error) {
      console.error("Spam check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const testCampaignFlow = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-campaign-flow-complete", {
        method: "POST",
      })
      const data = await response.json()
      setFlowTest(data)
    } catch (error) {
      console.error("Flow test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASSED":
        return <Badge className="bg-green-500">PASSED</Badge>
      case "FAILED":
        return <Badge className="bg-red-500">FAILED</Badge>
      case "WARNING":
        return <Badge className="bg-yellow-500">WARNING</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "SAFE":
        return <Badge className="bg-green-500">SAFE</Badge>
      case "LOW":
        return <Badge className="bg-blue-500">LOW RISK</Badge>
      case "MEDIUM":
        return <Badge className="bg-yellow-500">MEDIUM RISK</Badge>
      case "HIGH":
        return <Badge className="bg-red-500">HIGH RISK</Badge>
      default:
        return <Badge className="bg-gray-500">{level}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">QA: UpdateCampaign Fix</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive testing of the updateCampaign function fix and spam risk assessment
        </p>
      </div>

      <Tabs defaultValue="unit-tests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unit-tests">Unit Tests</TabsTrigger>
          <TabsTrigger value="spam-check">Spam Risk Check</TabsTrigger>
          <TabsTrigger value="flow-test">Integration Test</TabsTrigger>
        </TabsList>

        <TabsContent value="unit-tests">
          <Card>
            <CardHeader>
              <CardTitle>UpdateCampaign Function Tests</CardTitle>
              <CardDescription>Test the specific SQL query fixes that resolve the "updated_at" error</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runQATests} disabled={loading} className="w-full">
                {loading ? "Running Tests..." : "Run Unit Tests"}
              </Button>

              {qaResults && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <strong>Test Summary:</strong> {qaResults.message}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Update Campaign Tests:</h3>
                    {qaResults.results?.updateCampaignTests?.map((test: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{test.test}</span>
                          {test.details && <p className="text-sm text-gray-600">{test.details}</p>}
                          {test.error && <p className="text-sm text-red-600">{test.error}</p>}
                        </div>
                        {getStatusBadge(test.status)}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">SQL Query Tests:</h3>
                    {qaResults.results?.sqlQueryTests?.map((test: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{test.test}</span>
                          {test.details && <p className="text-sm text-gray-600">{test.details}</p>}
                          {test.columns && (
                            <div className="text-xs text-gray-500 mt-1">Columns: {test.columns.join(", ")}</div>
                          )}
                        </div>
                        {getStatusBadge(test.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spam-check">
          <Card>
            <CardHeader>
              <CardTitle>Email Spam Risk Assessment</CardTitle>
              <CardDescription>Check if any emails were sent despite the "updated_at" errors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={checkSpamRisk} disabled={loading} className="w-full">
                {loading ? "Checking..." : "Check Spam Risk"}
              </Button>

              {spamCheck && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <div className="flex items-center gap-2">
                        {getRiskBadge(spamCheck.overallRisk?.level)}
                        <span>{spamCheck.overallRisk?.recommendation}</span>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{spamCheck.summary?.totalCampaigns || 0}</div>
                      <div className="text-sm text-gray-600">Total Campaigns</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{spamCheck.summary?.totalEmailsSent || 0}</div>
                      <div className="text-sm text-gray-600">Emails Sent</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{spamCheck.summary?.highRiskCampaigns || 0}</div>
                      <div className="text-sm text-gray-600">High Risk</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{spamCheck.summary?.campaignsWithLogs || 0}</div>
                      <div className="text-sm text-gray-600">With Logs</div>
                    </div>
                  </div>

                  {spamCheck.campaignAnalysis && spamCheck.campaignAnalysis.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Campaign Analysis:</h3>
                      {spamCheck.campaignAnalysis.map((campaign: any, index: number) => (
                        <div key={index} className="p-3 border rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{campaign.campaignName}</span>
                            {getRiskBadge(campaign.riskLevel)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Status: {campaign.status} | Emails Sent: {campaign.actualEmailsSent}
                          </div>
                          {campaign.concerns.length > 0 && (
                            <div className="text-sm text-red-600">Concerns: {campaign.concerns.join(", ")}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow-test">
          <Card>
            <CardHeader>
              <CardTitle>Complete Campaign Flow Test</CardTitle>
              <CardDescription>End-to-end test of campaign creation, sending, and cleanup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testCampaignFlow} disabled={loading} className="w-full">
                {loading ? "Testing..." : "Run Integration Test"}
              </Button>

              {flowTest && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(flowTest.success ? "PASSED" : "FAILED")}
                        <span>{flowTest.message}</span>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {flowTest.spamRisk && (
                    <Alert>
                      <AlertDescription>
                        <strong>Spam Risk:</strong> {flowTest.spamRisk}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-semibold">Test Steps:</h3>
                    {flowTest.testResults?.steps?.map((step: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{step.step}</span>
                          {step.details && <p className="text-sm text-gray-600">{step.details}</p>}
                          {step.error && <p className="text-sm text-red-600">{step.error}</p>}
                        </div>
                        {getStatusBadge(step.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
