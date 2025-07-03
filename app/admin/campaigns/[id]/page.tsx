"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, Edit, Eye, Users, Mail, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: number
  name: string
  subject: string
  from_name: string
  from_email: string
  html_content: string
  status: "draft" | "scheduled" | "sending" | "sent" | "paused"
  target_type: "all" | "selected" | "filtered"
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

interface CampaignLog {
  id: number
  recipient_email: string
  recipient_name?: string
  status: "pending" | "sent" | "failed" | "bounced"
  sent_at?: string
  error_message?: string
  email_service?: string
}

interface CampaignStats {
  total: number
  sent: number
  failed: number
  pending: number
}

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = Number.parseInt(params.id as string)

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [logs, setLogs] = useState<CampaignLog[]>([])
  const [stats, setStats] = useState<CampaignStats>({ total: 0, sent: 0, failed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails()
      fetchCampaignLogs()
      fetchCampaignStats()
    }
  }, [campaignId])

  const fetchCampaignDetails = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`)
      const data = await response.json()

      if (data.success) {
        setCampaign(data.campaign)
      } else {
        setMessage({ type: "error", text: data.error || "Failed to fetch campaign" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch campaign details" })
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaignLogs = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}?action=logs`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error("Failed to fetch campaign logs:", error)
    }
  }

  const fetchCampaignStats = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}?action=stats`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch campaign stats:", error)
    }
  }

  const sendCampaign = async () => {
    if (!confirm("Are you sure you want to send this campaign? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: data.message })
        fetchCampaignDetails()
        fetchCampaignLogs()
        fetchCampaignStats()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send campaign" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send campaign" })
    }
  }

  const getStatusBadge = (status: Campaign["status"]) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      sending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      paused: "bg-red-100 text-red-800",
    }

    return <Badge className={colors[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const getLogStatusIcon = (status: CampaignLog["status"]) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const previewEmail = () => {
    if (!campaign) return

    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      const previewContent = campaign.html_content
        .replace(/\{\{name\}\}/g, "John Doe")
        .replace(/\{\{email\}\}/g, "john@example.com")
        .replace(/\{\{subject\}\}/g, campaign.subject)

      previewWindow.document.write(previewContent)
      previewWindow.document.close()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Campaign Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading campaign...</div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Not Found</h1>
        </div>
        <Alert className="border-red-500">
          <AlertDescription className="text-red-700">The requested campaign could not be found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-600">{campaign.subject}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {campaign.status === "draft" && (
            <>
              <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={sendCampaign}>
                <Send className="h-4 w-4 mr-2" />
                Send Campaign
              </Button>
            </>
          )}
          <Button variant="outline" onClick={previewEmail}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={`${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
          <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{getStatusBadge(campaign.status)}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.started_at && `Started: ${new Date(campaign.started_at).toLocaleString()}`}
              {campaign.completed_at && `Completed: ${new Date(campaign.completed_at).toLocaleString()}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Target: {campaign.target_type}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successfully Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">{stats.pending > 0 && `${stats.pending} pending`}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Email Content</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Name</Label>
                  <p className="text-sm text-gray-600">{campaign.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Subject Line</Label>
                  <p className="text-sm text-gray-600">{campaign.subject}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">From</Label>
                  <p className="text-sm text-gray-600">
                    {campaign.from_name} &lt;{campaign.from_email}&gt;
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Target Type</Label>
                  <Badge variant="outline">{campaign.target_type}</Badge>
                </div>

                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-gray-600">{new Date(campaign.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-gray-600">{new Date(campaign.updated_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Recipients</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Successfully Sent</span>
                    <span className="font-medium text-green-600">{stats.sent}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Failed</span>
                    <span className="font-medium text-red-600">{stats.failed}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-yellow-600">Pending</span>
                    <span className="font-medium text-yellow-600">{stats.pending}</span>
                  </div>

                  {stats.total > 0 && (
                    <div className="pt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(stats.sent / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {Math.round((stats.sent / stats.total) * 100)}% delivery rate
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>The HTML content that was sent to recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm space-y-2 mb-4">
                    <div>
                      <strong>From:</strong> {campaign.from_name} &lt;{campaign.from_email}&gt;
                    </div>
                    <div>
                      <strong>Subject:</strong> {campaign.subject}
                    </div>
                    <hr />
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: campaign.html_content
                        .replace(/\{\{name\}\}/g, "John Doe")
                        .replace(/\{\{email\}\}/g, "john@example.com")
                        .replace(/\{\{subject\}\}/g, campaign.subject),
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={previewEmail}>
                    <Eye className="h-4 w-4 mr-2" />
                    Open Full Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Logs</CardTitle>
              <CardDescription>Individual email delivery status for each recipient</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No delivery logs available yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getLogStatusIcon(log.status)}
                            <span className="capitalize">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.recipient_email}</TableCell>
                        <TableCell>{log.recipient_name || "-"}</TableCell>
                        <TableCell>{log.sent_at ? new Date(log.sent_at).toLocaleString() : "-"}</TableCell>
                        <TableCell>
                          {log.email_service ? <Badge variant="outline">{log.email_service}</Badge> : "-"}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.error_message ? (
                            <span className="text-red-600 text-sm truncate block" title={log.error_message}>
                              {log.error_message}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Label({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ""}`}
      {...props}
    >
      {children}
    </label>
  )
}
