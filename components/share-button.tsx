"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"

interface ShareButtonProps {
  title: string
}

export function ShareButton({ title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    const shareData = { title, text: `Check out this article: ${title}`, url }

    // Try Web Share API
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        /* fall-through to clipboard */
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
    >
      {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
      <span>{copied ? "Copied!" : "Share"}</span>
    </button>
  )
}
