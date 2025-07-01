"use client"

import * as React from "react"
import * as RadixRadioGroup from "@radix-ui/react-radio-group"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* -----------------------------------------------------------------------------
   Styles
----------------------------------------------------------------------------- */

const radioGroupItemVariants = cva(
  "h-4 w-4 rounded-full border border-input text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      color: {
        default: "",
        primary: "data-[state=checked]:bg-primary",
      },
      size: {
        sm: "h-3.5 w-3.5",
        md: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      color: "primary",
      size: "md",
    },
  },
)

/* -----------------------------------------------------------------------------
   Components
----------------------------------------------------------------------------- */

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Root> {}

export const RadioGroup = React.forwardRef<React.ElementRef<typeof RadixRadioGroup.Root>, RadioGroupProps>(
  ({ className, ...props }, ref) => (
    <RadixRadioGroup.Root ref={ref} className={cn("grid gap-2", className)} {...props} />
  ),
)
RadioGroup.displayName = RadixRadioGroup.Root.displayName

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Item>,
    VariantProps<typeof radioGroupItemVariants> {}

export const RadioGroupItem = React.forwardRef<React.ElementRef<typeof RadixRadioGroup.Item>, RadioGroupItemProps>(
  ({ className, color, size, ...props }, ref) => (
    <RadixRadioGroup.Item ref={ref} className={cn(radioGroupItemVariants({ color, size }), className)} {...props}>
      <RadixRadioGroup.Indicator
        className={cn(
          "flex items-center justify-center",
          size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3 w-3" : "h-4 w-4",
        )}
      >
        <span className="block h-2 w-2 rounded-full bg-current" />
      </RadixRadioGroup.Indicator>
    </RadixRadioGroup.Item>
  ),
)
RadioGroupItem.displayName = RadixRadioGroup.Item.displayName
