import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
        outline: "border border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white",
        secondary: "bg-gray-800 text-gray-200 hover:bg-gray-700",
        ghost: "hover:bg-gray-800 text-gray-400 hover:text-white",
        link: "text-emerald-400 underline-offset-4 hover:underline",
        primary: "bg-white text-black hover:bg-gray-100",
        blue: "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
