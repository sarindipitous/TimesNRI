"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, Save, Eye, Users, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Recipient {
  email: string
  name: string
  location: string
  care_plan: string
  created_at: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [recipientsLoading, setRecipientsLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    from_name: "Times NRI Team",
    from_email: "noreply@timesnri.com",
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A8B9F; margin: 0; font-size: 28px;">Times NRI</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Dear {{name}},</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                We have an important update to share with you about Times NRI.
            </p>
            
            <!-- Add your campaign content here -->
            <p style="color: #666; line-height: 1.6;">
                [Your campaign message goes here]
            </p>
        </div>

        <p style="color: #666; line-height: 1.6;">
            Best regards,<br />
            <strong>The Times NRI Team</strong>
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
                © 2024 Times NRI. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`,
    target_type: "all" as "all" | "selected" | "filtered",
    target_criteria: {
      location: "",
      care_plan: "",
      date_from: "",
      date_to: "",
    },
  })

  useEffect(() => {
    fetchRecipients()
  }, [])

  const fetchRecipients = async () => {
    try {
      setRecipientsLoading(true)
      console.log("[NEW CAMPAIGN] Fetching recipients...")

      const response = await fetch("/api/campaigns?action=recipients")
      const data = await response.json()

      if (data.success) {
        setRecipients(data.recipients)
        console.log(`[NEW CAMPAIGN] Loaded ${data.recipients.length} recipients`)
      } else {
        console.error("Failed to fetch recipients:", data.error)
        setMessage({ type: "error", text: "Failed to load recipients" })
      }
    } catch (error) {
      console.error("Failed to fetch recipients:", error)
      setMessage({ type: "error", text: "Failed to load recipients" })
    } finally {
      setRecipientsLoading(false)
    }
  }

  const handleSubmit = async (action: "save" | "send") => {
    setLoading(true)
    setMessage(null)

    try {
      // Validate required fields
      if (!formData.name || !formData.subject || !formData.html_content) {
        setMessage({ type: "error", text: "Please fill in all required fields" })
        setLoading(false)
        return
      }

      // Validate selected recipients if target type is selected
      if (formData.target_type === "selected" && selectedRecipients.length === 0) {
        setMessage({ type: "error", text: "Please select at least one recipient" })
        setLoading(false)
        return
      }

      console.log("[NEW CAMPAIGN] Submitting campaign:", {
        name: formData.name,
        target_type: formData.target_type,
        selected_count: selectedRecipients.length,
        action,
      })

      // Create campaign
      const campaignData = {
        ...formData,
        selected_recipients: formData.target_type === "selected" ? selectedRecipients : undefined,
      }

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })

      const data = await response.json()

      if (data.success) {
        console.log("[NEW CAMPAIGN] Campaign created:", data.campaign.id)

        if (action === "send") {
          // Send the campaign immediately
          console.log("[NEW CAMPAIGN] Sending campaign immediately...")
          const sendResponse = await fetch(`/api/campaigns/${data.campaign.id}/send`, {
            method: "POST",
          })

          const sendData = await sendResponse.json()

          if (sendData.success) {
            setMessage({ type: "success", text: "Campaign created and sent successfully!" })
            setTimeout(() => router.push("/admin/campaigns"), 2000)
          } else {
            setMessage({ type: "error", text: `Campaign created but failed to send: ${sendData.error}` })
          }
        } else {
          setMessage({ type: "success", text: "Campaign saved as draft successfully!" })
          setTimeout(() => router.push("/admin/campaigns"), 2000)
        }
      } else {
        console.error("[NEW CAMPAIGN] Failed to create campaign:", data.error)
        setMessage({ type: "error", text: data.error || "Failed to create campaign" })
      }
    } catch (error) {
      console.error("[NEW CAMPAIGN] Error:", error)
      setMessage({ type: "error", text: "Failed to create campaign" })
    } finally {
      setLoading(false)
    }
  }

  const previewEmail = () => {
    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      const previewContent = formData.html_content
        .replace(/\{\{name\}\}/g, "John Doe")
        .replace(/\{\{email\}\}/g, "john@example.com")
        .replace(/\{\{subject\}\}/g, formData.subject)

      previewWindow.document.write(previewContent)
      previewWindow.document.close()
    }
  }

  const getFilteredRecipients = () => {
    if (formData.target_type === "all") {
      return recipients
    }

    if (formData.target_type === "selected") {
      return recipients.filter((r) => selectedRecipients.includes(r.email))
    }

    if (formData.target_type === "filtered") {
      return recipients.filter((recipient) => {
        const criteria = formData.target_criteria

        if (criteria.location && !recipient.location.toLowerCase().includes(criteria.location.toLowerCase())) {
          return false
        }

        if (criteria.care_plan && !recipient.care_plan.toLowerCase().includes(criteria.care_plan.toLowerCase())) {
          return false
        }

        if (criteria.date_from && new Date(recipient.created_at) < new Date(criteria.date_from)) {
          return false
        }

        if (criteria.date_to && new Date(recipient.created_at) > new Date(criteria.date_to)) {
          return false
        }

        return true
      })
    }

    return []
  }

  const filteredRecipients = getFilteredRecipients()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600">Design and send email campaigns to your waitlist</p>
        </div>
      </div>

      {message && (
        <Alert className={`${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Campaign Content</TabsTrigger>
          <TabsTrigger value="recipients">
            Recipients ({recipientsLoading ? "..." : filteredRecipients.length})
          </TabsTrigger>
          <TabsTrigger value="preview">Preview & Send</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Configure your campaign settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Product Launch Announcement"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Exciting News from Times NRI"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      value={formData.from_name}
                      onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={formData.from_email}
                      onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
                <CardDescription>Choose who will receive this campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Type</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value: "all" | "selected" | "filtered") =>
                      setFormData({ ...formData, target_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Waitlist Members</SelectItem>
                      <SelectItem value="selected">Selected Recipients</SelectItem>
                      <SelectItem value="filtered">Filtered Recipients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target_type === "filtered" && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-medium">Filter Criteria</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="filter_location">Location</Label>
                        <Input
                          id="filter_location"
                          value={formData.target_criteria.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              target_criteria: { ...formData.target_criteria, location: e.target.value },
                            })
                          }
                          placeholder="e.g., Mumbai"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="filter_care_plan">Care Plan</Label>
                        <Input
                          id="filter_care_plan"
                          value={formData.target_criteria.care_plan}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              target_criteria: { ...formData.target_criteria, care_plan: e.target.value },
                            })
                          }
                          placeholder="e.g., Peace"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="filter_date_from">Joined From</Label>
                        <Input
                          id="filter_date_from"
                          type="date"
                          value={formData.target_criteria.date_from}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              target_criteria: { ...formData.target_criteria, date_from: e.target.value },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="filter_date_to">Joined To</Label>
                        <Input
                          id="filter_date_to"
                          type="date"
                          value={formData.target_criteria.date_to}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              target_criteria: { ...formData.target_criteria, date_to: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  {recipientsLoading
                    ? "Loading recipients..."
                    : `${filteredRecipients.length} recipients will receive this campaign`}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Design your email using HTML. Use variables like {`{{name}}`} and {`{{email}}`} for personalization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.html_content}
                onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Enter your HTML email content here..."
              />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={previewEmail}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Recipients</CardTitle>
              <CardDescription>
                {formData.target_type === "all" && "All waitlist members will receive this campaign"}
                {formData.target_type === "selected" && "Select specific recipients for this campaign"}
                {formData.target_type === "filtered" && "Recipients matching your filter criteria"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recipientsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
                  <p>Loading recipients...</p>
                </div>
              ) : (
                <>
                  {formData.target_type === "selected" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Checkbox
                          checked={selectedRecipients.length === recipients.length && recipients.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecipients(recipients.map((r) => r.email))
                            } else {
                              setSelectedRecipients([])
                            }
                          }}
                        />
                        <Label>Select All ({recipients.length})</Label>
                      </div>

                      {recipients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No recipients found</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {recipients.map((recipient) => (
                            <div
                              key={recipient.email}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedRecipients.includes(recipient.email)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRecipients([...selectedRecipients, recipient.email])
                                    } else {
                                      setSelectedRecipients(
                                        selectedRecipients.filter((email) => email !== recipient.email),
                                      )
                                    }
                                  }}
                                />
                                <div>
                                  <div className="font-medium">{recipient.name || recipient.email}</div>
                                  <div className="text-sm text-gray-600">{recipient.email}</div>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-600">
                                {recipient.location && <div>{recipient.location}</div>}
                                {recipient.care_plan && <Badge variant="outline">{recipient.care_plan}</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.target_type === "all" && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recipients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No recipients found</p>
                        </div>
                      ) : (
                        recipients.map((recipient) => (
                          <div
                            key={recipient.email}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                              <div>
                                <div className="font-medium">{recipient.name || recipient.email}</div>
                                <div className="text-sm text-gray-600">{recipient.email}</div>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              {recipient.location && <div>{recipient.location}</div>}
                              {recipient.care_plan && <Badge variant="outline">{recipient.care_plan}</Badge>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {formData.target_type === "filtered" && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredRecipients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No recipients match your criteria</p>
                        </div>
                      ) : (
                        filteredRecipients.map((recipient) => (
                          <div
                            key={recipient.email}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <div>
                                <div className="font-medium">{recipient.name || recipient.email}</div>
                                <div className="text-sm text-gray-600">{recipient.email}</div>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              {recipient.location && <div>{recipient.location}</div>}
                              {recipient.care_plan && <Badge variant="outline">{recipient.care_plan}</Badge>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>
                        {formData.target_type === "selected"
                          ? `${selectedRecipients.length} of ${recipients.length} recipients selected`
                          : `${filteredRecipients.length} recipients will receive this campaign`}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Summary</CardTitle>
                <CardDescription>Review your campaign before sending</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Name</Label>
                  <p className="text-sm text-gray-600">{formData.name || "Untitled Campaign"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Subject Line</Label>
                  <p className="text-sm text-gray-600">{formData.subject || "No subject"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">From</Label>
                  <p className="text-sm text-gray-600">
                    {formData.from_name} &lt;{formData.from_email}&gt;
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Recipients</Label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {recipientsLoading ? "Loading..." : `${filteredRecipients.length} recipients`}
                    </span>
                    {getTargetTypeBadge(formData.target_type)}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button onClick={() => handleSubmit("save")} disabled={loading} variant="outline" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save as Draft"}
                  </Button>

                  <Button
                    onClick={() => handleSubmit("send")}
                    disabled={loading || filteredRecipients.length === 0 || recipientsLoading}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading
                      ? "Sending..."
                      : recipientsLoading
                        ? "Loading Recipients..."
                        : `Send to ${filteredRecipients.length} Recipients`}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>How your email will look to recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <div className="text-sm space-y-2 mb-4">
                    <div>
                      <strong>From:</strong> {formData.from_name} &lt;{formData.from_email}&gt;
                    </div>
                    <div>
                      <strong>Subject:</strong> {formData.subject}
                    </div>
                    <hr />
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formData.html_content
                        .replace(/\{\{name\}\}/g, "John Doe")
                        .replace(/\{\{email\}\}/g, "john@example.com")
                        .replace(/\{\{subject\}\}/g, formData.subject),
                    }}
                  />
                </div>
                <Button variant="outline" onClick={previewEmail} className="w-full mt-4 bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  Open Full Preview
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getTargetTypeBadge(targetType: "all" | "selected" | "filtered") {
  const labels = {
    all: "All Waitlist",
    selected: "Selected Recipients",
    filtered: "Filtered Recipients",
  }

  return <Badge variant="outline">{labels[targetType]}</Badge>
}
