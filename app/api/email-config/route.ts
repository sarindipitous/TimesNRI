import { NextResponse } from "next/server"
import { getAllEmailConfig } from "@/lib/email-config"

export async function GET() {
  try {
    const config = await getAllEmailConfig()
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("Error fetching email config:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch email configuration" }, { status: 500 })
  }
}
