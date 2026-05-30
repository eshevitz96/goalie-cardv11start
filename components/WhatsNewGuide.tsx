"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, BarChart3, ShieldCheck, Zap, X } from "lucide-react";
import { useState, useEffect } from "react";

interface WhatsNewGuideProps {
    onClose?: () => void;
}

export function WhatsNewGuide({ onClose }: WhatsNewGuideProps) {
    const [isOpen, setIsOpen] = useState(false);
    const VERSION_KEY = "v1.1_v11_orientation_seen_final_v5";

    useEffect(() => {
        const seen = localStorage.getItem(VERSION_KEY);
        if (!seen) {
            setTimeout(() => setIsOpen(true), 1200); 
        }
    }, []);

    const handleDismiss = () => {
        setIsOpen(false);
        localStorage.setItem(VERSION_KEY, "true");
        if (onClose) onClose();
    };

    const steps = [
        {
            icon: <Brain className="text-blue-500" size={28} />,
            title: "Follow Coach OS",
            desc: "Expert protocols tailored to your intensity. Log training daily to keep your digital identity growing."
        },
        {
            icon: <BarChart3 className="text-white" size={28} />,
            title: "Chart Every Play",
            desc: "Submit your saves and goals tracking. Study your tape to build dynamic Heatwaves and expose cold zones."
        },
        {
            icon: <ShieldCheck className="text-blue-400" size={28} />,
            title: "Protect the Mind",
            desc: "Your Coach uses your training journal to adjust your session load. Success starts with a clear frame of mind."
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-2xl p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-[420px] bg-[#1c1c1e] border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
                    >
                        {/* Close button - top right */}
                        <button 
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-[#2c2c2e] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                <Zap size={28} className="text-white" fill="white" />
                            </div>

                            <h2 className="text-2xl font-black text-white tracking-tight text-center mb-8">
                                What's New in Goalie Card
                            </h2>

                            <div className="space-y-6 mb-10 w-full px-2">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex gap-5 items-start">
                                        <div className="shrink-0 mt-1">
                                            {step.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-[16px] leading-tight mb-1">{step.title}</h3>
                                            <p className="text-[#8e8e93] text-[13px] leading-snug font-medium pr-2">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Small Print Wrapper */}
                            <div className="mb-8 px-2">
                                <p className="text-[#48484a] text-[11px] leading-[1.3] text-center font-medium max-w-[340px]">
                                    Your training logs and tracking data are used to personalize your Coach OS experience. View how your performance data is 
                                    <span className="text-[#007aff] cursor-pointer hover:underline ml-1">securely managed...</span>
                                </p>
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="w-full bg-[#007aff] text-white font-bold text-base py-3.5 rounded-full hover:bg-[#0071e3] transition-all"
                            >
                                Continue
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
