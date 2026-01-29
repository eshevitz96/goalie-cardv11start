"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, CreditCard, BookOpen, Users, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface WhatsNewGuideProps {
    onClose?: () => void;
}

export function WhatsNewGuide({ onClose }: WhatsNewGuideProps) {
    const [isOpen, setIsOpen] = useState(false);
    const VERSION_KEY = "v1.1_activation_guide_seen";

    useEffect(() => {
        const seen = localStorage.getItem(VERSION_KEY);
        if (!seen) {
            // Small delay to feel natural
            setTimeout(() => setIsOpen(true), 1000);
        }
    }, []);

    const handleDismiss = () => {
        setIsOpen(false);
        localStorage.setItem(VERSION_KEY, "true");
        if (onClose) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
                    >
                        {/* Apple-esque Header */}
                        <div className="text-center mb-8 mt-2">
                            <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">
                                Welcome to <span className="text-primary italic">Goalie Card</span>
                            </h2>
                            <p className="text-muted-foreground font-medium text-lg">
                                Your digital identity for the game.
                            </p>
                        </div>

                        {/* Feature List */}
                        <div className="space-y-8 mb-10 pl-2">

                            {/* Feature 1 */}
                            <div className="flex gap-5 items-start">
                                <div className="text-primary mt-1">
                                    <CreditCard size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-lg mb-1">Official Digital ID</h3>
                                    <p className="text-muted-foreground text-[15px] leading-relaxed">
                                        Your verified stats, team history, and coaching lineage in one secure, sharable card.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex gap-5 items-start">
                                <div className="text-primary mt-1">
                                    <BookOpen size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-lg mb-1">Performance Journal</h3>
                                    <p className="text-muted-foreground text-[15px] leading-relaxed">
                                        Track your mental game. Log post-game thoughts and monitor your confidence over the season.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex gap-5 items-start">
                                <div className="text-primary mt-1">
                                    <Users size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-lg mb-1">Coach Connection</h3>
                                    <p className="text-muted-foreground text-[15px] leading-relaxed">
                                        Direct feedback loop. Receive lesson notes and training assignments directly from your staff.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleDismiss}
                            className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                            Continue
                        </button>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
