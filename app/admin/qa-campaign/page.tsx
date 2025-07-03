"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Send, Target, Settings } from "lucide-react"

interface QAResult {
  timestamp: string
  overall_status: string
  tests: Array<{
    name: string
    status: string
    message: string
    details: any
  }>
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

interface ContentTest {
  success: boolean
  campaign: {
    name: string
    subject: string
    from_name: string
    from_email: string
  }
  recipients: {
    total: number
  }
  contentAnalysis: {
    hasNameVariable: boolean
    hasEmailVariable: boolean
    hasSubjectVariable: boolean
    isWelcomeEmail: boolean
    isCampaignEmail: boolean
    htmlLength: number
  }
  processedContent: {
    processedHtml: string
  }
  error: string
}

interface TargetingTest {
  success: boolean
  validation: {
    message: string
    status: string
  }
  targeting: {
    targetType: string
    expectedBehavior: string
    actualRecipients: number
    totalWaitlistUsers: number
  }
  recipients: {
    count: number
    list: Array<{
      name: string
      email: string
    }>
  }
  error: string
}

interface ServiceTest {
  success: boolean
  results: {
    recommendation: {
      message: string
      status: string
      workingServices: Array<string>
    }
    services: Array<{
      service: string
      success: boolean
      message: string
    }>
    summary: {
      total: number
      configured: number
      working: number
    }
  }
  error: string
}

export default function QACampaignPage() {
  const [qaResults, setQaResults] = useState<QAResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [contentTest, setContentTest] = useState<ContentTest | null>(null)
  const [targetingTest, setTargetingTest] = useState<TargetingTest | null>(null)
  const [serviceTest, setServiceTest] = useState<ServiceTest | null>(null)
  const [campaignId, setCampaignId] = useState("")
  const [testEmail, setTestEmail] = useState("test@example.com")

  const runSystemQA = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/qa-campaign-system")
      const data = await response.json()
      setQaResults(data)
    } catch (error) {
      console.error("QA failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const testCampaignContent = async () => {
    if (!campaignId) return

    setLoading(true)
    try {
      const response = await fetch("/api/test-campaign-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: Number.parseInt(campaignId), testEmail }),
      })
      const data = await response.json()
      setContentTest(data)
    } catch (error) {
      console.error("Content test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const verifyTargeting = async () => {
    if (!campaignId) return

    setLoading(true)
    try {
      const response = await fetch("/api/verify-recipient-targeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: Number.parseInt(campaignId) }),
      })
      const data = await response.json()
      setTargetingTest(data)
    } catch (error) {
      console.error("Targeting test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const testEmailServices = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-email-service-integration")
      const data = await response.json()
      setServiceTest(data)
    } catch (error) {
      console.error("Service test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "WARNING":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === "PASS" ? "default" : status === "FAIL" ? "destructive" : "secondary"
    return <Badge variant={variant}>{status}</Badge>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Campaign System QA</h1>
        <p className="text-muted-foreground">Comprehensive testing for email campaign system</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="content">Content Testing</TabsTrigger>
          <TabsTrigger value="targeting">Targeting</TabsTrigger>
          <TabsTrigger value="services">Email Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Health Check
              </CardTitle>
              <CardDescription>Run comprehensive tests on the campaign system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runSystemQA} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Run System QA
              </Button>

              {qaResults && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Overall Status</h3>
                      <p className="text-sm text-muted-foreground">
                        {qaResults.summary.passed}/{qaResults.summary.total} tests passed
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(qaResults.overall_status)}
                      {getStatusBadge(qaResults.overall_status)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {qaResults.tests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <span className="font-medium">{test.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                        </div>
                        {getStatusBadge(test.status)}
                      </div>
                    ))}
                  </div>

                  {qaResults.overall_status === "PASS" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-800">Production Ready!</span>
                      </div>
                      <p className="text-green-700 mt-1">All systems are working correctly and ready for deployment.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Campaign Content Testing
              </CardTitle>
              <CardDescription>Test campaign content processing and template variables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaignId">Campaign ID</Label>
                  <Input
                    id="campaignId"
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    placeholder="Enter campaign ID"
                  />
                </div>
                <div>
                  <Label htmlFor="testEmail">Test Email</Label>
                  <Input
                    id="testEmail"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
              </div>

              <Button onClick={testCampaignContent} disabled={loading || !campaignId} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Test Campaign Content
              </Button>

              {contentTest && (
                <div className="space-y-4">
                  {contentTest.success ? (
                    <>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800">Campaign Details</h4>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <strong>Name:</strong> {contentTest.campaign.name}
                          </p>
                          <p>
                            <strong>Subject:</strong> {contentTest.campaign.subject}
                          </p>
                          <p>
                            <strong>From:</strong> {contentTest.campaign.from_name} &lt;
                            {contentTest.campaign.from_email}
                            &gt;
                          </p>
                          <p>
                            <strong>Recipients:</strong> {contentTest.recipients.total}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Content Analysis</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Template Variables:</span>
                            <ul className="mt-1 space-y-1">
                              <li>Name: {contentTest.contentAnalysis.hasNameVariable ? "✓" : "✗"}</li>
                              <li>Email: {contentTest.contentAnalysis.hasEmailVariable ? "✓" : "✗"}</li>
                              <li>Subject: {contentTest.contentAnalysis.hasSubjectVariable ? "✓" : "✗"}</li>
                            </ul>
                          </div>
                          <div>
                            <span className="font-medium">Content Type:</span>
                            <ul className="mt-1 space-y-1">
                              <li>Is Welcome Email: {contentTest.contentAnalysis.isWelcomeEmail ? "Yes" : "No"}</li>
                              <li>Is Campaign Email: {contentTest.contentAnalysis.isCampaignEmail ? "Yes" : "No"}</li>
                              <li>HTML Length: {contentTest.contentAnalysis.htmlLength} chars</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Processed Content Preview</h4>
                        <Textarea
                          value={contentTest.processedContent.processedHtml}
                          readOnly
                          className="min-h-[200px] font-mono text-xs"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800">
                        <strong>Error:</strong> {contentTest.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targeting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recipient Targeting Verification
              </CardTitle>
              <CardDescription>Verify that campaigns target the correct recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetCampaignId">Campaign ID</Label>
                <Input
                  id="targetCampaignId"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="Enter campaign ID"
                />
              </div>

              <Button onClick={verifyTargeting} disabled={loading || !campaignId} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify Targeting
              </Button>

              {targetingTest && (
                <div className="space-y-4">
                  {targetingTest.success ? (
                    <>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Targeting Status</h4>
                          <p className="text-sm text-muted-foreground">{targetingTest.validation.message}</p>
                        </div>
                        {getStatusBadge(targetingTest.validation.status)}
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Campaign Targeting</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Target Type:</strong> {targetingTest.targeting.targetType}
                          </p>
                          <p>
                            <strong>Expected Behavior:</strong> {targetingTest.targeting.expectedBehavior}
                          </p>
                          <p>
                            <strong>Actual Recipients:</strong> {targetingTest.targeting.actualRecipients}
                          </p>
                          <p>
                            <strong>Total Waitlist Users:</strong> {targetingTest.targeting.totalWaitlistUsers}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Recipients ({targetingTest.recipients.count})</h4>
                        <div className="max-h-40 overflow-y-auto">
                          {targetingTest.recipients.list.map((recipient: any, index: number) => (
                            <div key={index} className="flex justify-between py-1 text-sm">
                              <span>{recipient.name || "No name"}</span>
                              <span className="text-muted-foreground">{recipient.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800">
                        <strong>Error:</strong> {targetingTest.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Email Service Integration
              </CardTitle>
              <CardDescription>Test email service connectivity and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testEmailServices} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Test Email Services
              </Button>

              {serviceTest && (
                <div className="space-y-4">
                  {serviceTest.success ? (
                    <>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Service Status</h4>
                          <p className="text-sm text-muted-foreground">{serviceTest.results.recommendation.message}</p>
                        </div>
                        {getStatusBadge(serviceTest.results.recommendation.status === "READY" ? "PASS" : "FAIL")}
                      </div>

                      <div className="space-y-2">
                        {serviceTest.results.services.map((service: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(service.success ? "PASS" : "FAIL")}
                                <span className="font-medium">{service.service}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{service.message}</p>
                            </div>
                            {getStatusBadge(service.success ? "PASS" : "FAIL")}
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800">Summary</h4>
                        <div className="mt-2 space-y-1 text-sm text-blue-700">
                          <p>Total Services: {serviceTest.results.summary.total}</p>
                          <p>Configured: {serviceTest.results.summary.configured}</p>
                          <p>Working: {serviceTest.results.summary.working}</p>
                          <p>
                            Working Services: {serviceTest.results.recommendation.workingServices.join(", ") || "None"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800">
                        <strong>Error:</strong> {serviceTest.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
