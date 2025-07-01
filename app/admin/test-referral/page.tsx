"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { TestTube, Users, Link, CheckCircle, XCircle, RefreshCw, ExternalLink, Copy } from "lucide-react"

interface TestResult {
  success: boolean
  message?: string
  error?: string
  details?: any
  results?: any
}

export default function TestReferralPage() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [referralStats, setReferralStats] = useState<any>(null)
  const [testReferrerEmail, setTestReferrerEmail] = useState("referrer@test.com")
  const [testReferredEmail, setTestReferredEmail] = useState("referred@test.com")
  const [testReferredName, setTestReferredName] = useState("Test Referred User")
  const [customReferralLink, setCustomReferralLink] = useState("")

  const runReferralTest = async () => {
    setLoading(true)
    setTestResults(null)

    try {
      console.log("🧪 Starting referral test...")

      const response = await fetch("/api/test-referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referrerEmail: testReferrerEmail,
          referredEmail: testReferredEmail,
          referredName: testReferredName,
        }),
      })

      const result = await response.json()
      setTestResults(result)

      if (result.success) {
        toast({
          title: "Test Successful",
          description: "Referral flow test completed successfully",
        })
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Test failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Test error:", error)
      setTestResults({
        success: false,
        error: "Test request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      toast({
        title: "Test Error",
        description: "Failed to run test",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReferralStats = async () => {
    try {
      const response = await fetch("/api/test-referral")
      const result = await response.json()
      setReferralStats(result)
    } catch (error) {
      console.error("Stats error:", error)
      toast({
        title: "Stats Error",
        description: "Failed to fetch referral stats",
        variant: "destructive",
      })
    }
  }

  const generateReferralLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const link = `${baseUrl}?ref=${encodeURIComponent(testReferrerEmail)}`
    setCustomReferralLink(link)
  }

  const copyReferralLink = () => {
    navigator.clipboard.writeText(customReferralLink)
    toast({
      title: "Copied",
      description: "Referral link copied to clipboard",
    })
  }

  const testReferralLink = () => {
    if (customReferralLink) {
      window.open(customReferralLink, "_blank")
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Referral System QA
          </h1>
          <p className="text-muted-foreground">Test and verify the referral system end-to-end</p>
        </div>
        <Button onClick={fetchReferralStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Stats
        </Button>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">Run Tests</TabsTrigger>
          <TabsTrigger value="stats">Current Stats</TabsTrigger>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Automated Referral Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="referrer-email">Referrer Email</Label>
                  <Input
                    id="referrer-email"
                    value={testReferrerEmail}
                    onChange={(e) => setTestReferrerEmail(e.target.value)}
                    placeholder="referrer@test.com"
                  />
                </div>
                <div>
                  <Label htmlFor="referred-email">Referred Email</Label>
                  <Input
                    id="referred-email"
                    value={testReferredEmail}
                    onChange={(e) => setTestReferredEmail(e.target.value)}
                    placeholder="referred@test.com"
                  />
                </div>
                <div>
                  <Label htmlFor="referred-name">Referred Name</Label>
                  <Input
                    id="referred-name"
                    value={testReferredName}
                    onChange={(e) => setTestReferredName(e.target.value)}
                    placeholder="Test User"
                  />
                </div>
              </div>

              <Button onClick={runReferralTest} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Referral Test
                  </>
                )}
              </Button>

              {testResults && (
                <Card className={testResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      {testResults.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${testResults.success ? "text-green-800" : "text-red-800"}`}>
                        {testResults.success ? "Test Passed" : "Test Failed"}
                      </span>
                    </div>

                    {testResults.message && <p className="text-sm mb-4">{testResults.message}</p>}

                    {testResults.error && <p className="text-sm text-red-600 mb-4">{testResults.error}</p>}

                    {testResults.results && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Test Results:</h4>
                          <Textarea
                            value={JSON.stringify(testResults.results, null, 2)}
                            readOnly
                            className="font-mono text-xs"
                            rows={10}
                          />
                        </div>
                      </div>
                    )}

                    {testResults.details && (
                      <div>
                        <h4 className="font-medium mb-4">Details:</h4>
                        <Textarea
                          value={JSON.stringify(testResults.details, null, 2)}
                          readOnly
                          className="font-mono text-xs"
                          rows={5}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Referral Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referralStats ? (
                <div className="space-y-6">
                  {referralStats.success ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{referralStats.stats.total_submissions}</div>
                            <p className="text-sm text-muted-foreground">Total Submissions</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{referralStats.stats.referred_submissions}</div>
                            <p className="text-sm text-muted-foreground">Referred Submissions</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{referralStats.stats.unique_referrers}</div>
                            <p className="text-sm text-muted-foreground">Unique Referrers</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Table Statistics:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">{referralStats.stats.table_stat_1}</div>
                              <p className="text-sm text-muted-foreground">Table Stat 1</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">{referralStats.stats.table_stat_2}</div>
                              <p className="text-sm text-muted-foreground">Table Stat 2</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">{referralStats.stats.table_stat_3}</div>
                              <p className="text-sm text-muted-foreground">Table Stat 3</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-red-600">Failed to load referral statistics</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading referral statistics...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Manual Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="manual-referrer-email">Referrer Email</Label>
                  <Input
                    id="manual-referrer-email"
                    value={testReferrerEmail}
                    onChange={(e) => setTestReferrerEmail(e.target.value)}
                    placeholder="referrer@test.com"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-referred-email">Referred Email</Label>
                  <Input
                    id="manual-referred-email"
                    value={testReferredEmail}
                    onChange={(e) => setTestReferredEmail(e.target.value)}
                    placeholder="referred@test.com"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-referred-name">Referred Name</Label>
                  <Input
                    id="manual-referred-name"
                    value={testReferredName}
                    onChange={(e) => setTestReferredName(e.target.value)}
                    placeholder="Test User"
                  />
                </div>
              </div>

              <Button onClick={generateReferralLink} className="w-full">
                <Link className="h-4 w-4 mr-2" />
                Generate Referral Link
              </Button>

              {customReferralLink && (
                <div className="flex items-center gap-4">
                  <Textarea value={customReferralLink} readOnly className="font-mono text-xs" rows={1} />
                  <Button onClick={copyReferralLink} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button onClick={testReferralLink} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
