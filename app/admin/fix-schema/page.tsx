"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, Database, RefreshCw, AlertTriangle } from "lucide-react"

export default function FixSchemaPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const executeSchemaFix = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/execute-schema-fix", {
        method: "POST",
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Schema fix failed:", error)
      setResult({
        success: false,
        error: "Failed to execute schema fix",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "added":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "skipped":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "added":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Added
          </Badge>
        )
      case "skipped":
        return <Badge variant="secondary">Skipped</Badge>
      default:
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-6 w-6 text-blue-500" />
          <h1 className="text-3xl font-bold">Fix Campaign Schema</h1>
        </div>
        <p className="text-muted-foreground">Execute database schema fixes for the email campaign system</p>
      </div>

      <Alert className="mb-6 border-blue-500 bg-blue-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>SCHEMA FIX:</strong> This will fix the missing updated_at column and ensure proper campaign table
          structure. Safe to run multiple times.
        </AlertDescription>
      </Alert>

      <div className="mb-6">
        <Button onClick={executeSchemaFix} disabled={loading} className="w-full" size="lg">
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Executing Schema Fix...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Execute Schema Fix
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          {result.success ? (
            <>
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  <strong>SUCCESS:</strong> {result.message}
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Execution Summary
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {result.summary.completedSteps}/{result.summary.totalSteps} Steps
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{result.summary.completedSteps}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{result.summary.addedSteps}</div>
                      <div className="text-sm text-muted-foreground">Added</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{result.summary.skippedSteps}</div>
                      <div className="text-sm text-muted-foreground">Skipped</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{result.summary.totalSteps}</div>
                      <div className="text-sm text-muted-foreground">Total Steps</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Execution Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.results.map((step: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded">
                        {getStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{step.step}</h4>
                            {getStatusBadge(step.status)}
                          </div>
                          {step.message && <p className="text-sm text-muted-foreground mb-2">{step.message}</p>}
                          {step.data && (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-blue-600">View Data</summary>
                              <pre className="bg-gray-50 p-2 rounded mt-1 overflow-auto text-xs">
                                {JSON.stringify(step.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Show targeting analysis if available */}
              {result.results.find((r: any) => r.step === "Targeting analysis") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Targeting Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const targetingStep = result.results.find((r: any) => r.step === "Targeting analysis")
                      const analysis = targetingStep?.data?.analysis || []

                      return (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Found {targetingStep?.data?.selectedCampaignsCount || 0} campaigns with 'selected' targeting
                          </p>
                          {analysis.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                              <div>
                                <strong>Campaign {item.campaignId}:</strong> {item.name}
                              </div>
                              <div className="flex items-center gap-2">
                                {item.error ? (
                                  <Badge variant="destructive">{item.error}</Badge>
                                ) : (
                                  <>
                                    <Badge variant={item.isValidArray ? "default" : "destructive"}>
                                      {item.isValidArray ? "Valid Array" : "Invalid"}
                                    </Badge>
                                    {item.selectedCount !== undefined && (
                                      <Badge variant="secondary">{item.selectedCount} recipients</Badge>
                                    )}
                                  </>
                                )}
                                <Badge variant="outline">{item.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert className="border-red-500 bg-red-50">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>ERROR:</strong> {result.error}
                {result.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">View Details</summary>
                    <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">{result.details}</pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
