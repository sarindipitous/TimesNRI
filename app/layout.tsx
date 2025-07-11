import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Times NRI - Senior Care & Wellness Membership",
  description:
    "A verified, on-demand care membership for your parents in India. We provide the support they need, with the transparency you deserve.",
  generator: "Next.js",
  icons: {
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/timesnri_favicon-DSLvV0iLnWRwxijoGciCPulU5NAWQ1.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-M3BPTDF9');`,
          }}
        />
        {/* End Google Tag Manager */}

        <link
          rel="icon"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/timesnri_favicon-DSLvV0iLnWRwxijoGciCPulU5NAWQ1.ico"
        />
        <meta name="theme-color" content="#4A8B9F" />
      </head>
      <body>
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

        {children}
      </body>
    </html>
  )
}
