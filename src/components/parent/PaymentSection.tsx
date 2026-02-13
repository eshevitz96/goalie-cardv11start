"use client";

import { motion } from "framer-motion";

interface PaymentSectionProps {
    activeGoalie: any;
}

export function PaymentSection({ activeGoalie }: PaymentSectionProps) {
    if (!activeGoalie) return null;

    const hasSessions = activeGoalie.session && activeGoalie.session > 0;
    const hasLessons = activeGoalie.lesson && activeGoalie.lesson > 0;

    if (hasSessions || hasLessons) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between gap-4 mb-6"
        >
            <div>
                <h4 className="text-sm font-bold text-foreground">Out of Sessions?</h4>
                <p className="text-xs text-muted-foreground">Purchase a package to add lessons to your card.</p>
            </div>
            <button
                onClick={() => {
                    const el = document.getElementById('coach-corner-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else alert("Please verify your assigned coach details.");
                }}
                className="bg-primary text-black px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90"
            >
                Buy Now
            </button>
        </motion.div>
    );
}
