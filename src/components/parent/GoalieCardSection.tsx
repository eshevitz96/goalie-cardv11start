"use client";

import { motion } from "framer-motion";
import { GoalieCard } from "@/components/GoalieCard";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface GoalieCardSectionProps {
    goalies: any[];
    currentIndex: number;
    setCurrentIndex: (index: number | ((prev: number) => number)) => void;
}

export function GoalieCardSection({ goalies, currentIndex, setCurrentIndex }: GoalieCardSectionProps) {
    const activeGoalie = goalies[currentIndex];
    const [showProgress, setShowProgress] = useState(true);

    // Sync Toggle Default logic from original page
    const currentYear = new Date().getFullYear();
    const isAdult = activeGoalie ? (activeGoalie.gradYear && (activeGoalie.gradYear < currentYear)) : false;
    const isPro = isAdult;

    useEffect(() => {
        if (activeGoalie) {
            setShowProgress(!isPro);
        }
    }, [activeGoalie, isPro]);

    if (!activeGoalie) return null;

    return (
        <motion.div
            key={activeGoalie.id} // Re-animate on change
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="relative group">
                <GoalieCard
                    name={activeGoalie.name}
                    session={activeGoalie.session}
                    lesson={activeGoalie.lesson}
                    team={activeGoalie.team}
                    gradYear={activeGoalie.gradYear}
                    height={activeGoalie.height}
                    weight={activeGoalie.weight}
                    catchHand={activeGoalie.catchHand}
                    showProgress={showProgress}
                    credits={activeGoalie.credits}
                    className="w-full h-auto aspect-[4/5] md:aspect-auto md:h-[500px]"
                />

                {/* Display Controls */}
                <div className="flex justify-center mt-4">
                    <button
                        onClick={() => setShowProgress(!showProgress)}
                        className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/30 px-3 py-1.5 rounded-full"
                    >
                        {showProgress ? <span className="text-primary">●</span> : <span className="text-muted-foreground">○</span>}
                        {showProgress ? "Hide Activity Counts" : "Show Activity Counts"}
                    </button>
                </div>

                {/* Switcher Controls */}
                {goalies.length >= 1 && (
                    <>
                        {goalies.length > 1 && (
                            <>
                                <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12">
                                    <button
                                        onClick={() => setCurrentIndex(prev => prev === 0 ? goalies.length - 1 : prev - 1)}
                                        className="p-1.5 bg-card/80 rounded-full text-muted-foreground hover:text-foreground hover:bg-card backdrop-blur-sm border border-border shadow-xl transition-all"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                </div>
                                <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12">
                                    <button
                                        onClick={() => setCurrentIndex(prev => prev === goalies.length - 1 ? 0 : prev + 1)}
                                        className="p-1.5 bg-card/80 rounded-full text-muted-foreground hover:text-foreground hover:bg-card backdrop-blur-sm border border-border shadow-xl transition-all"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="flex justify-center items-center gap-2 mt-4">
                            {goalies.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-2 rounded-full transition-all ${currentIndex === idx ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground"}`}
                                />
                            ))}
                            <Link href="/activate" className="h-6 w-6 rounded-full bg-primary/10 border border-dashed border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all ml-2" title="Link Access ID">
                                <Plus size={12} />
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
