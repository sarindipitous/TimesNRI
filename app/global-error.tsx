"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-red-500">
                <AlertTriangle className="h-full w-full" />
              </div>
              <CardTitle className="text-xl">Application Error</CardTitle>
              <CardDescription>A critical error occurred. Please refresh the page or contact support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Error:</strong> {error.message}
                {error.digest && (
                  <div className="mt-1">
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
              </div>
              <Button onClick={reset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
