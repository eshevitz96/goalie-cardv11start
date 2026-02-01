"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function EntryPortal() {
    const router = useRouter();
    const [showWelcome, setShowWelcome] = useState(true);

    useEffect(() => {
        // Show welcome message for a few seconds for that premium feel
        const timer = setTimeout(() => {
            setShowWelcome(false);
            // Wait for exit animation to finish before redirecting
            setTimeout(() => {
                router.replace("/login");
            }, 800);
        }, 2500);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <main className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
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
                            className="text-4xl md:text-5xl font-semibold text-white tracking-tight text-center px-4"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 1 }}
                        >
                            Welcome to Goalie Card
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 1, duration: 1 }}
                            className="text-white/50 text-sm font-medium tracking-widest uppercase"
                        >
                            Loading Experience
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
