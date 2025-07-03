"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, Target, Database, Mail, Zap } from "lucide-react"

interface QAResult {
  timestamp: string
  overall_status: string
  deployment_ready: boolean
  deployment_decision: string
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
    status: "PASS" | "FAIL" | "WARNING" | "CRITICAL"
    message: string
    details?: any
    critical: boolean
    recommendation?: string
  }>
  recommendations: string[]
  next_steps: string[]
}

interface TargetingSafetyResult {
  success: boolean
  overallSafety: boolean
  criticalIssues: string[]
  testResults: {
    totalWaitlistCount: number
    selectedEmailsCount: number
    recipientsCount: number
    selectedEmails: string[]
    recipientEmails: string[]
  }
  safetyChecks: {
    correctRecipientCount: boolean
    noMassEmailBug: boolean
    correctEmails: boolean
    noExtraEmails: boolean
    notAllWaitlistMembers: boolean
  }
  jsonValidation: {
    canParseJson: boolean
    isArray: boolean
    correctLength: boolean
    correctEmails: boolean
  }
  recommendation: string
  deploymentDecision: string
}

interface CampaignValidationResult {
  success: boolean
  overallValid: boolean
  summary: {
    totalCampaigns: number
    validCampaigns: number
    invalidCampaigns: number
    campaignsWithWarnings: number
    criticalIssues: number
    totalWarnings: number
  }
  validationResults: Array<{
    campaignId: number
    name: string
    targetType: string
    status: string
    issues: string[]
    warnings: string[]
    isValid: boolean
    selectedCount?: number
    recipientCount?: number
  }>
  criticalIssues: Array<{
    campaignId: number
    issue: string
    severity: string
  }>
  recommendation: string
  deploymentDecision: string
}

export default function DeploymentQAPage() {
  const [qaResult, setQaResult] = useState<QAResult | null>(null)
  const [targetingSafety, setTargetingSafety] = useState<TargetingSafetyResult | null>(null)
  const [campaignValidation, setCampaignValidation] = useState<CampaignValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTest, setActiveTest] = useState("")

  // ---- safe helpers -------------------------------------------------------
  const criticalIssues = targetingSafety?.criticalIssues ?? []
  const campaignCritical = campaignValidation?.criticalIssues ?? []
  const testResults = targetingSafety?.testResults ?? {
    totalWaitlistCount: 0,
    selectedEmailsCount: 0,
    recipientsCount: 0,
    selectedEmails: [] as string[],
    recipientEmails: [] as string[],
  }
  // -------------------------------------------------------------------------

  const runComprehensiveQA = async () => {
    setLoading(true)
    setActiveTest("Comprehensive QA")
    try {
      const response = await fetch("/api/comprehensive-qa-check")
      const data = await response.json()
      setQaResult(data)
    } catch (error) {
      console.error("Comprehensive QA failed:", error)
    } finally {
      setLoading(false)
      setActiveTest("")
    }
  }

  const runTargetingSafetyTest = async () => {
    setLoading(true)
    setActiveTest("Targeting Safety")
    try {
      const response = await fetch("/api/test-campaign-targeting-safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testCampaign: true }),
      })
      const data = await response.json()
      setTargetingSafety(data)
    } catch (error) {
      console.error("Targeting safety test failed:", error)
    } finally {
      setLoading(false)
      setActiveTest("")
    }
  }

  const runCampaignValidation = async () => {
    setLoading(true)
    setActiveTest("Campaign Validation")
    try {
      const response = await fetch("/api/validate-all-campaigns")
      const data = await response.json()
      setCampaignValidation(data)
    } catch (error) {
      console.error("Campaign validation failed:", error)
    } finally {
      setLoading(false)
      setActiveTest("")
    }
  }

  const runAllTests = async () => {
    await runComprehensiveQA()
    await runTargetingSafetyTest()
    await runCampaignValidation()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "CRITICAL":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASS":
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>
      case "FAIL":
        return <Badge variant="destructive">FAIL</Badge>
      case "WARNING":
        return <Badge variant="secondary">WARNING</Badge>
      case "CRITICAL":
        return <Badge className="bg-red-600 text-white">CRITICAL</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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

  const isDeploymentReady =
    qaResult?.deployment_ready && targetingSafety?.overallSafety && campaignValidation?.overallValid

  const allTestsCompleted = qaResult && targetingSafety && campaignValidation

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Production Deployment QA
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive quality assurance for zero-defect production deployment
          </p>
        </div>
      </div>

      {/* Deployment Decision Banner */}
      {allTestsCompleted && (
        <Alert
          className={`border-2 ${isDeploymentReady ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
        >
          <Shield className="h-4 w-4" />
          <AlertTitle className={isDeploymentReady ? "text-green-800" : "text-red-800"}>
            {isDeploymentReady ? "✅ DEPLOYMENT APPROVED" : "❌ DEPLOYMENT BLOCKED"}
          </AlertTitle>
          <AlertDescription className={isDeploymentReady ? "text-green-700" : "text-red-700"}>
            {isDeploymentReady
              ? "All critical tests passed. System is ready for production deployment with zero risk."
              : "Critical issues detected. DO NOT DEPLOY until all issues are resolved."}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          onClick={runAllTests}
          disabled={loading}
          size="lg"
          className="h-16"
          variant={allTestsCompleted && isDeploymentReady ? "default" : "outline"}
        >
          {loading && activeTest === "" ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Run All Tests
        </Button>

        <Button
          onClick={runComprehensiveQA}
          disabled={loading}
          variant="outline"
          size="lg"
          className="h-16 bg-transparent"
        >
          {loading && activeTest === "Comprehensive QA" ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          System Health
        </Button>

        <Button
          onClick={runTargetingSafetyTest}
          disabled={loading}
          variant="outline"
          size="lg"
          className="h-16 bg-transparent"
        >
          {loading && activeTest === "Targeting Safety" ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Target className="h-4 w-4 mr-2" />
          )}
          Targeting Safety
        </Button>

        <Button
          onClick={runCampaignValidation}
          disabled={loading}
          variant="outline"
          size="lg"
          className="h-16 bg-transparent"
        >
          {loading && activeTest === "Campaign Validation" ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          Campaign Validation
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="targeting">Targeting Safety</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {allTestsCompleted ? (
            <div className="space-y-6">
              {/* Overall Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Deployment Readiness Assessment
                    <Badge className={isDeploymentReady ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {isDeploymentReady ? "READY" : "NOT READY"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${qaResult?.deployment_ready ? "text-green-600" : "text-red-600"}`}
                      >
                        {qaResult?.deployment_ready ? "✅" : "❌"}
                      </div>
                      <div className="text-sm font-medium">System Health</div>
                      <div className="text-xs text-muted-foreground">
                        {qaResult?.summary.passed}/{qaResult?.summary.total_tests} tests passed
                      </div>
                    </div>

                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${targetingSafety?.overallSafety ? "text-green-600" : "text-red-600"}`}
                      >
                        {targetingSafety?.overallSafety ? "✅" : "❌"}
                      </div>
                      <div className="text-sm font-medium">Targeting Safety</div>
                      <div className="text-xs text-muted-foreground">{criticalIssues.length} critical issues</div>
                    </div>

                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${campaignValidation?.overallValid ? "text-green-600" : "text-red-600"}`}
                      >
                        {campaignValidation?.overallValid ? "✅" : "❌"}
                      </div>
                      <div className="text-sm font-medium">Campaign Validation</div>
                      <div className="text-xs text-muted-foreground">
                        {campaignValidation?.summary.validCampaigns}/{campaignValidation?.summary.totalCampaigns}{" "}
                        campaigns valid
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{isDeploymentReady ? "100%" : "0%"} Ready</span>
                    </div>
                    <Progress value={isDeploymentReady ? 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Critical Issues Summary */}
              {!isDeploymentReady && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Critical Issues Blocking Deployment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {qaResult?.tests
                        .filter((t) => t.critical && (t.status === "CRITICAL" || t.status === "FAIL"))
                        .map((test, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div>
                              <div className="font-medium text-red-800">{test.name}</div>
                              <div className="text-sm text-red-700">{test.message}</div>
                              {test.recommendation && (
                                <div className="text-xs text-red-600 mt-1">
                                  <strong>Fix:</strong> {test.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                      {criticalIssues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-red-800">Targeting Safety</div>
                            <div className="text-sm text-red-700">{issue}</div>
                          </div>
                        </div>
                      ))}

                      {campaignCritical.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-red-800">Campaign {issue.campaignId}</div>
                            <div className="text-sm text-red-700">{issue.issue}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deployment Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>{isDeploymentReady ? "Deployment Instructions" : "Required Actions"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {isDeploymentReady
                      ? qaResult?.next_steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">{index + 1}.</span>
                            <span className="text-sm">{step}</span>
                          </div>
                        ))
                      : qaResult?.next_steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-red-600 font-bold">•</span>
                            <span className="text-sm">{step}</span>
                          </div>
                        ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Start Deployment QA</CardTitle>
                <CardDescription>Run comprehensive tests to ensure zero-defect deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runAllTests} disabled={loading} size="lg" className="w-full">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Start Comprehensive QA
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {qaResult ? (
            <div className="space-y-4">
              <div className={`p-6 rounded-lg border-2 ${getOverallStatusColor(qaResult.overall_status)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">System Status: {qaResult.overall_status}</h3>
                    <p className="text-sm opacity-90">
                      {qaResult.summary.passed}/{qaResult.summary.total_tests} tests passed •
                      {qaResult.summary.critical_failures} critical failures
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{qaResult.deployment_ready ? "✅ READY" : "❌ NOT READY"}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {qaResult.tests.map((test, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      test.critical && (test.status === "CRITICAL" || test.status === "FAIL")
                        ? "border-red-300 bg-red-50"
                        : test.status === "FAIL" || test.status === "CRITICAL"
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
                        {test.recommendation && (
                          <p className="text-xs text-blue-600 mt-1">
                            <strong>Recommendation:</strong> {test.recommendation}
                          </p>
                        )}
                        {test.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-blue-600">View Details</summary>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <div className="ml-4">{getStatusBadge(test.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Run system health check to see results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="targeting" className="space-y-6">
          {targetingSafety ? (
            <div className="space-y-4">
              <div
                className={`p-6 rounded-lg border-2 ${
                  targetingSafety.overallSafety ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      Targeting Safety: {targetingSafety.overallSafety ? "SAFE" : "UNSAFE"}
                    </h3>
                    <p className="text-sm opacity-90">{targetingSafety.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{targetingSafety.overallSafety ? "✅ SAFE" : "❌ UNSAFE"}</div>
                  </div>
                </div>
              </div>

              {criticalIssues.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Critical Targeting Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {criticalIssues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span className="text-sm text-red-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Safety Checks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {Object.entries(targetingSafety?.safetyChecks ?? {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">JSON Validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {Object.entries(targetingSafety?.jsonValidation ?? {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Total Waitlist:</strong> {testResults.totalWaitlistCount}
                      </p>
                      <p>
                        <strong>Selected Emails:</strong> {testResults.selectedEmailsCount}
                      </p>
                      <p>
                        <strong>Recipients Found:</strong> {testResults.recipientsCount}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Selected Emails:</strong>
                      </p>
                      <div className="text-xs bg-gray-50 p-2 rounded mt-1">{testResults.selectedEmails.join(", ")}</div>
                      <p className="mt-2">
                        <strong>Recipient Emails:</strong>
                      </p>
                      <div className="text-xs bg-gray-50 p-2 rounded mt-1">
                        {testResults.recipientEmails.join(", ") || "None"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Run targeting safety test to see results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          {campaignValidation ? (
            <div className="space-y-4">
              <div
                className={`p-6 rounded-lg border-2 ${
                  campaignValidation.overallValid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      Campaign Validation: {campaignValidation.overallValid ? "VALID" : "INVALID"}
                    </h3>
                    <p className="text-sm opacity-90">{campaignValidation.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {campaignValidation.overallValid ? "✅ VALID" : "❌ INVALID"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{campaignValidation.summary.totalCampaigns}</div>
                    <div className="text-sm opacity-75">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{campaignValidation.summary.validCampaigns}</div>
                    <div className="text-sm opacity-75">Valid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{campaignValidation.summary.invalidCampaigns}</div>
                    <div className="text-sm opacity-75">Invalid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {campaignValidation.summary.campaignsWithWarnings}
                    </div>
                    <div className="text-sm opacity-75">Warnings</div>
                  </div>
                </div>
              </div>

              {campaignValidation.criticalIssues.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Critical Campaign Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {campaignValidation.criticalIssues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <span className="font-medium text-red-800">Campaign {issue.campaignId}:</span>
                            <span className="text-sm text-red-700 ml-1">{issue.issue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaignValidation?.validationResults?.map((campaign, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded ${
                          !campaign.isValid
                            ? "border-red-200 bg-red-50"
                            : campaign.warnings.length > 0
                              ? "border-yellow-200 bg-yellow-50"
                              : "border-green-200 bg-green-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">
                              Campaign {campaign.campaignId}: {campaign.name}
                            </span>
                            <Badge variant="outline" className="ml-2">
                              {campaign.targetType}
                            </Badge>
                            <Badge variant="outline" className="ml-1">
                              {campaign.status}
                            </Badge>
                          </div>
                          {campaign.isValid ? (
                            campaign.warnings.length > 0 ? (
                              <Badge variant="secondary">Warnings</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Valid</Badge>
                            )
                          ) : (
                            <Badge variant="destructive">Invalid</Badge>
                          )}
                        </div>

                        {campaign.selectedCount !== undefined && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Selected: {campaign.selectedCount} • Recipients: {campaign.recipientCount}
                          </div>
                        )}

                        {campaign.issues.length > 0 && (
                          <div className="space-y-1">
                            {campaign.issues.map((issue, issueIndex) => (
                              <div key={issueIndex} className="flex items-start gap-2 text-sm">
                                <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                                <span className="text-red-700">{issue}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {campaign.warnings.length > 0 && (
                          <div className="space-y-1">
                            {campaign.warnings.map((warning, warningIndex) => (
                              <div key={warningIndex} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />
                                <span className="text-yellow-700">{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Run campaign validation to see results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
