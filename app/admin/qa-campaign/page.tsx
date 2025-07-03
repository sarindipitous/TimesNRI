"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, AlertTriangle, Loader2, Play, TestTube } from "lucide-react"

interface QAResult {
  test: string
  status: "pass" | "fail" | "warning"
  message: string
  details?: any
}

interface QAResponse {
  overall_status: "pass" | "warning" | "fail"
  summary: {
    total_tests: number
    passed: number
    warnings: number
    failed: number
  }
  production_ready: boolean
  results: QAResult[]
  recommendations: string[]
}

export default function CampaignQAPage() {
  const [qaResults, setQaResults] = useState<QAResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [contentTest, setContentTest] = useState<any>(null)
  const [targetingTest, setTargetingTest] = useState<any>(null)
  const [emailServiceTest, setEmailServiceTest] = useState<any>(null)

  // Test form states
  const [testCampaignId, setTestCampaignId] = useState("")
  const [testEmail, setTestEmail] = useState("")
  const [testName, setTestName] = useState("")
  const [expectedRecipients, setExpectedRecipients] = useState("")
  const [testHtml, setTestHtml] = useState("<h1>Test Campaign</h1><p>Hello {{name}}, your email is {{email}}.</p>")

  const runSystemQA = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/qa-campaign-system")
      const data = await response.json()
      setQaResults(data)
    } catch (error) {
      console.error("QA test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const testCampaignContent = async () => {
    if (!testCampaignId) return

    try {
      const response = await fetch("/api/test-campaign-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: testCampaignId,
          testRecipient: { email: testEmail, name: testName },
        }),
      })
      const data = await response.json()
      setContentTest(data)
    } catch (error) {
      console.error("Content test failed:", error)
    }
  }

  const testRecipientTargeting = async () => {
    if (!testCampaignId) return

    try {
      const expectedArray = expectedRecipients
        ? expectedRecipients
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean)
        : undefined

      const response = await fetch("/api/verify-recipient-targeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: testCampaignId,
          expectedRecipients: expectedArray,
        }),
      })
      const data = await response.json()
      setTargetingTest(data)
    } catch (error) {
      console.error("Targeting test failed:", error)
    }
  }

  const testEmailServices = async () => {
    try {
      const response = await fetch("/api/test-email-service-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testHtml }),
      })
      const data = await response.json()
      setEmailServiceTest(data)
    } catch (error) {
      console.error("Email service test failed:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "fail":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: "default",
      warning: "secondary",
      fail: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status.toUpperCase()}</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign System QA</h1>
          <p className="text-muted-foreground">
            Comprehensive testing for the email campaign system before production deployment
          </p>
        </div>
        <Button onClick={runSystemQA} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          Run System QA
        </Button>
      </div>

      {qaResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(qaResults.overall_status)}
                System QA Results
              </CardTitle>
              {getStatusBadge(qaResults.overall_status)}
            </div>
            <CardDescription>
              {qaResults.summary.total_tests} tests completed -{qaResults.summary.passed} passed,
              {qaResults.summary.warnings} warnings,
              {qaResults.summary.failed} failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={qaResults.production_ready ? "default" : "destructive"}>
                  {qaResults.production_ready ? "PRODUCTION READY" : "NOT PRODUCTION READY"}
                </Badge>
              </div>

              <div className="grid gap-3">
                {qaResults.results.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.test}</h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-blue-600">View Details</summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {qaResults.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content Testing</TabsTrigger>
          <TabsTrigger value="targeting">Recipient Targeting</TabsTrigger>
          <TabsTrigger value="services">Email Services</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Content Testing</CardTitle>
              <CardDescription>Test how campaign content is processed and what recipients will receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="campaignId">Campaign ID</Label>
                  <Input
                    id="campaignId"
                    value={testCampaignId}
                    onChange={(e) => setTestCampaignId(e.target.value)}
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
                <div>
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Test User"
                  />
                </div>
              </div>

              <Button onClick={testCampaignContent} disabled={!testCampaignId}>
                <TestTube className="h-4 w-4 mr-2" />
                Test Campaign Content
              </Button>

              {contentTest && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Content Test Results:</h4>
                  {contentTest.success ? (
                    <div className="space-y-3">
                      <div>
                        <strong>Campaign:</strong> {contentTest.campaign_info.name} (ID: {contentTest.campaign_info.id})
                      </div>
                      <div>
                        <strong>Subject:</strong> {contentTest.processed_content.subject}
                      </div>
                      <div>
                        <strong>From:</strong> {contentTest.processed_content.from}
                      </div>
                      <div>
                        <strong>To:</strong> {contentTest.processed_content.to}
                      </div>
                      <div>
                        <strong>Template Variables:</strong>
                        {contentTest.template_variables_found.name_placeholders} name,
                        {contentTest.template_variables_found.email_placeholders} email,
                        {contentTest.template_variables_found.subject_placeholders} subject
                      </div>
                      <details>
                        <summary className="cursor-pointer text-blue-600">View Processed HTML</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                          {contentTest.processed_content.html_preview}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <p className="text-red-600">{contentTest.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targeting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipient Targeting Testing</CardTitle>
              <CardDescription>Verify that campaigns target the correct recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetCampaignId">Campaign ID</Label>
                  <Input
                    id="targetCampaignId"
                    value={testCampaignId}
                    onChange={(e) => setTestCampaignId(e.target.value)}
                    placeholder="Enter campaign ID"
                  />
                </div>
                <div>
                  <Label htmlFor="expectedRecipients">Expected Recipients (comma-separated)</Label>
                  <Input
                    id="expectedRecipients"
                    value={expectedRecipients}
                    onChange={(e) => setExpectedRecipients(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
              </div>

              <Button onClick={testRecipientTargeting} disabled={!testCampaignId}>
                <TestTube className="h-4 w-4 mr-2" />
                Test Recipient Targeting
              </Button>

              {targetingTest && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Targeting Test Results:</h4>
                  {targetingTest.success ? (
                    <div className="space-y-3">
                      <div>
                        <strong>Campaign:</strong> {targetingTest.campaign.name} (Type:{" "}
                        {targetingTest.campaign.target_type})
                      </div>
                      <div>
                        <strong>Actual Recipients ({targetingTest.targeting_analysis.actual_recipient_count}):</strong>
                        <div className="text-sm bg-gray-50 p-2 rounded mt-1">
                          {targetingTest.targeting_analysis.actual_recipients.join(", ") || "None"}
                        </div>
                      </div>
                      <div>
                        <Badge variant={targetingTest.targeting_analysis.targeting_correct ? "default" : "destructive"}>
                          {targetingTest.targeting_analysis.targeting_correct
                            ? "TARGETING CORRECT"
                            : "TARGETING INCORRECT"}
                        </Badge>
                      </div>
                      <details>
                        <summary className="cursor-pointer text-blue-600">View Full Analysis</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                          {JSON.stringify(targetingTest.targeting_analysis, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <p className="text-red-600">{targetingTest.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Service Integration Testing</CardTitle>
              <CardDescription>Test email service connectivity and functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testHtml">Test HTML Content</Label>
                <Textarea
                  id="testHtml"
                  value={testHtml}
                  onChange={(e) => setTestHtml(e.target.value)}
                  rows={4}
                  placeholder="Enter HTML content to test"
                />
              </div>

              <Button onClick={testEmailServices}>
                <TestTube className="h-4 w-4 mr-2" />
                Test Email Services
              </Button>

              {emailServiceTest && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Email Service Test Results:</h4>
                  {emailServiceTest.success ? (
                    <div className="space-y-3">
                      <div>
                        <Badge variant={emailServiceTest.production_ready ? "default" : "destructive"}>
                          {emailServiceTest.production_ready ? "SERVICES READY" : "SERVICES NOT READY"}
                        </Badge>
                      </div>
                      <div>
                        <strong>Working Services:</strong>{" "}
                        {emailServiceTest.summary.working_service_names.join(", ") || "None"}
                      </div>
                      <div>
                        <strong>Configured Services:</strong>{" "}
                        {emailServiceTest.summary.service_names.join(", ") || "None"}
                      </div>
                      <details>
                        <summary className="cursor-pointer text-blue-600">View Service Details</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                          {JSON.stringify(emailServiceTest.service_details, null, 2)}
                        </pre>
                      </details>
                      <div className="mt-2">
                        <h5 className="font-medium">Recommendations:</h5>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {emailServiceTest.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">{emailServiceTest.error}</p>
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
