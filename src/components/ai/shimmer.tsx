import { cn } from "../../lib/utils"
import React from "react"

export function Shimmer({
  className,
  children,
  duration = 2,
}: {
  className?: string
  children: React.ReactNode
  duration?: number
}) {
  return (
    <span
      className={cn(
        "inline-flex animate-pulse items-center text-muted-foreground",
        className
      )}
      style={{
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </span>
  )
}
