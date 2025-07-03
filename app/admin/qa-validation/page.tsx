"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, Play, Shield, Database, Clock, RefreshCw } from "lucide-react"

interface QATestResult {
  test_name: string
  success: boolean
  error?: string
  details?: any
  execution_time_ms: number
}

interface QAValidationReport {
  timestamp: string
  environment: string
  total_tests: number
  passed_tests: number
  failed_tests: number
  overall_status: "PASS" | "FAIL" | "WARNING"
  tests: QATestResult[]
  recommendations: string[]
  rollback_required: boolean
}

interface SafetyReport {
  timestamp: string
  environment: string
  overall_safe: boolean
  deployment_approved: boolean
  total_checks: number
  passed_checks: number
  failed_checks: number
  safety_checks: Array<{
    check: string
    passed: boolean
    details: string
    data?: any
  }>
  recommendations: string[]
}

export default function QAValidationPage() {
  const [loading, setLoading] = useState(false)
  const [validationReport, setValidationReport] = useState<QAValidationReport | null>(null)
  const [safetyReport, setSafetyReport] = useState<SafetyReport | null>(null)
  const [activeTab, setActiveTab] = useState("validation")

  const runValidation = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/qa-email-campaign-validation", {
        method: "POST",
      })
      const data = await response.json()
      setValidationReport(data.qa_report)
    } catch (error) {
      console.error("Validation failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const runSafetyCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/qa-production-safety-check", {
        method: "POST",
      })
      const data = await response.json()
      setSafetyReport(data.safety_report)
    } catch (error) {
      console.error("Safety check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string | boolean) => {
    if (status === "PASS" || status === true) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (status === "WARNING") {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: string | boolean) => {
    if (status === "PASS" || status === true) return "text-green-700 bg-green-50 border-green-200"
    if (status === "WARNING") return "text-yellow-700 bg-yellow-50 border-yellow-200"
    return "text-red-700 bg-red-50 border-red-200"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QA Email Campaign Validation</h1>
          <p className="text-gray-600">Comprehensive testing suite for email campaign system</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runValidation} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Run Validation
          </Button>
          <Button onClick={runSafetyCheck} disabled={loading} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Safety Check
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="validation">System Validation</TabsTrigger>
          <TabsTrigger value="safety">Production Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-6">
          {validationReport && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(validationReport.overall_status)}
                        Validation Report
                      </CardTitle>
                      <CardDescription>
                        Executed at {new Date(validationReport.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(validationReport.overall_status)}>
                      {validationReport.overall_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{validationReport.passed_tests}</div>
                      <div className="text-sm text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{validationReport.failed_tests}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{validationReport.total_tests}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>

                  <Progress
                    value={(validationReport.passed_tests / validationReport.total_tests) * 100}
                    className="mb-4"
                  />

                  {validationReport.recommendations.length > 0 && (
                    <Alert className={getStatusColor(validationReport.overall_status)}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {validationReport.recommendations.map((rec, index) => (
                            <div key={index}>• {rec}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {validationReport.tests.map((test, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStatusIcon(test.success)}
                          {test.test_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {test.execution_time_ms}ms
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {test.error && (
                        <Alert className="mb-3 border-red-200 bg-red-50">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-700">{test.error}</AlertDescription>
                        </Alert>
                      )}

                      {test.details && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-sm overflow-x-auto">{JSON.stringify(test.details, null, 2)}</pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!validationReport && (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Click "Run Validation" to start comprehensive testing</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          {safetyReport && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(safetyReport.overall_safe)}
                        Production Safety Report
                      </CardTitle>
                      <CardDescription>Executed at {new Date(safetyReport.timestamp).toLocaleString()}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(safetyReport.overall_safe)}>
                      {safetyReport.deployment_approved ? "APPROVED" : "BLOCKED"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{safetyReport.passed_checks}</div>
                      <div className="text-sm text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{safetyReport.failed_checks}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{safetyReport.total_checks}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>

                  <Progress value={(safetyReport.passed_checks / safetyReport.total_checks) * 100} className="mb-4" />

                  <Alert className={getStatusColor(safetyReport.overall_safe)}>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {safetyReport.recommendations.map((rec, index) => (
                          <div key={index}>• {rec}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {safetyReport.safety_checks.map((check, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon(check.passed)}
                        {check.check}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-3">{check.details}</p>

                      {check.data && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-sm overflow-x-auto">{JSON.stringify(check.data, null, 2)}</pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!safetyReport && (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Click "Safety Check" to verify production readiness</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
