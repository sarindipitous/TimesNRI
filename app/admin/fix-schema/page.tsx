"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface SchemaColumn {
  name: string
  type: string
  nullable: string
  default: string | null
}

interface FixResult {
  success: boolean
  message: string
  details: {
    hadUpdatedAtColumn: boolean
    currentColumns: number
    finalSchema: SchemaColumn[]
    testResult?: any
  }
  error?: string
}

export default function FixSchemaPage() {
  const [isFixing, setIsFixing] = useState(false)
  const [result, setResult] = useState<FixResult | null>(null)

  const handleFixSchema = async () => {
    setIsFixing(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-email-campaigns-schema", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to fix schema",
        error: error instanceof Error ? error.message : "Unknown error",
        details: {
          hadUpdatedAtColumn: false,
          currentColumns: 0,
          finalSchema: [],
        },
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Fix Email Campaigns Schema</h1>
        <p className="text-muted-foreground mt-2">
          Fix the missing "updated_at" column in the email_campaigns table that's causing campaign sending errors.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Schema Fix Required
          </CardTitle>
          <CardDescription>
            The email campaigns system is failing because the database table is missing the "updated_at" column. This
            fix will add the missing column and create the necessary triggers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>What this fix does:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Adds the missing "updated_at" column to email_campaigns table</li>
                  <li>Sets default values for existing records</li>
                  <li>Creates a trigger to automatically update the timestamp</li>
                  <li>Tests the fix with a sample update</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button onClick={handleFixSchema} disabled={isFixing} className="w-full">
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing Schema...
                </>
              ) : (
                "Fix Email Campaigns Schema"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Fix Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={result.success ? "border-green-200" : "border-red-200"}>
              <AlertDescription>
                <strong>{result.success ? "Success:" : "Error:"}</strong> {result.message}
              </AlertDescription>
            </Alert>

            {result.success && result.details && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Fix Summary</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={result.details.hadUpdatedAtColumn ? "secondary" : "default"}>
                          {result.details.hadUpdatedAtColumn ? "Column Existed" : "Column Added"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Total columns: {result.details.currentColumns}</p>
                    </div>
                  </div>

                  {result.details.testResult && (
                    <div>
                      <h4 className="font-semibold mb-2">Test Result</h4>
                      <div className="text-sm space-y-1">
                        <p>Campaign ID: {result.details.testResult.id}</p>
                        <p>Name: {result.details.testResult.name}</p>
                        <p className="text-green-600">✅ Update trigger working</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Final Schema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {result.details.finalSchema.map((column, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border text-sm ${
                          column.name === "updated_at" ? "bg-green-50 border-green-200" : "bg-gray-50"
                        }`}
                      >
                        <div className="font-mono">
                          <span className="font-semibold">{column.name}</span>
                          <span className="text-muted-foreground"> ({column.type})</span>
                        </div>
                        {column.name === "updated_at" && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Fixed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!result.success && result.error && (
              <Alert className="border-red-200">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error Details:</strong> {result.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {result?.success && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-green-600">✅ Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>The schema has been fixed! You can now:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Go back to the QA Update Fix page and run the tests again</li>
                <li>Try creating and sending email campaigns</li>
                <li>The "updated_at" error should be resolved</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
