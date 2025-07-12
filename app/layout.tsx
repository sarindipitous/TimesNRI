import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { FloatingCTA } from "@/components/floating-cta"

const inter = Inter({ subsets: ["latin"] })

// --- Site URL helper --------------------------------------------------------
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://timesnri.com"
const siteUrl = rawSiteUrl.startsWith("http") ? rawSiteUrl : `https://${rawSiteUrl}`
// ----------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Times NRI - Senior Care & Wellness Membership for NRI Families",
  description:
    "Professional senior care services for your parents in India. Peace of mind for NRI families with 24/7 support, health monitoring, and emergency response.",
  keywords:
    "NRI senior care, elderly care India, parent care services, NRI family support, senior wellness, healthcare India",
  authors: [{ name: "Times NRI" }],
  creator: "Times NRI",
  publisher: "Times NRI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Times NRI - Senior Care & Wellness Membership for NRI Families",
    description:
      "Professional senior care services for your parents in India. Peace of mind for NRI families with 24/7 support, health monitoring, and emergency response.",
    url: siteUrl,
    siteName: "Times NRI",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Times NRI - Senior Care for NRI Families",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Times NRI - Senior Care & Wellness Membership for NRI Families",
    description: "Professional senior care services for your parents in India. Peace of mind for NRI families.",
    images: ["/images/og-image.jpg"],
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
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M3BPTDF9');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M3BPTDF9"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <FloatingCTA />
        </ThemeProvider>
      </body>
    </html>
  )
}
