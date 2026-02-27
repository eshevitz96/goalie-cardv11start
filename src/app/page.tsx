"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { supabase } from "@/utils/supabase/client";

export default function EntryPortal() {
    const router = useRouter();
    const [showWelcome, setShowWelcome] = useState(true);

    useEffect(() => {
        const checkSessionAndRedirect = async () => {
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
                        <motion.h1
                            className="text-5xl md:text-7xl font-bold text-foreground tracking-tighter text-center px-4 uppercase"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            Goalie Card
                        </motion.h1>


                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
