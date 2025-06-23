import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 pt-20">{children}</div>
      <Footer />
    </div>
  )
}
