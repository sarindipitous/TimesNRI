"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, Save, Eye, Users, Mail, Clock } from "lucide-react"
import Link from "next/link"

interface WaitlistSubmission {
  email: string
  name: string
  location?: string
  parent_location?: string
  created_at: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [waitlistData, setWaitlistData] = useState<WaitlistSubmission[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [previewMode, setPreviewMode] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    from_name: "Times NRI Team",
    from_email: "noreply@timesnri.com",
    html_content: "",
    target_type: "all" as "all" | "selected" | "filtered",
    target_criteria: {},
  })

  // Load waitlist data on component mount
  useEffect(() => {
    loadWaitlistData()
  }, [])

  const loadWaitlistData = async () => {
    try {
      const response = await fetch("/api/waitlist")
      if (response.ok) {
        const data = await response.json()
        setWaitlistData(data.submissions || [])
      }
    } catch (error) {
      console.error("Error loading waitlist data:", error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setError("")
  }

  const handleEmailSelection = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails((prev) => [...prev, email])
    } else {
      setSelectedEmails((prev) => prev.filter((e) => e !== email))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(waitlistData.map((item) => item.email))
    } else {
      setSelectedEmails([])
    }
  }

  const getRecipientCount = () => {
    if (formData.target_type === "all") {
      return waitlistData.length
    } else if (formData.target_type === "selected") {
      return selectedEmails.length
    }
    return 0
  }

  const getEstimatedTime = () => {
    const count = getRecipientCount()
    const seconds = count * 2.5 // 2.5 seconds per email for Resend compliance
    const minutes = Math.ceil(seconds / 60)
    return minutes
  }

  const validateForm = () => {
    if (!formData.name.trim()) return "Campaign name is required"
    if (!formData.subject.trim()) return "Subject line is required"
    if (!formData.html_content.trim()) return "Email content is required"
    if (formData.target_type === "selected" && selectedEmails.length === 0) {
      return "Please select at least one recipient"
    }
    return null
  }

  const saveCampaign = async (status: "draft" | "sending" = "draft") => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return null
    }

    setLoading(true)
    setError("")

    try {
      const campaignData = {
        ...formData,
        selected_recipients: formData.target_type === "selected" ? selectedEmails : [],
        status,
      }

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(status === "draft" ? "Campaign saved as draft!" : "Campaign created successfully!")
        return data.campaign
      } else {
        setError(data.error || "Failed to save campaign")
        return null
      }
    } catch (error) {
      console.error("Error saving campaign:", error)
      setError("Failed to save campaign")
      return null
    } finally {
      setLoading(false)
    }
  }

  const sendCampaign = async () => {
    const campaign = await saveCampaign("draft")
    if (!campaign) return

    setLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/send`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Campaign sent successfully! ${data.message}`)
        setTimeout(() => {
          router.push("/admin/campaigns")
        }, 2000)
      } else {
        setError(data.error || "Failed to send campaign")
      }
    } catch (error) {
      console.error("Error sending campaign:", error)
      setError("Failed to send campaign")
    } finally {
      setLoading(false)
    }
  }

  const renderEmailPreview = () => {
    let content = formData.html_content
    content = content.replace(/\{\{name\}\}/g, "John Doe")
    content = content.replace(/\{\{email\}\}/g, "john@example.com")
    content = content.replace(/\{\{subject\}\}/g, formData.subject)

    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="border-b pb-2 mb-4">
          <div className="text-sm text-gray-600">
            <strong>From:</strong> {formData.from_name} &lt;{formData.from_email}&gt;
          </div>
          <div className="text-sm text-gray-600">
            <strong>Subject:</strong> {formData.subject}
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    )
  }

  if (previewMode) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editor
            </Button>
            <h1 className="text-2xl font-bold">Email Preview</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Campaign Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Name</Label>
                  <p className="text-sm text-gray-600">{formData.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subject Line</Label>
                  <p className="text-sm text-gray-600">{formData.subject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">From</Label>
                  <p className="text-sm text-gray-600">
                    {formData.from_name} &lt;{formData.from_email}&gt;
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Recipients</Label>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {getRecipientCount()} recipients
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estimated Send Time</Label>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />~{getEstimatedTime()} minutes (Resend rate limit compliant)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Email Preview
                </CardTitle>
                <CardDescription>How your email will look to recipients</CardDescription>
              </CardHeader>
              <CardContent>{renderEmailPreview()}</CardContent>
            </Card>
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={() => saveCampaign("draft")} disabled={loading} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button onClick={sendCampaign} disabled={loading || getRecipientCount() === 0}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : `Send to ${getRecipientCount()} Recipients`}
            </Button>
          </div>

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/campaigns">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create New Campaign</h1>
            <p className="text-gray-600">Design and send email campaigns to your waitlist</p>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Basic information about your email campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Weekly Update - March 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="e.g., Important update from Times NRI"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      value={formData.from_name}
                      onChange={(e) => handleInputChange("from_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      value={formData.from_email}
                      onChange={(e) => handleInputChange("from_email", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>
                  Write your email content. You can use {`{{name}}`}, {`{{email}}`}, and {`{{subject}}`} as template
                  variables.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.html_content}
                  onChange={(e) => handleInputChange("html_content", e.target.value)}
                  placeholder="Enter your email content here..."
                  className="min-h-[300px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Recipients */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recipients ({waitlistData.length})</CardTitle>
                <CardDescription>Choose who will receive this campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Target Audience</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value: "all" | "selected") => handleInputChange("target_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subscribers ({waitlistData.length})</SelectItem>
                      <SelectItem value="selected">Selected Recipients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target_type === "selected" && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedEmails.length === waitlistData.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all" className="text-sm font-medium">
                        Select All ({waitlistData.length})
                      </Label>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-2">
                      {waitlistData.map((item) => (
                        <div key={item.email} className="flex items-center space-x-2">
                          <Checkbox
                            id={item.email}
                            checked={selectedEmails.includes(item.email)}
                            onCheckedChange={(checked) => handleEmailSelection(item.email, checked as boolean)}
                          />
                          <Label htmlFor={item.email} className="text-sm flex-1">
                            <div>{item.name || "No name"}</div>
                            <div className="text-xs text-gray-500">{item.email}</div>
                          </Label>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-gray-600">{selectedEmails.length} recipients selected</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Recipients:</span>
                      <span className="font-medium">{getRecipientCount()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Time:</span>
                      <span className="font-medium">~{getEstimatedTime()} min</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Rate limited to comply with Resend (2.5s per email)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button onClick={() => setPreviewMode(true)} variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Preview & Send
              </Button>

              <Button onClick={() => saveCampaign("draft")} disabled={loading} variant="outline" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
