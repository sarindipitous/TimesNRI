"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"

export default function UrgentFixPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const applyUrgentFix = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-campaign-schema-urgent", {
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
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Urgent Campaign Fix
            </CardTitle>
            <CardDescription>
              Fix the missing "updated_at" column that's preventing campaigns from sending
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> record "new" has no field "updated_at"
                <br />
                This indicates the email_campaigns table is missing the updated_at column.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What this fix does:</h3>
              <ul className="text-sm space-y-1">
                <li>• Adds the missing "updated_at" column to email_campaigns table</li>
                <li>• Updates existing campaign records with proper timestamps</li>
                <li>• Allows campaigns to send successfully</li>
              </ul>
            </div>

            <Button onClick={applyUrgentFix} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying Urgent Fix...
                </>
              ) : (
                "Apply Urgent Fix Now"
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
                  <AlertDescription>
                    <strong>{result.success ? "Success:" : "Error:"}</strong> {result.message}
                  </AlertDescription>
                </div>
                {result.details && (
                  <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                    <pre>{JSON.stringify(result.details, null, 2)}</pre>
                  </div>
                )}
                {result.success && (
                  <div className="mt-2 text-sm text-green-700">
                    ✅ You can now go back and send your campaign successfully!
                  </div>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
