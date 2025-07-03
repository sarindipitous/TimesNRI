"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Search, Bug, Shield, RefreshCw } from "lucide-react"

export default function EmergencyAuditPage() {
  const [campaignId, setCampaignId] = useState("")
  const [auditResult, setAuditResult] = useState<any>(null)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [fixResult, setFixResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runEmergencyAudit = async () => {
    if (!campaignId) return

    setLoading(true)
    try {
      const response = await fetch("/api/emergency-campaign-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: Number.parseInt(campaignId) }),
      })
      const data = await response.json()
      setAuditResult(data)
    } catch (error) {
      console.error("Emergency audit failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const debugRecipientSelection = async () => {
    if (!campaignId) return

    setLoading(true)
    try {
      const response = await fetch("/api/debug-recipient-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: Number.parseInt(campaignId) }),
      })
      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      console.error("Debug failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeTargetingIssues = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/fix-recipient-targeting", {
        method: "POST",
      })
      const data = await response.json()
      setFixResult(data)
    } catch (error) {
      console.error("Fix analysis failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h1 className="text-3xl font-bold text-red-600">EMERGENCY CAMPAIGN AUDIT</h1>
        </div>
        <p className="text-muted-foreground">
          Critical analysis for campaign targeting issues in production environment
        </p>
      </div>

      <Alert className="mb-6 border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          <strong>PRODUCTION ALERT:</strong> Use this tool to immediately investigate campaign targeting issues. This
          will not send any emails or modify data.
        </AlertDescription>
      </Alert>

      <div className="mb-6">
        <Label htmlFor="campaignId">Campaign ID to Audit</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="campaignId"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            placeholder="Enter campaign ID"
            className="flex-1"
          />
          <Button onClick={runEmergencyAudit} disabled={loading || !campaignId}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Audit Campaign
          </Button>
        </div>
      </div>

      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit">Emergency Audit</TabsTrigger>
          <TabsTrigger value="debug">Debug Selection</TabsTrigger>
          <TabsTrigger value="fix">System Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          {auditResult && (
            <div className="space-y-4">
              {auditResult.success ? (
                <>
                  {auditResult.audit.targeting_analysis.critical_issue && (
                    <Alert className="border-red-500 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">
                        <strong>CRITICAL ISSUE DETECTED:</strong>{" "}
                        {auditResult.audit.targeting_analysis.issue_description}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Campaign Analysis
                        <Badge
                          variant={auditResult.audit.targeting_analysis.critical_issue ? "destructive" : "default"}
                        >
                          {auditResult.audit.targeting_analysis.critical_issue ? "CRITICAL ISSUE" : "OK"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold">Campaign Info</h4>
                          <div className="text-sm space-y-1">
                            <p>
                              <strong>Name:</strong> {auditResult.audit.campaign_info.name}
                            </p>
                            <p>
                              <strong>Target Type:</strong> {auditResult.audit.campaign_info.target_type}
                            </p>
                            <p>
                              <strong>Status:</strong> {auditResult.audit.campaign_info.status}
                            </p>
                            <p>
                              <strong>Total Recipients:</strong> {auditResult.audit.campaign_info.total_recipients}
                            </p>
                            <p>
                              <strong>Sent Count:</strong> {auditResult.audit.campaign_info.sent_count}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold">Targeting Analysis</h4>
                          <div className="text-sm space-y-1">
                            <p>
                              <strong>Expected:</strong> {auditResult.audit.targeting_analysis.expected_behavior}
                            </p>
                            <p>
                              <strong>Actual Recipients:</strong>{" "}
                              {auditResult.audit.targeting_analysis.actual_recipients_count}
                            </p>
                            <p>
                              <strong>Logs Count:</strong> {auditResult.audit.targeting_analysis.logs_count}
                            </p>
                            <p>
                              <strong>Targeting Correct:</strong>{" "}
                              {auditResult.audit.targeting_analysis.targeting_correct ? "YES" : "NO"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Recipient Comparison</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>
                              Selected in Campaign ({auditResult.audit.recipient_comparison.selected_in_campaign.length}
                              ):
                            </strong>
                            <div className="bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                              {auditResult.audit.recipient_comparison.selected_in_campaign.join(", ") || "None"}
                            </div>
                          </div>
                          <div>
                            <strong>
                              Campaign Recipients ({auditResult.audit.recipient_comparison.campaign_recipients.length}):
                            </strong>
                            <div className="bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                              {auditResult.audit.recipient_comparison.campaign_recipients.join(", ") || "None"}
                            </div>
                          </div>
                          <div>
                            <strong>Actual Logs ({auditResult.audit.recipient_comparison.actual_logs.length}):</strong>
                            <div className="bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                              {auditResult.audit.recipient_comparison.actual_logs.join(", ") || "None"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Delivery Analysis</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {auditResult.audit.logs_analysis.sent_successfully}
                            </div>
                            <div>Sent Successfully</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {auditResult.audit.logs_analysis.failed}
                            </div>
                            <div>Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {auditResult.audit.logs_analysis.pending}
                            </div>
                            <div>Pending</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Alert className="border-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">{auditResult.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="debug">
          <div className="space-y-4">
            <Button onClick={debugRecipientSelection} disabled={loading || !campaignId} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Bug className="h-4 w-4 mr-2" />}
              Debug Recipient Selection Logic
            </Button>

            {debugResult && (
              <div className="space-y-4">
                {debugResult.success ? (
                  <>
                    {debugResult.analysis.critical_issues.length > 0 && (
                      <Alert className="border-red-500 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          <strong>CRITICAL ISSUES FOUND:</strong>
                          <ul className="list-disc list-inside mt-2">
                            {debugResult.analysis.critical_issues.map((issue: string, index: number) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Debug Summary
                          <Badge
                            variant={debugResult.summary.targeting_status === "CORRECT" ? "default" : "destructive"}
                          >
                            {debugResult.summary.targeting_status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p>
                              <strong>Target Type:</strong> {debugResult.summary.campaign_target_type}
                            </p>
                            <p>
                              <strong>Selected Count:</strong> {debugResult.summary.selected_count}
                            </p>
                            <p>
                              <strong>Final Recipients:</strong> {debugResult.summary.final_recipient_count}
                            </p>
                          </div>
                          <div>
                            <p>
                              <strong>Total Waitlist:</strong> {debugResult.summary.total_waitlist_count}
                            </p>
                            <p>
                              <strong>Critical Issues:</strong> {debugResult.summary.critical_issues_count}
                            </p>
                            <p>
                              <strong>Status:</strong> {debugResult.summary.targeting_status}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Debug Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {debugResult.debug_steps.map((step: any, index: number) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4">
                              <h4 className="font-semibold">{step.step}</h4>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                {typeof step.data === "string" ? step.data : JSON.stringify(step.data, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Alert className="border-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{debugResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fix">
          <div className="space-y-4">
            <Button onClick={analyzeTargetingIssues} disabled={loading} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Analyze All Campaigns for Targeting Issues
            </Button>

            {fixResult && (
              <div className="space-y-4">
                {fixResult.success ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          System Analysis Results
                          <Badge variant={fixResult.issues_found > 0 ? "destructive" : "default"}>
                            {fixResult.issues_found} Issues Found
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold">{fixResult.summary.total_campaigns}</div>
                            <div className="text-sm text-muted-foreground">Total Campaigns</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-600">{fixResult.summary.issues_found}</div>
                            <div className="text-sm text-muted-foreground">Issues Found</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-800">{fixResult.summary.critical_issues}</div>
                            <div className="text-sm text-muted-foreground">Critical Issues</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {fixResult.issues.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Issues Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {fixResult.issues.map((issue: any, index: number) => (
                              <div key={index} className="border border-red-200 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">Campaign: {issue.campaign_name}</h4>
                                  <Badge variant="destructive">ID: {issue.campaign_id}</Badge>
                                </div>
                                <p className="text-red-700 mb-2">{issue.issue}</p>
                                <details>
                                  <summary className="cursor-pointer text-blue-600 text-sm">View Details</summary>
                                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(issue, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Fixes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {fixResult.recommended_fixes.map((fix: any, index: number) => (
                            <div key={index} className="border border-blue-200 rounded p-3">
                              <h4 className="font-semibold mb-2">Fix: {fix.issue}</h4>
                              <p className="text-sm mb-2">{fix.fix}</p>
                              <details>
                                <summary className="cursor-pointer text-blue-600 text-sm">View Code Fix</summary>
                                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">{fix.code}</pre>
                              </details>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Alert className="border-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{fixResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
