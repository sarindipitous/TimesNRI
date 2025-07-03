"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Users,
  Database,
  Mail,
  Play,
  TestTube,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

interface QAResult {
  timestamp: string
  overall_status: string
  production_ready: boolean
  summary: {
    total_tests: number
    critical_tests: number
    passed: number
    warnings: number
    failed: number
    critical_failures: number
  }
  tests: Array<{
    name: string
    status: "PASS" | "FAIL" | "WARNING"
    message: string
    details?: any
    critical: boolean
  }>
  recommendations: string[]
  next_steps: string[]
}

interface CampaignSafety {
  success: boolean
  campaignSafety: {
    isSafe: boolean
    hasWarnings: boolean
    status: string
    criticalIssues: string[]
    warnings: string[]
  }
  safetyAnalysis: {
    campaignName: string
    targetType: string
    recipientCount: number
    recipients: Array<{ email: string; name: string }>
    contentPreview: {
      subject: string
      fromEmail: string
      fromName: string
      htmlPreview: string
      processedHtmlPreview: string
    }
  }
  recommendation: string
  error?: string
}

export default function ProductionQAPage() {
  const [qaResults, setQaResults] = useState<QAResult | null>(null)
  const [campaignSafety, setCampaignSafety] = useState<CampaignSafety | null>(null)
  const [emailSafety, setEmailSafety] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [campaignId, setCampaignId] = useState("")

  const runProductionQA = async () => {
    setLoading(true)
    try {
      console.log("Running production QA check...")
      const response = await fetch("/api/production-qa-check")
      const data = await response.json()
      setQaResults(data)
      console.log("Production QA completed:", data.overall_status)
    } catch (error) {
      console.error("Production QA failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const testCampaignSafety = async () => {
    if (!campaignId) return

    setLoading(true)
    try {
      const response = await fetch("/api/test-campaign-safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: Number.parseInt(campaignId) }),
      })
      const data = await response.json()
      setCampaignSafety(data)
    } catch (error) {
      console.error("Campaign safety test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const verifyEmailSafety = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/verify-no-real-emails")
      const data = await response.json()
      setEmailSafety(data)
    } catch (error) {
      console.error("Email safety verification failed:", error)
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
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string, critical = false) => {
    if (status === "PASS") return <Badge variant="default">PASS</Badge>
    if (status === "FAIL") return <Badge variant="destructive">{critical ? "CRITICAL FAIL" : "FAIL"}</Badge>
    if (status === "WARNING") return <Badge variant="secondary">WARNING</Badge>
    return <Badge variant="outline">{status}</Badge>
  }

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "text-green-600 bg-green-50 border-green-200"
      case "CRITICAL_FAILURE":
        return "text-red-600 bg-red-50 border-red-200"
      case "FAILURE":
        return "text-red-600 bg-red-50 border-red-200"
      case "WARNING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Production QA Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive safety testing for live production environment with real users
          </p>
        </div>
      </div>

      {/* Production Safety Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4" />
        <AlertTitle className="text-blue-800">Production Safety Guaranteed</AlertTitle>
        <AlertDescription className="text-blue-700">
          This QA system is designed to be completely safe for your live production environment. No real emails will be
          sent, no user data will be modified, and existing functionality will remain untouched.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="campaign">Campaign Safety</TabsTrigger>
          <TabsTrigger value="email">Email Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Production System Health Check
              </CardTitle>
              <CardDescription>
                Comprehensive testing of all campaign system components for production readiness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runProductionQA} disabled={loading} size="lg" className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Run Production QA Check
              </Button>

              {qaResults && (
                <div className="space-y-6">
                  {/* Overall Status */}
                  <div className={`p-6 rounded-lg border-2 ${getOverallStatusColor(qaResults.overall_status)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">Overall Status: {qaResults.overall_status}</h3>
                        <p className="text-sm opacity-90">
                          {qaResults.summary.passed}/{qaResults.summary.total_tests} tests passed •{" "}
                          {qaResults.summary.critical_failures} critical failures
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {qaResults.production_ready ? "✅ PRODUCTION READY" : "❌ NOT READY"}
                        </div>
                        <p className="text-sm opacity-90">
                          {qaResults.production_ready ? "Safe to deploy" : "Fix issues first"}
                        </p>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{qaResults.summary.total_tests}</div>
                        <div className="text-sm opacity-75">Total Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{qaResults.summary.passed}</div>
                        <div className="text-sm opacity-75">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{qaResults.summary.warnings}</div>
                        <div className="text-sm opacity-75">Warnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{qaResults.summary.failed}</div>
                        <div className="text-sm opacity-75">Failed</div>
                      </div>
                    </div>
                  </div>

                  {/* Test Results */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold">Detailed Test Results</h4>
                    {qaResults.tests.map((test, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg ${
                          test.critical && test.status === "FAIL"
                            ? "border-red-300 bg-red-50"
                            : test.status === "FAIL"
                              ? "border-red-200 bg-red-25"
                              : test.status === "WARNING"
                                ? "border-yellow-200 bg-yellow-25"
                                : "border-green-200 bg-green-25"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(test.status)}
                              <span className="font-medium">{test.name}</span>
                              {test.critical && <Badge variant="outline">CRITICAL</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{test.message}</p>
                            {test.details && (
                              <details className="mt-2">
                                <summary className="text-xs cursor-pointer text-blue-600">View Details</summary>
                                <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                                  {JSON.stringify(test.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                          <div className="ml-4">{getStatusBadge(test.status, test.critical)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {qaResults.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-2">Next Steps</h4>
                      <ul className="space-y-1">
                        {qaResults.next_steps.map((step, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Campaign Safety Testing
              </CardTitle>
              <CardDescription>Test specific campaigns for safety before sending to real users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaignId">Campaign ID to Test</Label>
                <Input
                  id="campaignId"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="Enter campaign ID"
                />
              </div>

              <Button onClick={testCampaignSafety} disabled={loading || !campaignId} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                Test Campaign Safety
              </Button>

              {campaignSafety && (
                <div className="space-y-4">
                  {campaignSafety.success ? (
                    <>
                      {/* Safety Status */}
                      <div
                        className={`p-4 rounded-lg border-2 ${
                          campaignSafety.campaignSafety.isSafe
                            ? campaignSafety.campaignSafety.hasWarnings
                              ? "border-yellow-300 bg-yellow-50"
                              : "border-green-300 bg-green-50"
                            : "border-red-300 bg-red-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-lg">
                              Campaign Safety: {campaignSafety.campaignSafety.status}
                            </h4>
                            <p className="text-sm opacity-90">{campaignSafety.recommendation}</p>
                          </div>
                          <div className="text-right">
                            {campaignSafety.campaignSafety.isSafe ? (
                              <CheckCircle className="h-8 w-8 text-green-500" />
                            ) : (
                              <XCircle className="h-8 w-8 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Campaign Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-semibold mb-2">Campaign Info</h5>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>Name:</strong> {campaignSafety.safetyAnalysis.campaignName}
                            </p>
                            <p>
                              <strong>Target:</strong> {campaignSafety.safetyAnalysis.targetType}
                            </p>
                            <p>
                              <strong>Recipients:</strong> {campaignSafety.safetyAnalysis.recipientCount}
                            </p>
                            <p>
                              <strong>Subject:</strong> {campaignSafety.safetyAnalysis.contentPreview.subject}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h5 className="font-semibold mb-2">Email Details</h5>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>From:</strong> {campaignSafety.safetyAnalysis.contentPreview.fromName} &lt;
                              {campaignSafety.safetyAnalysis.contentPreview.fromEmail}&gt;
                            </p>
                            <p>
                              <strong>HTML Length:</strong>{" "}
                              {campaignSafety.safetyAnalysis.contentPreview.htmlPreview.length} chars
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Issues */}
                      {campaignSafety.campaignSafety.criticalIssues.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <h5 className="font-semibold text-red-800 mb-2">Critical Issues (Must Fix)</h5>
                          <ul className="space-y-1">
                            {campaignSafety.campaignSafety.criticalIssues.map((issue, index) => (
                              <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {campaignSafety.campaignSafety.warnings.length > 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h5 className="font-semibold text-yellow-800 mb-2">Warnings (Review Carefully)</h5>
                          <ul className="space-y-1">
                            {campaignSafety.campaignSafety.warnings.map((warning, index) => (
                              <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recipients Preview */}
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-semibold mb-2">Recipients Preview (First 10)</h5>
                        <div className="max-h-40 overflow-y-auto">
                          {campaignSafety.safetyAnalysis.recipients.map((recipient, index) => (
                            <div key={index} className="flex justify-between py-1 text-sm">
                              <span>{recipient.name || "No name"}</span>
                              <span className="text-muted-foreground">{recipient.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-semibold mb-2">Content Preview</h5>
                        <Textarea
                          value={campaignSafety.safetyAnalysis.contentPreview.processedHtmlPreview}
                          readOnly
                          className="min-h-[150px] font-mono text-xs"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800">
                        <strong>Error:</strong> {campaignSafety.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Safety Verification
              </CardTitle>
              <CardDescription>Verify that no real emails will be sent during QA testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={verifyEmailSafety} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                Verify Email Safety
              </Button>

              {emailSafety && (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      emailSafety.isCompletelyProductionSafe
                        ? "border-green-300 bg-green-50"
                        : "border-yellow-300 bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {emailSafety.isCompletelyProductionSafe ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                      )}
                      <h4 className="font-bold">{emailSafety.guarantee}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Protection
                      </h5>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          No real user data modified
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Waitlist functionality preserved
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Rollback ready
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Safety
                      </h5>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Only test emails used
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Sandbox mode enabled
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          No production emails sent
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        QA Safety
                      </h5>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Non-destructive tests
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Isolated testing
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Temporary data cleaned
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">Test Email Addresses Used</h5>
                    <div className="text-sm text-blue-700">
                      {emailSafety.verificationResults.emailSafetyMeasures.testEmailAddresses.map(
                        (email: string, index: number) => (
                          <div key={index} className="font-mono">
                            {email}
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-semibold text-green-800 mb-2">Production Safety Recommendations</h5>
                    <ul className="space-y-1">
                      {emailSafety.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
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
