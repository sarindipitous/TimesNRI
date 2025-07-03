"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Send, Edit, Trash2, Eye, Users, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { EmailCampaign } from "@/lib/email-campaigns"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/campaigns")
      const data = await response.json()

      if (data.success) {
        setCampaigns(data.campaigns)
      } else {
        setError(data.error || "Failed to fetch campaigns")
      }
    } catch (error) {
      setError("Failed to fetch campaigns")
      console.error("Error fetching campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async (campaignId: number) => {
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
        fetchCampaigns() // Refresh the list
      } else {
        alert(`Failed to send campaign: ${data.error}`)
      }
    } catch (error) {
      alert("Failed to send campaign")
      console.error("Error sending campaign:", error)
    }
  }

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        alert("Campaign deleted successfully!")
        fetchCampaigns() // Refresh the list
      } else {
        alert(`Failed to delete campaign: ${data.error}`)
      }
    } catch (error) {
      alert("Failed to delete campaign")
      console.error("Error deleting campaign:", error)
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
        </div>
        <div className="text-center py-8">Loading campaigns...</div>
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

      {error && (
        <Alert className="border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Send className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">No campaigns yet</h3>
                <p className="text-gray-600">Get started by creating your first email campaign</p>
              </div>
              <Link href="/admin/campaigns/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>Manage your email campaigns and track their performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-gray-600">{campaign.subject}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{campaign.total_recipients || 0}</span>
                        {campaign.sent_count > 0 && (
                          <span className="text-sm text-gray-600">({campaign.sent_count} sent)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatDate(campaign.created_at.toString())}</span>
                      </div>
                    </TableCell>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="text-red-600 hover:text-red-700"
                            >
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
