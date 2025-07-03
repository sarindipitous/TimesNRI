"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Mail, Settings, TestTube, Activity, Star } from "lucide-react"

interface EmailConfig {
  welcome_email_enabled: string
  welcome_email_subject: string
  welcome_email_from_name: string
  welcome_email_from_email: string
  welcome_email_template: string
}

interface DiagnosticsResult {
  success: boolean
  summary: string
  details: {
    environmentVariables: Record<string, boolean>
    emailConfiguration: Record<string, boolean>
    emailServices: Record<string, { connected: boolean; details?: string }>
    troubleshooting: string[]
  }
}

export default function EmailConfigurationPage() {
  const [config, setConfig] = useState<EmailConfig>({
    welcome_email_enabled: "true",
    welcome_email_subject: "",
    welcome_email_from_name: "",
    welcome_email_from_email: "",
    welcome_email_template: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [testEmail, setTestEmail] = useState("")
  const [testLoading, setTestLoading] = useState(false)
  const [resendTestEmail, setResendTestEmail] = useState("")
  const [resendTestLoading, setResendTestLoading] = useState(false)
  const [directTestEmail, setDirectTestEmail] = useState("")
  const [directTestLoading, setDirectTestLoading] = useState(false)
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/email-config")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error("Failed to fetch config:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Email configuration saved successfully!" })
      } else {
        throw new Error("Failed to save configuration")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save configuration" })
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) return

    setTestLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: "success", text: `Test email sent successfully to ${testEmail}!` })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to send test email" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send test email" })
    } finally {
      setTestLoading(false)
    }
  }

  const sendResendTest = async () => {
    if (!resendTestEmail) return

    setResendTestLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/test-resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: resendTestEmail }),
      })

      const result = await response.json()
      if (result.success) {
        setMessage({
          type: "success",
          text: `Resend test sent successfully to ${resendTestEmail}! Email ID: ${result.details?.emailId || "N/A"}`,
        })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to send Resend test" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send Resend test" })
    } finally {
      setResendTestLoading(false)
    }
  }

  const sendDirectSendGridTest = async () => {
    if (!directTestEmail) return

    setDirectTestLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/test-sendgrid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: directTestEmail }),
      })

      const result = await response.json()
      if (result.success) {
        setMessage({
          type: "success",
          text: `Direct SendGrid test sent successfully to ${directTestEmail}! Message ID: ${result.details?.messageId || "N/A"}`,
        })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to send direct SendGrid test" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send direct SendGrid test" })
    } finally {
      setDirectTestLoading(false)
    }
  }

  const runDiagnostics = async () => {
    setDiagnosticsLoading(true)
    try {
      const response = await fetch("/api/email-diagnostics", {
        method: "POST",
      })
      const result = await response.json()
      setDiagnostics(result)
    } catch (error) {
      console.error("Failed to run diagnostics:", error)
    } finally {
      setDiagnosticsLoading(false)
    }
  }

  const previewEmail = async () => {
    try {
      const response = await fetch("/api/email-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: config.welcome_email_template,
          data: {
            name: "Test User",
            email: "test@example.com",
            parent_location: "Mumbai, India",
            care_plan: "Peace Plan - $50/month",
            waitlist_number: 999,
            referral_link: "Your site URL with ref parameter",
          },
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        window.open(url, "_blank")
      }
    } catch (error) {
      console.error("Failed to preview email:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Email Configuration</h1>
      </div>

      {/* Resend Recommendation Banner */}
      <Alert className="mb-6 border-blue-500 bg-blue-50">
        <Star className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Recommended:</strong> Switch to Resend for better reliability and easier setup. Add your{" "}
          <code>RESEND_API_KEY</code> environment variable to get started.
        </AlertDescription>
      </Alert>

      {message && (
        <Alert className={`mb-6 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
          <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Email Settings
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            HTML Template
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Email
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Diagnostics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure your welcome email settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={config.welcome_email_enabled === "true"}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, welcome_email_enabled: checked ? "true" : "false" })
                  }
                />
                <Label htmlFor="enabled">Enable Welcome Emails</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={config.welcome_email_subject}
                  onChange={(e) => setConfig({ ...config, welcome_email_subject: e.target.value })}
                  placeholder="Welcome to Times NRI!"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={config.welcome_email_from_name}
                    onChange={(e) => setConfig({ ...config, welcome_email_from_name: e.target.value })}
                    placeholder="Times NRI Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={config.welcome_email_from_email}
                    onChange={(e) => setConfig({ ...config, welcome_email_from_email: e.target.value })}
                    placeholder="noreply@timesnri.com"
                  />
                  <p className="text-xs text-green-600">
                    ✅ Your domain timesnri.com is verified! Use any email@timesnri.com address
                  </p>
                </div>
              </div>

              <Button onClick={saveConfig} disabled={saving}>
                {saving ? "Saving..." : "Save Configuration"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>HTML Template</CardTitle>
              <CardDescription>
                Customize your welcome email template. Use variables like {`{{name}}`}, {`{{email}}`},{" "}
                {`{{parent_location}}`}, {`{{care_plan}}`}, {`{{waitlist_number}}`}, {`{{referral_link}}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={config.welcome_email_template}
                onChange={(e) => setConfig({ ...config, welcome_email_template: e.target.value })}
                placeholder="Enter your HTML email template here..."
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? "Saving..." : "Save Template"}
                </Button>
                <Button variant="outline" onClick={previewEmail}>
                  Preview Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  Resend Test (Recommended)
                </CardTitle>
                <CardDescription>Test the recommended Resend service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resend-test-email">Test Email Address</Label>
                  <Input
                    id="resend-test-email"
                    type="email"
                    value={resendTestEmail}
                    onChange={(e) => setResendTestEmail(e.target.value)}
                    placeholder="your-email@example.com"
                  />
                </div>
                <Button onClick={sendResendTest} disabled={resendTestLoading || !resendTestEmail} className="w-full">
                  {resendTestLoading ? "Sending..." : "Send Resend Test"}
                </Button>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">✅ Resend Benefits:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>3,000 emails/month free</li>
                    <li>No domain setup required initially</li>
                    <li>Better deliverability</li>
                    <li>Cleaner API and error messages</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Welcome Email (Full System)</CardTitle>
                <CardDescription>Send a test using your complete email configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your-email@example.com"
                  />
                </div>
                <Button onClick={sendTestEmail} disabled={testLoading || !testEmail} className="w-full">
                  {testLoading ? "Sending..." : "Send Test Email"}
                </Button>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Test Email Will Include:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Name: "Test User"</li>
                    <li>Email: your-test-email</li>
                    <li>Parent Location: "Mumbai, India"</li>
                    <li>Care Plan: "Peace Plan - $50/month"</li>
                    <li>Waitlist Number: #999</li>
                    <li>Your configured HTML template</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Direct SendGrid Test</CardTitle>
                <CardDescription>Test SendGrid directly (fallback option)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="direct-test-email">Test Email Address</Label>
                  <Input
                    id="direct-test-email"
                    type="email"
                    value={directTestEmail}
                    onChange={(e) => setDirectTestEmail(e.target.value)}
                    placeholder="your-email@example.com"
                  />
                </div>
                <Button
                  onClick={sendDirectSendGridTest}
                  disabled={directTestLoading || !directTestEmail}
                  className="w-full"
                >
                  {directTestLoading ? "Sending..." : "Send SendGrid Test"}
                </Button>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">SendGrid Issues:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Complex domain verification</li>
                    <li>Sender authentication required</li>
                    <li>Lower free tier (100 emails/day)</li>
                    <li>More configuration steps</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Email System Diagnostics
              </CardTitle>
              <CardDescription>Comprehensive check of your email configuration and services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runDiagnostics} disabled={diagnosticsLoading}>
                {diagnosticsLoading ? "Running Diagnostics..." : "Run Diagnostics"}
              </Button>

              {diagnostics && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Badge variant={diagnostics.success ? "default" : "destructive"}>
                      {diagnostics.success ? "Diagnosis Summary" : "Issues Found"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {diagnostics.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{diagnostics.summary}</span>
                    </div>
                  </div>

                  {/* Resend Setup Instructions */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2 text-blue-800">🚀 Quick Setup: Switch to Resend</h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                      <li>
                        <strong>1.</strong> Go to{" "}
                        <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">
                          resend.com
                        </a>{" "}
                        and create a free account
                      </li>
                      <li>
                        <strong>2.</strong> Generate an API key in your Resend dashboard
                      </li>
                      <li>
                        <strong>3.</strong> Add{" "}
                        <code className="bg-blue-100 px-1 rounded">RESEND_API_KEY=your_key_here</code> to your
                        environment variables
                      </li>
                      <li>
                        <strong>4.</strong> Set From Email to{" "}
                        <code className="bg-blue-100 px-1 rounded">noreply@timesnri.com</code> (your verified domain)
                      </li>
                      <li>
                        <strong>5.</strong> Test using the Resend Test button above
                      </li>
                    </ol>
                  </div>

                  {diagnostics.details.troubleshooting.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Current Issues
                      </h4>
                      <div className="text-sm text-red-600">
                        <ol className="list-decimal list-inside space-y-1">
                          {diagnostics.details.troubleshooting.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">🔧 Environment Variables</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(diagnostics.details.environmentVariables).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm">{key}</span>
                            {value ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Set
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Missing
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">⚙️ Email Configuration</h4>
                      <div className="space-y-2">
                        {Object.entries(diagnostics.details.emailConfiguration).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm">{key.replace(/_/g, " ")}</span>
                            {value ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Set
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Missing
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">📧 Email Service Tests</h4>
                      <div className="space-y-2">
                        {Object.entries(diagnostics.details.emailServices).map(([service, result]) => (
                          <div key={service} className="flex items-center justify-between">
                            <span className="text-sm capitalize flex items-center gap-2">
                              {service}
                              {service === "resend" && <Star className="h-3 w-3 text-blue-500" />}
                            </span>
                            <div className="flex items-center gap-2">
                              {result.connected ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Connected
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {result.details && <span className="text-xs text-gray-500">{result.details}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
