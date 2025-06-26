import { sql } from "@/lib/db"

export interface EmailConfig {
  id: number
  config_key: string
  config_value: string
  is_enabled: boolean
  created_at: Date
  updated_at: Date
}

export async function getEmailConfig(key: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT config_value FROM email_config 
      WHERE config_key = ${key} AND is_enabled = true
      LIMIT 1
    `
    return result[0]?.config_value || null
  } catch (error) {
    console.error(`Error fetching email config for ${key}:`, error)
    return null
  }
}

export async function getAllEmailConfig(): Promise<EmailConfig[]> {
  try {
    const result = await sql`
      SELECT * FROM email_config 
      ORDER BY config_key
    `
    return result as EmailConfig[]
  } catch (error) {
    console.error("Error fetching all email config:", error)
    return []
  }
}

export async function updateEmailConfig(key: string, value: string, enabled = true): Promise<boolean> {
  try {
    await sql`
      INSERT INTO email_config (config_key, config_value, is_enabled, updated_at)
      VALUES (${key}, ${value}, ${enabled}, CURRENT_TIMESTAMP)
      ON CONFLICT (config_key) 
      DO UPDATE SET 
        config_value = EXCLUDED.config_value,
        is_enabled = EXCLUDED.is_enabled,
        updated_at = CURRENT_TIMESTAMP
    `
    return true
  } catch (error) {
    console.error(`Error updating email config for ${key}:`, error)
    return false
  }
}

export async function isWelcomeEmailEnabled(): Promise<boolean> {
  const enabled = await getEmailConfig("welcome_email_enabled")
  return enabled === "true"
}
