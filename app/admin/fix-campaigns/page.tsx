"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, CheckCircle, AlertCircle, Wrench } from "lucide-react"

interface DebugResult {
  success: boolean
  debug?: {
    tableExists: boolean
    hasUpdatedAtColumn: boolean
    totalColumns: number
    columns: Array<{
      name: string
      type: string
      nullable: string
      default: string | null
    }>
    sampleCampaigns: Array<{
      id: number
      name: string
      status: string
      created_at: string
    }>
    updateTestResult: string
    updatedAtTestResult: string
  }
  error?: string
}

interface FixResult {
  success: boolean
  message?: string
  action?: string
  addedColumns?: string[]
  error?: string
}

export default function FixCampaignsPage() {
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)

  const debugCampaignTable = async () => {
    setLoading(true)
    setDebugResult(null)

    try {
      const response = await fetch("/api/debug-campaign-update")
      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      setDebugResult({
        success: false,
        error: "Failed to debug campaign table",
      })
    } finally {
      setLoading(false)
    }
  }

  const fixCampaignTable = async () => {
    setFixing(true)
    setFixResult(null)

    try {
      const response = await fetch("/api/fix-campaign-table", {
        method: "POST",
      })
      const data = await response.json()
      setFixResult(data)

      // Refresh debug info after fix
      if (data.success) {
        setTimeout(() => {
          debugCampaignTable()
        }, 1000)
      }
    } catch (error) {
      setFixResult({
        success: false,
        error: "Failed to fix campaign table",
      })
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fix Campaign System</h1>
        <p className="text-gray-600">Debug and fix the email campaigns database structure</p>
      </div>

      <div className="grid gap-6">
        {/* Debug Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Debug Campaign Table
            </CardTitle>
            <CardDescription>Check the current state of the email_campaigns table</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={debugCampaignTable} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Debugging...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Debug Campaign Table
                </>
              )}
            </Button>

            {debugResult && (
              <div className="space-y-4">
                {debugResult.success ? (
                  <div className="space-y-4">
                    <Alert className="border-green-500">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-green-700">Debug completed successfully</AlertDescription>
                    </Alert>

                    {debugResult.debug && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Table Status</h4>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span>Table Exists:</span>
                                <Badge variant={debugResult.debug.tableExists ? "default" : "destructive"}>
                                  {debugResult.debug.tableExists ? "Yes" : "No"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>Has updated_at:</span>
                                <Badge variant={debugResult.debug.hasUpdatedAtColumn ? "default" : "destructive"}>
                                  {debugResult.debug.hasUpdatedAtColumn ? "Yes" : "No"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>Total Columns:</span>
                                <Badge variant="outline">{debugResult.debug.totalColumns}</Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Test Results</h4>
                            <div className="space-y-1 text-sm">
                              <div
                                className={
                                  debugResult.debug.updateTestResult.includes("✅") ? "text-green-600" : "text-red-600"
                                }
                              >
                                {debugResult.debug.updateTestResult}
                              </div>
                              <div
                                className={
                                  debugResult.debug.updatedAtTestResult?.includes("✅")
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {debugResult.debug.updatedAtTestResult}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Table Columns</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {debugResult.debug.columns.map((col) => (
                              <div key={col.name} className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {col.name}
                                </Badge>
                                <span className="text-gray-500">({col.type})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {debugResult.debug.sampleCampaigns.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Sample Campaigns</h4>
                            <div className="space-y-1 text-sm">
                              {debugResult.debug.sampleCampaigns.map((campaign) => (
                                <div key={campaign.id} className="flex items-center gap-2">
                                  <Badge variant="outline">ID: {campaign.id}</Badge>
                                  <span>{campaign.name}</span>
                                  <Badge variant="secondary">{campaign.status}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert className="border-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{debugResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fix Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Fix Campaign Table
            </CardTitle>
            <CardDescription>Add missing columns and fix the table structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fixCampaignTable} disabled={fixing} className="w-full" variant="destructive">
              {fixing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Fix Campaign Table
                </>
              )}
            </Button>

            {fixResult && (
              <div className="space-y-4">
                {fixResult.success ? (
                  <div className="space-y-2">
                    <Alert className="border-green-500">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-green-700">{fixResult.message}</AlertDescription>
                    </Alert>

                    {fixResult.addedColumns && fixResult.addedColumns.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Added Columns:</h4>
                        <div className="flex flex-wrap gap-2">
                          {fixResult.addedColumns.map((column) => (
                            <Badge key={column} variant="default">
                              {column}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert className="border-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{fixResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. First, click "Debug Campaign Table" to see what's wrong</p>
            <p>2. If the debug shows missing columns or issues, click "Fix Campaign Table"</p>
            <p>3. After fixing, try sending your campaign again</p>
            <p>4. If issues persist, check the server logs for more details</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
