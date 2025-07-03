"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Eye, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { EmailCampaign } from "@/lib/email-campaigns-fixed"

export default function EditCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = Number.parseInt(params.id as string)

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    from_name: "",
    from_email: "",
    html_content: "",
  })

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`[EDIT] Fetching campaign ${campaignId}`)

      const response = await fetch(`/api/campaigns/${campaignId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success && data.campaign) {
        setCampaign(data.campaign)
        setFormData({
          name: data.campaign.name,
          subject: data.campaign.subject,
          from_name: data.campaign.from_name,
          from_email: data.campaign.from_email,
          html_content: data.campaign.html_content,
        })
        console.log(`[EDIT] Campaign loaded: ${data.campaign.name}`)
      } else {
        throw new Error(data.error || "Failed to fetch campaign")
      }
    } catch (error) {
      console.error("[EDIT] Error fetching campaign:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch campaign")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!campaign) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      console.log(`[EDIT] Saving campaign ${campaignId}`)

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success) {
        setSuccess("Campaign updated successfully!")
        setCampaign(data.campaign)
        console.log(`[EDIT] Campaign ${campaignId} saved successfully`)
      } else {
        throw new Error(data.error || "Failed to update campaign")
      }
    } catch (error) {
      console.error("[EDIT] Error saving campaign:", error)
      setError(error instanceof Error ? error.message : "Failed to save campaign")
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      const previewContent = formData.html_content
        .replace(/\{\{name\}\}/g, "John Doe")
        .replace(/\{\{email\}\}/g, "john@example.com")
        .replace(/\{\{subject\}\}/g, formData.subject)

      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Preview</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .email-header { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="email-header">
            <strong>From:</strong> ${formData.from_name} &lt;${formData.from_email}&gt;<br>
            <strong>Subject:</strong> ${formData.subject}
          </div>
          ${previewContent}
        </body>
        </html>
      `)
      previewWindow.document.close()
    }
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
        <div className="text-center py-8">Loading campaign...</div>
      </div>
    )
  }

  if (error && !campaign) {
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
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
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
        </div>
        <Alert className="border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">Campaign not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (campaign.status !== "draft") {
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
        <Alert className="border-yellow-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-yellow-700">
            Only draft campaigns can be edited. This campaign has status: {campaign.status}
          </AlertDescription>
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
            <p className="text-gray-600">{campaign.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Edit your campaign information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter campaign name"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter email subject"
              />
            </div>

            <div>
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={formData.from_name}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                placeholder="Enter sender name"
              />
            </div>

            <div>
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                placeholder="Enter sender email"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Info</CardTitle>
            <CardDescription>Current campaign status and recipients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <p className="text-sm capitalize">{campaign.status}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Target Type</Label>
              <p className="text-sm capitalize">{campaign.target_type.replace("_", " ")}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Recipients</Label>
              <p className="text-sm">{campaign.total_recipients || 0} recipients</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Created</Label>
              <p className="text-sm">
                {new Date(campaign.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Content</CardTitle>
          <CardDescription>
            Edit your email HTML content. Use {`{{name}}`}, {`{{email}}`}, and {`{{subject}}`} for personalization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.html_content}
            onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
            placeholder="Enter your email HTML content here..."
            className="min-h-[300px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  )
}
