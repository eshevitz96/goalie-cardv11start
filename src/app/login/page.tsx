"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to Activation/Access page
        router.push("/activate");
    }, [router]);

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
            <Loader2 className="animate-spin mb-4 text-primary" size={32} />
            <h1 className="text-xl font-bold">Redirecting to Access Portal...</h1>
            <p className="text-zinc-500 text-sm mt-2">
                We have unified our login and activation system.
            </p>
        </main>
    );
}
