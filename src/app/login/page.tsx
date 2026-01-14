"use client";

export default function LoginPage() {
    console.log("Sanity Check: Login Page Loaded");
    return (
        <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold text-green-500 mb-4">SANITY CHECK PASSED</h1>
            <p className="max-w-md text-center text-zinc-400">
                If you can see this, the application routing is working correctly.
                The issue was likely in the Supabase initialization or UI component logic.
            </p>
            <div className="mt-8 p-4 bg-black rounded-lg font-mono text-xs">
                Timestamp: {new Date().toISOString()}
            </div>
        </div>
    );
}
