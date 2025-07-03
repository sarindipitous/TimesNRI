"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function FixSchemaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const applySchemaFix = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/execute-schema-fix", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to connect to API",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Database Schema Fix</CardTitle>
            <CardDescription>Apply the missing updated_at column fix to the email_campaigns table</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                This will add the missing updated_at column to the email_campaigns table and update existing records.
              </AlertDescription>
            </Alert>

            <Button onClick={applySchemaFix} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying Fix...
                </>
              ) : (
                "Apply Schema Fix"
              )}
            </Button>

            {result && (
              <Alert className={result.success ? "border-green-500" : "border-red-500"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>{result.success ? result.message : result.error}</AlertDescription>
                </div>
                {result.details && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
