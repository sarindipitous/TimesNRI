"use client"

import type React from "react"
import { email } from "some-module" // Declare or import the email variable here

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { updateEmailConfiguration, sendTestWelcomeEmail } from "@/app/actions/waitlist"
import type { EmailConfig } from "@/lib/email-config"

const DEFAULT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Times NRI</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e74c3c; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #e74c3c; margin-bottom: 10px; }
        .tagline { color: #666; font-size: 16px; }
        .content { padding: 20px 0; }
        .welcome-text { font-size: 18px; margin-bottom: 20px; }
        .highlight { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .referral-section { background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
        .referral-link { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; margin-top: 30px; color: #666; font-size: 14px; }
        .social-links { margin: 15px 0; }
        .social-links a { margin: 0 10px; color: #e74c3c; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Times NRI</div>
            <div class="tagline">Caring for Your Parents, No Matter the Distance</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                <strong>Welcome {{name}}!</strong>
            </div>
            
            <p>Thank you for joining our waitlist. We're excited to help you provide the best care for your parents back home.</p>
            
            <div class="highlight">
                <strong>Your Waitlist Details:</strong><br>
                📧 Email: {{email}}<br>
                📍 Parent Location: {{parent_location}}<br>
                📋 Care Plan Interest: {{care_plan}}<br>
                🎯 Waitlist Position: #{{waitlist_number}}
            </div>
            
            <p>We're working hard to launch our services and will keep you updated on our progress. In the meantime, here's what you can expect:</p>
            
            <ul>
                <li>✅ Regular updates on our launch timeline</li>
                <li>✅ Early access to our platform when we go live</li>
                <li>✅ Special pricing for waitlist members</li>
                <li>✅ Priority support and onboarding</li>
            </ul>
            
            <div class="referral-section">
                <h3>🎁 Earn Rewards by Referring Friends</h3>
                <p>Know other NRIs who need care services for their parents? Share your referral link and earn rewards!</p>
                <a href="{{referral_link}}" class="referral-link">Share Your Referral Link</a>
                <p><small>Your unique referral link: <br><code>{{referral_link}}</code></small></p>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to us.</p>
            
            <p>Best regards,<br>
            <strong>The Times NRI Team</strong></p>
        </div>
        
        <div class="footer">
            <div class="social-links">
                <a href="#">Facebook</a> |
                <a href="#">Twitter</a> |
                <a href="#">LinkedIn</a> |
                <a href="#">Instagram</a>
            </div>
            <p>&copy; 2024 Times NRI. All rights reserved.</p>
            <p>You're receiving this email because you joined our waitlist.</p>
        </div>
    </div>
</body>
</html>`

export default function EmailConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("code")

  useEffect(() => {
    fetchEmailConfig()
  }, [])

  const fetchEmailConfig = async () => {
    try {
      const response = await fetch("/api/email-config")
      const data = await response.json()

      if (data.success) {
        const configMap: Record<string, string> = {}
        data.config.forEach((item: EmailConfig) => {
          configMap[item.config_key] = item.config_value
        })

        // Set default template if none exists
        if (!configMap.welcome_email_template) {
          configMap.welcome_email_template = DEFAULT_EMAIL_TEMPLATE
        }

        setConfig(configMap)
      }
    } catch (error) {
      console.error("Failed to fetch email config:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const formData = new FormData()
      Object.entries(config).forEach(([key, value]) => {
        formData.append(key, value)
      })

      const result = await updateEmailConfiguration(formData)

      if (result.success) {
        setMessage({ type: "success", text: result.message })
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save configuration" })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) return

    setSendingTest(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("testEmail", testEmail)

      const result = await sendTestWelcomeEmail(formData)

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        setTestEmail("")
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send test email" })
    } finally {
      setSendingTest(false)
    }
  }

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const insertVariable = (variable: string) => {
    const template = config.welcome_email_template || ""
    const textarea = document.getElementById("email-template") as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newTemplate = template.substring(0, start) + `{{${variable}}}` + template.substring(end)
      updateConfig("welcome_email_template", newTemplate)

      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
  }

  const getPreviewHtml = () => {
    let html = config.welcome_email_template || ""
    // Replace variables with sample data for preview
    html = html.replace(/\{\{name\}\}/g, "John Doe")
    html = html.replace(/\{\{email\}\}/g, "john.doe@example.com")
    html = html.replace(/\{\{parent_location\}\}/g, "Mumbai, India")
    html = html.replace(/\{\{care_plan\}\}/g, "Peace Plan - $50/month")
    html = html.replace(/\{\{waitlist_number\}\}/g, "42")
    html = html.replace(/\{\{referral_link\}\}/g, "https://timesnri.com?ref=john.doe@example.com")
    return html
  }

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Email Configuration</h1>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Email Settings</TabsTrigger>
          <TabsTrigger value="template">HTML Template</TabsTrigger>
          <TabsTrigger value="share">Share HTML</TabsTrigger>
          <TabsTrigger value="test">Test Email</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Email Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="welcome_email_enabled"
                    checked={config.welcome_email_enabled === "true"}
                    onCheckedChange={(checked) => updateConfig("welcome_email_enabled", checked.toString())}
                  />
                  <Label htmlFor="welcome_email_enabled">Enable Welcome Emails</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={config.welcome_email_from_name || ""}
                    onChange={(e) => updateConfig("welcome_email_from_name", e.target.value)}
                    placeholder="Times NRI Team"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={config.welcome_email_from_email || ""}
                    onChange={(e) => updateConfig("welcome_email_from_email", e.target.value)}
                    placeholder="welcome@timesnri.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={config.welcome_email_subject || ""}
                    onChange={(e) => updateConfig("welcome_email_subject", e.target.value)}
                    placeholder="Welcome to Times NRI - You're on the waitlist!"
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">📝 Available Variables Reference</CardTitle>
              <p className="text-sm text-gray-600">Click any variable to copy it to your clipboard</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    variable: "name",
                    description: "User's name (e.g., 'John Doe')",
                    example: "Hello {{name}}!",
                  },
                  {
                    variable: "email",
                    description: "User's email address",
                    example: "Your email: {{email}}",
                  },
                  {
                    variable: "parent_location",
                    description: "Where parents are located",
                    example: "Parents in: {{parent_location}}",
                  },
                  {
                    variable: "care_plan",
                    description: "Selected care plan",
                    example: "Plan: {{care_plan}}",
                  },
                  {
                    variable: "waitlist_number",
                    description: "Position in waitlist",
                    example: "Position #{{waitlist_number}}",
                  },
                  {
                    variable: "referral_link",
                    description: "Personal referral URL",
                    example: '<a href="{{referral_link}}">Refer Friends</a>',
                  },
                ].map((item) => (
                  <div
                    key={item.variable}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${item.variable}}}`)
                      setMessage({ type: "success", text: `Copied {{${item.variable}}} to clipboard!` })
                      setTimeout(() => setMessage(null), 2000)
                    }}
                  >
                    <div className="font-mono text-sm font-bold text-blue-600 mb-1">{`{{${item.variable}}}`}</div>
                    <div className="text-xs text-gray-600 mb-2">{item.description}</div>
                    <div className="text-xs bg-gray-100 p-2 rounded font-mono">{item.example}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Usage Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Variables are case-sensitive and must be wrapped in double curly braces</li>
                  <li>• Click any variable above to copy it to your clipboard</li>
                  <li>• Use variables in both HTML content and attributes (like href, alt text)</li>
                  <li>• Variables will be replaced with actual user data when emails are sent</li>
                  <li>• If a variable has no data, it will show as empty or a default value</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    HTML Email Template
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={previewMode === "code" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("code")}
                      >
                        Code
                      </Button>
                      <Button
                        type="button"
                        variant={previewMode === "preview" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("preview")}
                      >
                        Preview
                      </Button>
                    </div>
                  </CardTitle>
                  <div className="text-sm text-gray-600">
                    <p>Create your HTML email template using the variables reference above</p>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewMode === "code" ? (
                    <div className="space-y-4">
                      <Textarea
                        id="email-template"
                        value={config.welcome_email_template || ""}
                        onChange={(e) => updateConfig("welcome_email_template", e.target.value)}
                        rows={30}
                        className="font-mono text-sm"
                        placeholder="Enter your HTML email template here..."
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? "Saving..." : "Save Template"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => updateConfig("welcome_email_template", DEFAULT_EMAIL_TEMPLATE)}
                        >
                          Reset to Default
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="bg-white rounded border" dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">🔍 Live Preview</CardTitle>
                  <p className="text-sm text-gray-600">Preview with sample data</p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-2 bg-gray-50 max-h-[500px] overflow-y-auto">
                    <div
                      className="bg-white rounded border text-xs"
                      style={{ transform: "scale(0.8)", transformOrigin: "top left", width: "125%" }}
                      dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                    />
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <p>
                      <strong>Sample Data Used:</strong>
                    </p>
                    <ul className="mt-1 space-y-1">
                      <li>Name: John Doe</li>
                      <li>Email: john.doe@example.com</li>
                      <li>Location: Mumbai, India</li>
                      <li>Plan: Peace Plan - $50/month</li>
                      <li>Position: #42</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="share">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📤 Share HTML Code</CardTitle>
                <p className="text-sm text-gray-600">
                  Copy the complete HTML code to share with others or use in external email systems
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(config.welcome_email_template || "")
                        setMessage({ type: "success", text: "HTML code copied to clipboard!" })
                        setTimeout(() => setMessage(null), 3000)
                      }}
                      disabled={!config.welcome_email_template}
                    >
                      📋 Copy HTML Code
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const htmlWithSampleData = getPreviewHtml()
                        navigator.clipboard.writeText(htmlWithSampleData)
                        setMessage({ type: "success", text: "HTML with sample data copied to clipboard!" })
                        setTimeout(() => setMessage(null), 3000)
                      }}
                      disabled={!config.welcome_email_template}
                    >
                      📋 Copy with Sample Data
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Raw HTML Template Code</Label>
                    <Textarea
                      value={config.welcome_email_template || ""}
                      readOnly
                      rows={20}
                      className="font-mono text-xs bg-gray-50"
                      placeholder="No template configured yet..."
                    />
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Sharing Options:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • <strong>Copy HTML Code:</strong> Raw template with variables ({{ name }}, {{ email }}, etc.)
                      </li>
                      <li>
                        • <strong>Copy with Sample Data:</strong> HTML with variables replaced by sample data
                      </li>
                      <li>
                        • <strong>Use in other systems:</strong> Import into MailChimp, Constant Contact, etc.
                      </li>
                      <li>
                        • <strong>Share with team:</strong> Send to developers or designers for review
                      </li>
                      <li>
                        • <strong>Backup template:</strong> Save a copy for version control
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔗 Shareable Links</CardTitle>
                <p className="text-sm text-gray-600">Generate links to share your email template</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Preview URL (with sample data)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/api/email-preview`}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/api/email-preview`)
                          setMessage({ type: "success", text: "Preview URL copied to clipboard!" })
                          setTimeout(() => setMessage(null), 3000)
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Download HTML File</Label>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const htmlContent = config.welcome_email_template || ""
                        const blob = new Blob([htmlContent], { type: "text/html" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = "welcome-email-template.html"
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                        setMessage({ type: "success", text: "HTML file downloaded!" })
                        setTimeout(() => setMessage(null), 3000)
                      }}
                      disabled={!config.welcome_email_template}
                      className="w-full"
                    >
                      💾 Download HTML File
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Client Testing</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const subject = encodeURIComponent(config.welcome_email_subject || "Welcome Email Template")
                          const body = encodeURIComponent(getPreviewHtml())
                          window.open(`mailto:?subject=${subject}&body=${body}`)
                        }}
                        disabled={!config.welcome_email_template}
                      >
                        📧 Open in Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const htmlContent = getPreviewHtml()
                          const newWindow = window.open("", "_blank")
                          if (newWindow) {
                            newWindow.document.write(htmlContent)
                            newWindow.document.close()
                          }
                        }}
                        disabled={!config.welcome_email_template}
                      >
                        🌐 Open in Browser
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Testing Checklist:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Test in Gmail, Outlook, Apple Mail</li>
                      <li>• Check mobile responsiveness</li>
                      <li>• Verify all links work correctly</li>
                      <li>• Test with different screen sizes</li>
                      <li>• Validate HTML markup</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Welcome Email</CardTitle>
              <p className="text-sm text-gray-600">Send a test welcome email to verify your configuration</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test_email">Test Email Address</Label>
                  <Input
                    id="test_email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <Button onClick={handleTestEmail} disabled={!testEmail || sendingTest}>
                  {sendingTest ? "Sending..." : "Send Test Email"}
                </Button>

                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <h4 className="font-semibold text-blue-900 mb-2">Test Email Will Include:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Name: "Test User"</li>
                    <li>• Email: {testEmail || "your-test-email"}</li>
                    <li>• Parent Location: "Mumbai, India"</li>
                    <li>• Care Plan: "Peace Plan - $50/month"</li>
                    <li>• Waitlist Number: #999</li>
                    <li>• Referral Link: Your site URL with ref parameter</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
