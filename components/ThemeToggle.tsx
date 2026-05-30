"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="h-10 w-16 rounded-full bg-secondary/50" />
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative inline-flex h-10 w-16 cursor-pointer items-center rounded-full bg-secondary border border-border transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Toggle theme"
        >
            <span
                className={`${theme === "dark" ? "translate-x-7" : "translate-x-1"
                    } inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out`}
            >
                {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-primary" />
                ) : (
                    <Sun className="h-4 w-4 text-accent" />
                )}
            </span>
        </button>
    )
}
