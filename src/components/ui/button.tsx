import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] rounded-xl shadow-soft hover:shadow-medium",
        destructive: "bg-destructive text-white hover:bg-destructive/90 active:scale-[0.98] rounded-xl focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background hover:bg-accent hover:text-accent-foreground rounded-xl dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Hero button - Large, prominent for landing pages
        hero: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] rounded-2xl shadow-medium hover:shadow-large font-semibold tracking-tight",
        // Hero secondary - Glass effect for landing pages (white text for dark backgrounds)
        heroSecondary: "glass text-white hover:bg-white/20 active:scale-[0.98] rounded-2xl font-semibold tracking-tight",
        // Map control buttons - Compact glass style
        mapControl: "glass text-foreground hover:bg-accent/60 active:scale-[0.97] rounded-xl",
        // Success variant
        success: "bg-success text-success-foreground hover:bg-success/90 active:scale-[0.98] rounded-xl shadow-soft",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-xs has-[>svg]:px-3",
        lg: "h-12 px-6 text-base has-[>svg]:px-5",
        xl: "h-14 px-8 text-lg has-[>svg]:px-6",
        icon: "size-10",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
        // Hero sizes
        hero: "h-14 px-8 text-base has-[>svg]:px-6",
        heroLg: "h-16 px-10 text-lg has-[>svg]:px-8",
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
