"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkUserStatus } from "@/app/actions";
import { useTheme } from "next-themes";

export default function SignupPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const status = await checkUserStatus(email);
            if (status.exists || status.rosterStatus === 'linked') {
                // Already has account -> Go to login
                router.push(`/login?email=${encodeURIComponent(email)}`);
            } else {
                // Not found or found on roster -> Go to activation
                router.push(`/activate?email=${encodeURIComponent(email)}`);
            }
        } catch (err: any) {
            setError("Something went wrong. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-rose-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10 flex justify-center">
                    <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-2">
                        <img 
                            src="/flower-logo.png?v=5" 
                            alt="CIC Logo" 
                            width={42} 
                            height={42} 
                            draggable={false}
                            className="object-contain pointer-events-none select-none opacity-90 transition-all duration-300"
                            style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
                        />
                        Goalie Card
                    </h1>
                    <p className="text-muted-foreground font-medium">Join the standard for goalie development.</p>
                </div>

                <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-2xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 text-lg"
                                    placeholder="name@example.com"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 bg-red-500/10 border border-red-500/20 text-sm flex items-center gap-2 p-4 rounded-xl"
                            >
                                <AlertCircle size={16} /> {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10 group"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Join Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                            >
                                Already have an account? Sign In
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
