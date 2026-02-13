"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/login");
    }, [router]);

    return (
        <main className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-white" />
        </main>
    );
}
