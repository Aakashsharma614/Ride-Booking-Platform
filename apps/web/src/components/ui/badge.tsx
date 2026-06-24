import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-gray-700 bg-gray-800 text-gray-200",
        emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        red: "border-red-500/30 bg-red-500/10 text-red-400",
        amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
        cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
        gray: "border-gray-700 bg-gray-800/50 text-gray-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
