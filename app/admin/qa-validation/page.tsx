"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle, Clock, Shield, RotateCcw } from "lucide-react"

interface QAReport {
  timestamp: string
  environment: string
  total_tests: number
  passed_tests: number
  failed_tests: number
  overall_status: "PASS" | "FAIL" | "WARNING"
  tests: Array<{
    test_name: string
    success: boolean
    error?: string
    details?: any
    execution_time_ms: number
  }>
  recommendations: string[]
  rollback_required: boolean
}

export default function QAValidationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [qaReport, setQaReport] = useState<QAReport | null>(null)
  const [safetyReport, setSafetyReport] = useState<any>(null)
  const [rollbackPlan, setRollbackPlan] = useState<any>(null)
  const [currentTest, setCurrentTest] = useState<string>("")

  const runQAValidation = async () => {
    setIsRunning(true)
    setCurrentTest("Initializing QA validation...")

    try {
      const response = await fetch("/api/qa-email-campaign-validation", {
        method: "POST",
      })

      const data = await response.json()
      setQaReport(data.qa_report)
      setCurrentTest("")
    } catch (error) {
      console.error("QA validation failed:", error)
      setCurrentTest("QA validation failed")
    } finally {
      setIsRunning(false)
    }
  }

  const runSafetyCheck = async () => {
    try {
      const response = await fetch("/api/qa-production-safety-check", {
        method: "POST",
      })

      const data = await response.json()
      setSafetyReport(data.safety_report)
    } catch (error) {
      console.error("Safety check failed:", error)
    }
  }

  const generateRollbackPlan = async () => {
    try {
      const response = await fetch("/api/qa-rollback-plan", {
        method: "POST",
      })

      const data = await response.json()
      setRollbackPlan(data.rollback_plan)
    } catch (error) {
      console.error("Rollback plan generation failed:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "FAIL":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "bg-green-100 text-green-800"
      case "FAIL":
        return "bg-red-100 text-red-800"
      case "WARNING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QA Email Campaign Validation</h1>
          <p className="text-muted-foreground">Comprehensive validation suite for email campaign system changes</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Head of QA Review
        </Badge>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            QA Control Panel
          </CardTitle>
          <CardDescription>Run comprehensive tests before production deployment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runQAValidation} disabled={isRunning} className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Running Tests...
                </>
              ) : (
                "Run Full QA Validation"
              )}
            </Button>

            <Button variant="outline" onClick={runSafetyCheck} className="flex items-center gap-2 bg-transparent">
              <Shield className="h-4 w-4" />
              Safety Check
            </Button>

            <Button variant="outline" onClick={generateRollbackPlan} className="flex items-center gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Rollback Plan
            </Button>
          </div>

          {isRunning && currentTest && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Current Test:</div>
              <div className="text-sm font-medium">{currentTest}</div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* QA Report */}
      {qaReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(qaReport.overall_status)}
                QA Validation Report
              </span>
              <Badge className={getStatusColor(qaReport.overall_status)}>{qaReport.overall_status}</Badge>
            </CardTitle>
            <CardDescription>
              Executed on {new Date(qaReport.timestamp).toLocaleString()} • Environment: {qaReport.environment}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{qaReport.passed_tests}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{qaReport.failed_tests}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{qaReport.total_tests}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            <Progress value={(qaReport.passed_tests / qaReport.total_tests) * 100} className="mb-6" />

            {/* Deployment Decision */}
            <Alert
              className={
                qaReport.overall_status === "PASS"
                  ? "border-green-200 bg-green-50"
                  : qaReport.overall_status === "WARNING"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50"
              }
            >
              <AlertDescription className="font-medium">
                {qaReport.overall_status === "PASS" && "✅ DEPLOYMENT APPROVED - All critical tests passed"}
                {qaReport.overall_status === "WARNING" && "⚠️ DEPLOYMENT WITH CAUTION - Review warnings"}
                {qaReport.overall_status === "FAIL" && "🚨 DEPLOYMENT BLOCKED - Critical issues found"}
              </AlertDescription>
            </Alert>

            {/* Recommendations */}
            {qaReport.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">QA Recommendations:</h4>
                <ul className="space-y-1">
                  {qaReport.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Test Results */}
            <Tabs defaultValue="summary" className="mt-6">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Detailed Results</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-2">
                {qaReport.tests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {test.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{test.test_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{test.execution_time_ms}ms</span>
                      <Badge variant={test.success ? "default" : "destructive"}>{test.success ? "PASS" : "FAIL"}</Badge>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {qaReport.tests.map((test, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {test.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {test.test_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {test.error && (
                        <Alert className="mb-3">
                          <AlertDescription>{test.error}</AlertDescription>
                        </Alert>
                      )}
                      {test.details && (
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Safety Report */}
      {safetyReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Production Safety Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safetyReport.checks.map((check: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {check.safe ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{check.name}</span>
                  </div>
                  <Badge variant={check.safe ? "default" : "destructive"}>{check.status}</Badge>
                </div>
              ))}
            </div>

            {safetyReport.critical_issues.length > 0 && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription>
                  <strong>Critical Issues:</strong>
                  <ul className="mt-2 space-y-1">
                    {safetyReport.critical_issues.map((issue: string, index: number) => (
                      <li key={index} className="text-sm">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rollback Plan */}
      {rollbackPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Emergency Rollback Plan
            </CardTitle>
            <CardDescription>Execute only if deployment causes critical issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rollbackPlan.steps.map((step: any, index: number) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">
                      Step {step.step}: {step.action}
                    </h4>
                    <Badge
                      variant={step.risk === "LOW" ? "default" : step.risk === "MEDIUM" ? "secondary" : "destructive"}
                    >
                      {step.risk} RISK
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                  {step.sql && <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{step.sql}</pre>}
                  {step.warning && (
                    <Alert className="mt-2">
                      <AlertDescription className="text-sm">{step.warning}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
