import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { GoogleTagManager } from "@next/third-parties/google"

const inter = Inter({ subsets: ["latin"] })

// Helper function to ensure URL has proper schema
function ensureHttps(url: string): string {
  if (!url) return "https://www.timesnri.com"
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  return `https://${url}`
}

const siteUrl = ensureHttps(process.env.NEXT_PUBLIC_SITE_URL || "www.timesnri.com")

export const metadata: Metadata = {
  title: "TimesNRI - Senior Care for NRI Families",
  description:
    "Comprehensive senior care services for NRI families. 24/7 emergency support, health monitoring, and companionship for your loved ones in India.",
  keywords: "NRI senior care, elderly care India, NRI family support, senior health monitoring, emergency care India",
  authors: [{ name: "TimesNRI" }],
  creator: "TimesNRI",
  publisher: "TimesNRI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "TimesNRI - Senior Care for NRI Families",
    description:
      "Comprehensive senior care services for NRI families. 24/7 emergency support, health monitoring, and companionship for your loved ones in India.",
    url: siteUrl,
    siteName: "TimesNRI",
    images: [
      {
        url: `${siteUrl}/images/hero-video-call.png`,
        width: 1200,
        height: 630,
        alt: "TimesNRI Senior Care Services",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TimesNRI - Senior Care for NRI Families",
    description:
      "Comprehensive senior care services for NRI families. 24/7 emergency support, health monitoring, and companionship for your loved ones in India.",
    images: [`${siteUrl}/images/hero-video-call.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <GoogleTagManager gtmId="GTM-XYZ" />
      <body className={inter.className} suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-XYZ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
