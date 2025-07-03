"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Send, Edit, Trash2, Eye, Users, Mail, TrendingUp } from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: number
  name: string
  subject: string
  status: "draft" | "scheduled" | "sending" | "sent" | "paused"
  target_type: "all" | "selected" | "filtered"
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
  updated_at: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns")
      const data = await response.json()

      if (data.success) {
        setCampaigns(data.campaigns)
      } else {
        setMessage({ type: "error", text: data.error || "Failed to fetch campaigns" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch campaigns" })
    } finally {
      setLoading(false)
    }
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Campaign deleted successfully" })
        fetchCampaigns()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete campaign" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete campaign" })
    }
  }

  const sendCampaign = async (id: number) => {
    if (!confirm("Are you sure you want to send this campaign? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/campaigns/${id}/send`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: data.message })
        fetchCampaigns()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send campaign" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send campaign" })
    }
  }

  const getStatusBadge = (status: Campaign["status"]) => {
    const variants = {
      draft: "secondary",
      scheduled: "outline",
      sending: "default",
      sent: "default",
      paused: "destructive",
    } as const

    const colors = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      sending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      paused: "bg-red-100 text-red-800",
    }

    return <Badge className={colors[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const getTargetTypeBadge = (targetType: Campaign["target_type"]) => {
    const labels = {
      all: "All Waitlist",
      selected: "Selected Recipients",
      filtered: "Filtered Recipients",
    }

    return <Badge variant="outline">{labels[targetType]}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading campaigns...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-gray-600">Create and manage email campaigns for your waitlist</p>
        </div>
        <Link href="/admin/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
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
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Campaigns</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter((c) => c.status === "draft").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter((c) => c.status === "sent").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + c.sent_count, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>Manage your email campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first email campaign</p>
              <Link href="/admin/campaigns/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent/Failed</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>{getTargetTypeBadge(campaign.target_type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        {campaign.total_recipients}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-green-600">{campaign.sent_count} sent</div>
                        {campaign.failed_count > 0 && (
                          <div className="text-red-600">{campaign.failed_count} failed</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/campaigns/${campaign.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {campaign.status === "draft" && (
                          <>
                            <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>

                            <Button variant="ghost" size="sm" onClick={() => sendCampaign(campaign.id)}>
                              <Send className="h-4 w-4" />
                            </Button>

                            <Button variant="ghost" size="sm" onClick={() => deleteCampaign(campaign.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
