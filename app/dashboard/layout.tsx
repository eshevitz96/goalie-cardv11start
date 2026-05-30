"use client";

import { useAuth } from "@/hooks/useAuth";
import { useParentData } from "@/hooks/useParentData";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const router = useRouter();
    const { goalies } = useParentData();

    // Render the layout frame immediately; sub-components handle their own loading states
    const activeGoalie = goalies?.[0] || null;
    const activeGoalieName = activeGoalie?.goalie_name || "Athlete";

    return (
        <div className="flex min-h-screen bg-black">
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
