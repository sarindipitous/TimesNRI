"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SeedPage() {
  const [numEntries, setNumEntries] = useState(10)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const seedDatabase = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch(`/api/seed?count=${numEntries}`, {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || "Failed to seed database")
      }
    } catch (err) {
      setError("An error occurred while seeding the database")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Seed Database</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button className="float-right font-bold" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate Sample Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numEntries">Number of Entries</Label>
                <Input
                  id="numEntries"
                  type="number"
                  min="1"
                  max="100"
                  value={numEntries}
                  onChange={(e) => setNumEntries(Number.parseInt(e.target.value))}
                />
              </div>
            </div>

            <Button onClick={seedDatabase} disabled={loading}>
              {loading ? "Seeding..." : "Seed Database"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Seed Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
