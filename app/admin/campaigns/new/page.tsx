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
import { ArrowLeft, Send, Save, Users } from "lucide-react"
import Link from "next/link"

interface Recipient {
  email: string
  name?: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form data
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [fromName, setFromName] = useState("Times NRI Team")
  const [fromEmail, setFromEmail] = useState("noreply@timesnri.com")
  const [htmlContent, setHtmlContent] = useState("")
  const [targetType, setTargetType] = useState<"all" | "selected">("all")

  // Recipients data
  const [allRecipients, setAllRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)

  // Load recipients on mount
  useEffect(() => {
    loadRecipients()
  }, [])

  const loadRecipients = async () => {
    setLoadingRecipients(true)
    try {
      const response = await fetch("/api/waitlist")
      const data = await response.json()

      if (data.success) {
        setAllRecipients(data.submissions || [])
      } else {
        console.error("Failed to load recipients:", data.error)
      }
    } catch (error) {
      console.error("Error loading recipients:", error)
    } finally {
      setLoadingRecipients(false)
    }
  }

  const handleRecipientToggle = (email: string) => {
    setSelectedRecipients((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]))
  }

  const handleSelectAll = () => {
    if (selectedRecipients.length === allRecipients.length) {
      setSelectedRecipients([])
    } else {
      setSelectedRecipients(allRecipients.map((r) => r.email))
    }
  }

  const getRecipientCount = () => {
    if (targetType === "all") {
      return allRecipients.length
    }
    return selectedRecipients.length
  }

  const validateForm = () => {
    if (!name.trim()) return "Campaign name is required"
    if (!subject.trim()) return "Subject line is required"
    if (!htmlContent.trim()) return "Email content is required"
    if (targetType === "selected" && selectedRecipients.length === 0) {
      return "Please select at least one recipient"
    }
    return null
  }

  const handleSaveDraft = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const campaignData = {
        name,
        subject,
        from_name: fromName,
        from_email: fromEmail,
        html_content: htmlContent,
        target_type: targetType,
        selected_recipients: targetType === "selected" ? selectedRecipients : [],
      }

      console.log("Creating campaign:", campaignData)

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Campaign saved as draft successfully!")
        setTimeout(() => {
          router.push("/admin/campaigns")
        }, 1500)
      } else {
        setError(data.error || "Failed to save campaign")
      }
    } catch (error) {
      console.error("Error saving campaign:", error)
      setError("Failed to save campaign. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendNow = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!confirm(`Are you sure you want to send this campaign to ${getRecipientCount()} recipients?`)) {
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // First create the campaign
      const campaignData = {
        name,
        subject,
        from_name: fromName,
        from_email: fromEmail,
        html_content: htmlContent,
        target_type: targetType,
        selected_recipients: targetType === "selected" ? selectedRecipients : [],
      }

      const createResponse = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })

      const createData = await createResponse.json()

      if (!createData.success) {
        setError(createData.error || "Failed to create campaign")
        return
      }

      // Then send it
      const sendResponse = await fetch(`/api/campaigns/${createData.campaign.id}/send`, {
        method: "POST",
      })

      const sendData = await sendResponse.json()

      if (sendData.success) {
        setSuccess(`Campaign sent successfully! ${sendData.message}`)
        setTimeout(() => {
          router.push("/admin/campaigns")
        }, 2000)
      } else {
        setError(sendData.error || "Failed to send campaign")
      }
    } catch (error) {
      console.error("Error sending campaign:", error)
      setError("Failed to send campaign. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Link href="/admin/campaigns" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create New Campaign</h1>
          <p className="text-gray-600 mt-2">Design and send email campaigns to your waitlist</p>
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
                <CardDescription>Basic information about your campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Weekly Update - July 2025"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., A quick update from TimesNRI 💙"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input id="fromName" value={fromName} onChange={(e) => setFromName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input id="fromEmail" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>
                  Write your email content. You can use {"{{name}}"} for personalization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Enter your email content here..."
                  className="min-h-[300px]"
                />
              </CardContent>
            </Card>

            {/* Recipients Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Recipients ({getRecipientCount()})
                </CardTitle>
                <CardDescription>Choose who will receive this campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={targetType} onValueChange={(value: "all" | "selected") => setTargetType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Waitlist Members ({allRecipients.length})</SelectItem>
                    <SelectItem value="selected">Selected Recipients</SelectItem>
                  </SelectContent>
                </Select>

                {targetType === "selected" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Recipients</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={loadingRecipients}
                      >
                        {selectedRecipients.length === allRecipients.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>

                    {loadingRecipients ? (
                      <div className="text-center py-4">Loading recipients...</div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                        {allRecipients.map((recipient) => (
                          <div key={recipient.email} className="flex items-center space-x-2">
                            <Checkbox
                              id={recipient.email}
                              checked={selectedRecipients.includes(recipient.email)}
                              onCheckedChange={() => handleRecipientToggle(recipient.email)}
                            />
                            <Label htmlFor={recipient.email} className="text-sm">
                              {recipient.name ? `${recipient.name} (${recipient.email})` : recipient.email}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>How your email will look to recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 bg-gray-50 min-h-[200px]">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>From:</strong> {fromName} &lt;{fromEmail}&gt;
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Subject:</strong> {subject || "Subject line will appear here"}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    {htmlContent ? (
                      <div dangerouslySetInnerHTML={{ __html: htmlContent.replace(/\{\{name\}\}/g, "John Doe") }} />
                    ) : (
                      <p className="text-gray-400 italic">Email content will appear here...</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Save as draft or send immediately</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save as Draft"}
                </Button>

                <Button onClick={handleSendNow} disabled={loading || getRecipientCount() === 0} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Sending..." : `Send to ${getRecipientCount()} Recipients`}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  Emails will be sent one by one with proper rate limiting
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
