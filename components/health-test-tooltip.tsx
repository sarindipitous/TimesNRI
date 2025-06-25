"use client"

import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HealthTestTooltipProps {
  plan: "presence" | "honour"
  className?: string
}

const presenceMarkers = [
  "Sugar-Fasting",
  "HbA1c",
  "LFT",
  "KFT",
  "Calcium",
  "Lipid Profile",
  "Thyroid Profile Total",
  "CBC with ESR",
  "Vitamin D3",
  "Vitamin B-12",
  "Phosphorus",
  "ALK Phosphatase",
  "Iron Studies",
  "Ferritin",
  "Hs-CRP",
  "PSA-Total (Male)",
  "LBC PAP (Female)",
  "Urine R/M",
]

const honourMarkers = [
  "Sugar-Fasting",
  "HbA1c",
  "LFT",
  "KFT",
  "Calcium",
  "Lipid Profile",
  "Thyroid Profile Free",
  "Hemogram",
  "Vitamin D3",
  "Vitamin B-12",
  "Phosphorus",
  "ALK Phosphatase",
  "Iron Studies",
  "Ferritin",
  "Hs-CRP",
  "PSA-Profile (Male)",
  "LBC PAP (Female)",
  "Urine R/M",
  "ECG",
  "X-Ray Chest",
  "USG W/A",
  "ECHO Cardiography",
  "TMT",
  "PFT",
  "DEXA Spine & Femur",
  "X-Ray Mammography (Female)",
]

export function HealthTestTooltip({ plan, className }: HealthTestTooltipProps) {
  const markers = plan === "presence" ? presenceMarkers : honourMarkers
  const title = plan === "presence" ? "84 markers for Presence include:" : "100 parameters for Honour include:"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* consistent icon size */}
          <Info className={`h-4 w-4 text-blue-500 cursor-help hover:text-blue-600 transition-colors ${className}`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4 bg-white border border-gray-200 shadow-lg">
          <p className="font-semibold text-sm text-gray-900 mb-2">{title}</p>
          <ul className="grid grid-cols-1 gap-1 text-xs text-gray-700">
            {markers.map((m) => (
              <li key={m} className="flex items-start gap-1">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
          {plan === "honour" && (
            <p className="text-xs font-medium text-purple-600 mt-3 pt-2 border-t border-gray-200">
              + Microbiome Gut Test
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
