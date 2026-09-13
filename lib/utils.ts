import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function extractTakeawaysFromNotes(notes?: string | null): string {
    if (!notes) return "";

    // 1. Check for [Takeaways by ...]:
    if (notes.includes("[Takeaways by")) {
        const parts = notes.split(/\[Takeaways by [^\]]+\]:\s*/i);
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }
    }

    // 2. Check for Coach Notes:
    if (notes.includes("Coach Notes:")) {
        const parts = notes.split(/Coach Notes:\s*/i);
        if (parts.length > 1) {
            let content = parts[parts.length - 1];
            // Remove trailing [Session Completed] or other bracket markers
            content = content.replace(/\[Session Completed.*?\]/gi, "").trim();
            return content;
        }
    }

    return "";
}
