"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Database } from "lucide-react"

export default function AddColumnPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [result, setResult] = useState<any>(null)

  const addUpdatedAtColumn = async () => {
    setIsAdding(true)
    setResult(null)

    try {
      const response = await fetch("/api/add-updated-at", {
        method: "POST",
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to add updated_at column",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Add Missing Database Column
            </CardTitle>
            <CardDescription>Add the missing "updated_at" column to fix the campaign sending error</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Error:</strong> record "new" has no field "updated_at"
                <br />
                This will add the missing column to your email_campaigns table.
              </AlertDescription>
            </Alert>

            <Button onClick={addUpdatedAtColumn} disabled={isAdding} className="w-full" size="lg">
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Column...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Add updated_at Column
                </>
              )}
            </Button>

            {result && (
              <Card>
                <CardContent className="pt-6">
                  <Alert className={result.success ? "border-green-500" : "border-red-500"}>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <AlertDescription>
                        <strong>{result.success ? "Success!" : "Failed"}</strong>
                        <br />
                        {result.message || result.error}
                      </AlertDescription>
                    </div>
                  </Alert>

                  {result.success && (
                    <div className="mt-4 space-y-2">
                      {result.action && (
                        <div className="text-sm">
                          <strong>Action:</strong> {result.action}
                        </div>
                      )}
                      {result.updatedRecords !== undefined && (
                        <div className="text-sm">
                          <strong>Updated Records:</strong> {result.updatedRecords}
                        </div>
                      )}
                      {result.columnInfo && (
                        <div className="text-sm">
                          <strong>Column Info:</strong> {result.columnInfo.column_name} ({result.columnInfo.data_type})
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-800">
                          <strong>✅ Campaign system is now fixed!</strong>
                          <br />
                          You can now go back and send your campaigns successfully.
                        </div>
                      </div>
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-2 text-xs bg-red-100 p-2 rounded">
                      <strong>Error Details:</strong> {result.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What This Does</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• Adds the missing "updated_at" column to the email_campaigns table</p>
            <p>• Sets default values for existing campaign records</p>
            <p>• Fixes the "record 'new' has no field 'updated_at'" error</p>
            <p>• Allows campaigns to be sent successfully</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
