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
  "XRAY Chest",
  "USG W/A",
  "ECHO Cardiography",
  "TMT",
  "PFT",
  "DEXA Spine & Femur",
  "X-Ray Mammography (Female)",
]

export function HealthTestTooltip({ plan, className }: HealthTestTooltipProps) {
  const markers = plan === "presence" ? presenceMarkers : honourMarkers
  const title = plan === "presence" ? "84 Markers for Presence includes..." : "100 parameters for Honour includes..."

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className={`h-4 w-4 text-blue-500 cursor-help hover:text-blue-600 transition-colors ${className}`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4 bg-white border border-gray-200 shadow-lg">
          <div className="space-y-2">
            <p className="font-semibold text-sm text-gray-900">{title}</p>
            <div className="grid grid-cols-1 gap-1 text-xs text-gray-700">
              {markers.map((marker, index) => (
                <div key={index} className="flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{marker}</span>
                </div>
              ))}
            </div>
            {plan === "honour" && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-purple-600">+ Microbiome Gut Test</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
