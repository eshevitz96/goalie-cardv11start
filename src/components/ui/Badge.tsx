import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "glass"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",

            // Variants
            variant === "default" && "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
            variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            variant === "destructive" && "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
            variant === "outline" && "text-foreground",
            variant === "ghost" && "border-transparent bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",

            // Glassmorphism - consistent with our premium aesthetic
            variant === "glass" && "border-white/10 bg-white/5 backdrop-blur-md text-white shadow-sm",

            className
        )} {...props} />
    )
}
