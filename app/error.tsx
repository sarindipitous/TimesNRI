"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-red-500">
            <AlertTriangle className="h-full w-full" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>An unexpected error occurred. We apologize for the inconvenience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Error:</strong> {error.message}
              {error.digest && (
                <div className="mt-1">
                  <strong>Digest:</strong> {error.digest}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1 bg-transparent" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = "/")} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
