"use client"

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
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Application Error</h1>
            <p className="text-gray-600">Something went wrong. Please try refreshing the page.</p>
            <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
