"use client"

import type React from "react"

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

export default function EmailConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
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
          <TabsTrigger value="template">Email Template</TabsTrigger>
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
                    placeholder="Welcome to Times NRI"
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
          <Card>
            <CardHeader>
              <CardTitle>Email Template</CardTitle>
              <p className="text-sm text-gray-600">
                Use these variables in your template: {{ name }}, {{ email }}, {{ parent_location }},{{ care_plan }},{" "}
                {{ waitlist_number }}, {{ referral_link }}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={config.welcome_email_template || ""}
                  onChange={(e) => updateConfig("welcome_email_template", e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Enter your HTML email template here..."
                />
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
