import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-wider transition-all duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-action-orange/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        // Primary - Action Orange with offset shadow
        default: "bg-action-orange text-white border border-action-orange-dark rounded-sm shadow-[2px_2px_0_0_var(--color-action-orange-dark)] hover:bg-action-orange-light active:shadow-[1px_1px_0_0_var(--color-action-orange-dark)] active:translate-x-px active:translate-y-px",

        // Secondary - White with stone offset shadow
        secondary: "bg-white text-deep-stone border border-stone-border rounded-sm shadow-[2px_2px_0_0_var(--color-stone-border)] hover:bg-stone-light active:shadow-[1px_1px_0_0_var(--color-stone-border)] active:translate-x-px active:translate-y-px",

        // Outline - Transparent with border
        outline: "bg-transparent text-deep-stone border border-stone-border rounded-sm hover:bg-stone-light active:bg-stone-medium/30",

        // Ghost - Minimal, no border
        ghost: "bg-transparent text-muted-stone hover:text-deep-stone hover:bg-stone-light rounded-sm",

        // Destructive - Red with offset shadow
        destructive: "bg-status-impassable text-white border border-red-700 rounded-sm shadow-[2px_2px_0_0_#b91c1c] hover:bg-red-500 active:shadow-[1px_1px_0_0_#b91c1c] active:translate-x-px active:translate-y-px",

        // Success - Green with offset shadow
        success: "bg-status-clear text-white border border-green-700 rounded-sm shadow-[2px_2px_0_0_#15803d] hover:bg-green-500 active:shadow-[1px_1px_0_0_#15803d] active:translate-x-px active:translate-y-px",

        // Link - Text only
        link: "text-action-orange underline-offset-4 hover:underline p-0 h-auto",

        // Hero - Large, prominent for landing pages
        hero: "bg-action-orange text-white border border-action-orange-dark rounded-sm shadow-[3px_3px_0_0_var(--color-action-orange-dark)] hover:bg-action-orange-light active:shadow-[1px_1px_0_0_var(--color-action-orange-dark)] active:translate-x-0.5 active:translate-y-0.5 font-bold",

        // Hero Secondary - White plate style
        heroSecondary: "bg-white text-deep-stone border border-stone-border rounded-sm shadow-[3px_3px_0_0_var(--color-stone-border)] hover:bg-stone-light active:shadow-[1px_1px_0_0_var(--color-stone-border)] active:translate-x-0.5 active:translate-y-0.5 font-bold",

        // Map Control - Compact for overlays
        mapControl: "bg-white text-deep-stone border border-stone-border rounded-sm shadow-[2px_2px_0_0_var(--color-stone-border)] hover:bg-stone-light active:shadow-[1px_1px_0_0_var(--color-stone-border)] active:translate-x-px active:translate-y-px",
      },
      size: {
        default: "h-10 px-5 py-2",
        xs: "h-6 gap-1 px-2 text-[10px]",
        sm: "h-8 gap-1.5 px-3 text-[11px]",
        lg: "h-12 px-6 text-sm",
        xl: "h-14 px-8 text-sm",
        icon: "size-10",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
        // Hero sizes
        hero: "h-14 px-8 text-sm",
        heroLg: "h-16 px-10 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
