"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { supabase } from "@/utils/supabase/client";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function EntryPortal() {
    const router = useRouter();
    const { theme } = useTheme();
    const [showWelcome, setShowWelcome] = useState(true);

    useEffect(() => {
        const checkSessionAndRedirect = async () => {
            // Check for recovery/auth code and forward to callback if it missed the target
            const searchParams = new URLSearchParams(window.location.search);
            const code = searchParams.get('code');
            if (code) {
                router.replace(`/auth/callback${window.location.search}`);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace("/dashboard");
                return;
            }

            // Show welcome message for a few seconds if no session
            const timer = setTimeout(() => {
                setShowWelcome(false);
                setTimeout(() => {
                    router.replace("/login");
                }, 800);
            }, 2500);

            return () => clearTimeout(timer);
        };

        checkSessionAndRedirect();
    }, [router]);

    return (
        <main className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Apple-esque ease-out
                        className="flex flex-col items-center justify-center space-y-6"
                    >
                        <BrandLogo 
                            size={68} 
                            textClassName="text-5xl md:text-7xl font-medium tracking-tight" 
                        />


                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
