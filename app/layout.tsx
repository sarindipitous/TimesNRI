import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Times NRI - Elderly Care Concierge",
  description:
    "A verified, on-demand care concierge for your parents in India. We provide the support they need, with the transparency you deserve.",
  generator: "Next.js",
  icons: {
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/timesnri_favicon-DSLvV0iLnWRwxijoGciCPulU5NAWQ1.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/timesnri_favicon-DSLvV0iLnWRwxijoGciCPulU5NAWQ1.ico"
        />
        <meta name="theme-color" content="#4A8B9F" />
      </head>
      <body>{children}</body>
    </html>
  )
}
