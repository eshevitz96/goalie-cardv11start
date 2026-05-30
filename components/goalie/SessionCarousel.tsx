"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GoalieCard } from "@/components/GoalieCard";
import { Button } from "@/components/ui/Button";

interface SessionCarouselProps {
    goalies: any[];
    currentIndex: number;
    setCurrentIndex: (index: number | ((prev: number) => number)) => void;
    isPro: boolean;
    sport?: string;
}

export function SessionCarousel({ goalies, currentIndex, setCurrentIndex, isPro, sport }: SessionCarouselProps) {
    const activeGoalie = goalies[currentIndex];
    // Internal state for showProgress to avoid lifting it if not needed elsewhere
    // But wait, the original page used it to toggle.
    const [showProgress, setShowProgress] = useState(!isPro);

    useEffect(() => {
        if (activeGoalie) {
            setShowProgress(!isPro);
        }
    }, [activeGoalie?.id, isPro]);

    if (!activeGoalie) return null;

    return (
        <motion.div
            key={activeGoalie.id}
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
                    sport={sport}
                    className="w-full h-auto aspect-[4/5] md:aspect-auto md:h-[500px]"
                />

                {/* Display Controls */}
                <div className="flex justify-center mt-4 mb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProgress(!showProgress)}
                        className="gap-2 bg-secondary/30 rounded-full"
                    >
                        {showProgress ? <span className="text-primary">●</span> : <span className="text-muted-foreground">○</span>}
                        {showProgress ? "Hide Activity Counts" : "Show Activity Counts"}
                    </Button>
                </div>

                {/* Switcher */}
                {goalies.length > 1 && (
                    <>
                        <div className="absolute top-1/2 -left-4 md:-left-10 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button
                                onClick={() => setCurrentIndex((prev) => (prev === 0 ? goalies.length - 1 : prev - 1))}
                                className="p-2 text-foreground/40 hover:text-foreground transition-colors"
                            >
                                <ChevronLeft size={32} strokeWidth={0.5} />
                            </button>
                        </div>
                        <div className="absolute top-1/2 -right-4 md:-right-10 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button
                                onClick={() => setCurrentIndex((prev) => (prev === goalies.length - 1 ? 0 : prev + 1))}
                                className="p-2 text-foreground/40 hover:text-foreground transition-colors"
                            >
                                <ChevronRight size={32} strokeWidth={0.5} />
                            </button>
                        </div>

                        <div className="flex justify-center gap-2 mt-4">
                            {goalies.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-2 rounded-full transition-all ${currentIndex === idx ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground"
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
