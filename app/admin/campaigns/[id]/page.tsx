"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, Edit, Eye, Users, Mail, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import type { EmailCampaign, CampaignLog } from "@/lib/email-campaigns"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = Number.parseInt(params.id as string)

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  const [logs, setLogs] = useState<CampaignLog[]>([])
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setError(data.error || "Failed to fetch campaign")
      }
    } catch (error) {
      setError("Failed to fetch campaign")
      console.error("Error fetching campaign:", error)
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
      console.error("Error fetching campaign logs:", error)
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
      console.error("Error fetching campaign stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!confirm("Are you sure you want to send this campaign? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        alert("Campaign sent successfully!")
        fetchCampaignDetails()
        fetchCampaignStats()
      } else {
        alert(`Failed to send campaign: ${data.error}`)
      }
    } catch (error) {
      alert("Failed to send campaign")
      console.error("Error sending campaign:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
      sending: { label: "Sending", className: "bg-yellow-100 text-yellow-800" },
      sent: { label: "Sent", className: "bg-green-100 text-green-800" },
      paused: { label: "Paused", className: "bg-orange-100 text-orange-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
        <div className="text-center py-8">Loading campaign details...</div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
        <Alert className="border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error || "Campaign not found"}</AlertDescription>
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
          {getStatusBadge(campaign.status)}
          {campaign.status === "draft" && (
            <div className="flex gap-2">
              <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={handleSendCampaign} size="sm">
                <Send className="h-4 w-4 mr-2" />
                Send Campaign
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Campaign Details</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="preview">Email Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Campaign Name</label>
                  <p className="text-sm">{campaign.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subject Line</label>
                  <p className="text-sm">{campaign.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">From</label>
                  <p className="text-sm">
                    {campaign.from_name} &lt;{campaign.from_email}&gt;
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target Type</label>
                  <p className="text-sm capitalize">{campaign.target_type.replace("_", " ")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">{formatDate(campaign.created_at.toString())}</p>
                </div>
                {campaign.started_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Started</label>
                    <p className="text-sm">{formatDate(campaign.started_at.toString())}</p>
                  </div>
                )}
                {campaign.completed_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completed</label>
                    <p className="text-sm">{formatDate(campaign.completed_at.toString())}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">
                      {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: stats.total > 0 ? `${(stats.sent / stats.total) * 100}%` : "0%",
                      }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{stats.sent}</div>
                      <div className="text-xs text-gray-500">Delivered</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{stats.failed}</div>
                      <div className="text-xs text-gray-500">Failed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                      <div className="text-xs text-gray-500">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Logs</CardTitle>
              <CardDescription>Individual email delivery status for each recipient</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No delivery logs yet</p>
                  <p className="text-sm">Logs will appear here after the campaign is sent</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.recipient_name || log.recipient_email}</div>
                            {log.recipient_name && <div className="text-sm text-gray-600">{log.recipient_email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getLogStatusIcon(log.status)}
                            <span className="capitalize">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.email_service || "N/A"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.sent_at ? formatDate(log.sent_at.toString()) : "N/A"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-red-600">{log.error_message || "N/A"}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>How the email will appear to recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
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
              <Button
                variant="outline"
                onClick={() => {
                  const previewWindow = window.open("", "_blank")
                  if (previewWindow) {
                    const previewContent = campaign.html_content
                      .replace(/\{\{name\}\}/g, "John Doe")
                      .replace(/\{\{email\}\}/g, "john@example.com")
                      .replace(/\{\{subject\}\}/g, campaign.subject)

                    previewWindow.document.write(previewContent)
                    previewWindow.document.close()
                  }
                }}
                className="w-full mt-4"
              >
                <Eye className="h-4 w-4 mr-2" />
                Open Full Preview
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
