import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary/90 border-b-2 border-primary-700",
        destructive:
          "bg-danger text-white hover:bg-danger/90 border-b-2 border-danger-700",
        outline:
          "border border-primary border-b-2 bg-transparent hover:bg-primary hover:text-white",
        secondary:
          "bg-secondary text-white hover:bg-secondary/90 border-b-2 border-secondary-700",
        ghost: "hover:bg-accent hover:text-white",
        link: "underline-offset-4 hover:underline text-primary",
        pixel:
          "font-pixel border-2 border-dark-700 shadow-pixel bg-primary text-white hover:bg-primary-600 hover:shadow-none active:translate-y-1 active:translate-x-1 active:shadow-none",
        "pixel-secondary":
          "font-pixel border-2 border-dark-700 shadow-pixel bg-secondary text-white hover:bg-secondary-600 hover:shadow-none active:translate-y-1 active:translate-x-1 active:shadow-none",
        "pixel-accent":
          "font-pixel border-2 border-dark-700 shadow-pixel bg-accent text-white hover:bg-accent-600 hover:shadow-none active:translate-y-1 active:translate-x-1 active:shadow-none",
        "pixel-warning":
          "font-pixel border-2 border-dark-700 shadow-pixel bg-warning text-dark hover:bg-warning-600 hover:shadow-none active:translate-y-1 active:translate-x-1 active:shadow-none",
        "pixel-danger":
          "font-pixel border-2 border-dark-700 shadow-pixel bg-danger text-white hover:bg-danger-600 hover:shadow-none active:translate-y-1 active:translate-x-1 active:shadow-none",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10",
        pixel: "h-10 py-1 px-4 text-xs",
        "pixel-sm": "h-8 py-0 px-3 text-xs",
        "pixel-lg": "h-12 py-2 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
