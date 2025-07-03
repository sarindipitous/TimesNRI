"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, AlertTriangle, Database, Bug } from "lucide-react"

export default function FixCampaignsPage() {
  const [isDebugging, setIsDebugging] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [fixResult, setFixResult] = useState<any>(null)

  const debugCampaignTable = async () => {
    setIsDebugging(true)
    setDebugResult(null)

    try {
      const response = await fetch("/api/debug-campaign-update")
      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      setDebugResult({
        success: false,
        error: "Failed to debug campaign table",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsDebugging(false)
    }
  }

  const fixCampaignTable = async () => {
    setIsFixing(true)
    setFixResult(null)

    try {
      const response = await fetch("/api/fix-campaign-table", {
        method: "POST",
      })
      const data = await response.json()
      setFixResult(data)
    } catch (error) {
      setFixResult({
        success: false,
        error: "Failed to fix campaign table",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              Campaign Database Fix
            </CardTitle>
            <CardDescription>Fix the "record 'new' has no field 'updated_at'" error</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> record "new" has no field "updated_at"
                <br />
                This indicates the email_campaigns table structure is incomplete.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Step 1: Debug Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={debugCampaignTable} disabled={isDebugging} className="w-full">
                    {isDebugging ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Debugging...
                      </>
                    ) : (
                      "Debug Campaign Table"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Step 2: Fix Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={fixCampaignTable} disabled={isFixing} className="w-full">
                    {isFixing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      "Fix Campaign Table"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {debugResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Debug Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className={debugResult.success ? "border-green-500" : "border-red-500"}>
                    <div className="flex items-center gap-2">
                      {debugResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <AlertDescription>
                        <strong>{debugResult.success ? "Debug Complete" : "Debug Failed"}</strong>
                      </AlertDescription>
                    </div>
                  </Alert>

                  {debugResult.success && (
                    <div className="mt-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Table Exists:</strong> {debugResult.tableExists ? "✅ Yes" : "❌ No"}
                        </div>
                        <div>
                          <strong>Has updated_at:</strong> {debugResult.hasUpdatedAtColumn ? "✅ Yes" : "❌ No"}
                        </div>
                      </div>

                      {debugResult.columns && (
                        <div>
                          <strong>Columns ({debugResult.columns.length}):</strong>
                          <div className="mt-1 text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                            {debugResult.columns.map((col: any, i: number) => (
                              <div key={i} className="flex justify-between">
                                <span>{col.name}</span>
                                <span className="text-gray-500">{col.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {debugResult.error && (
                    <div className="mt-2 text-xs bg-red-100 p-2 rounded">
                      <strong>Error:</strong> {debugResult.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {fixResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fix Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className={fixResult.success ? "border-green-500" : "border-red-500"}>
                    <div className="flex items-center gap-2">
                      {fixResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <AlertDescription>
                        <strong>{fixResult.success ? "Fix Applied Successfully" : "Fix Failed"}</strong>
                        <br />
                        {fixResult.message}
                      </AlertDescription>
                    </div>
                  </Alert>

                  {fixResult.success && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>✅ Campaign system is now ready!</strong>
                        <br />
                        You can go back and send your campaigns successfully.
                      </div>
                      {fixResult.addedColumns && (
                        <div className="mt-2 text-xs">
                          <strong>Added columns:</strong> {fixResult.addedColumns.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {fixResult.error && (
                    <div className="mt-2 text-xs bg-red-100 p-2 rounded">
                      <strong>Error:</strong> {fixResult.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
