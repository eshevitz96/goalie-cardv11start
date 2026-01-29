"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EntryPortal() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/login");
    }, [router]);

    return (
        <main className="min-h-screen bg-black flex items-center justify-center">
            {/* Loading State while Redirecting */}
            <div className="text-white text-sm font-mono animate-pulse">
                Loading Secure Gateway...
            </div>
        </main>
    );
}
