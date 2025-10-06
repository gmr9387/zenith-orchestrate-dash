import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:1000px_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
