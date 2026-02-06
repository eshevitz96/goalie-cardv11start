"use client";

import { Check, X, CreditCard, BookOpen, Users, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
        <Modal isOpen={isOpen} onClose={handleDismiss} size="lg">
            {/* Apple-esque Header */}
            <div className="text-center mb-8 mt-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">
                    Welcome to Goalie Card
                </h2>
                <p className="text-muted-foreground font-medium text-lg">
                    Your digital identity for the game.
                </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6 mb-10">

                {/* Feature 1 */}
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <CreditCard size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-[17px] leading-tight mb-0.5">Official Digital ID</h3>
                        <p className="text-muted-foreground text-[15px] leading-snug">
                            Verified stats, team history, and coaching lineage in one secure card.
                        </p>
                    </div>
                </div>

                {/* Feature 2 */}
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                        <BookOpen size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-[17px] leading-tight mb-0.5">Performance Journal</h3>
                        <p className="text-muted-foreground text-[15px] leading-snug">
                            Track your mental game. Log post-game thoughts and confidence.
                        </p>
                    </div>
                </div>

                {/* Feature 3 */}
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                        <Users size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-[17px] leading-tight mb-0.5">Coach Connection</h3>
                        <p className="text-muted-foreground text-[15px] leading-snug">
                            Receive lesson notes and training assignments directly from staff.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <Button
                onClick={handleDismiss}
                className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20 h-auto"
            >
                Continue
            </Button>
        </Modal>
    );
}
