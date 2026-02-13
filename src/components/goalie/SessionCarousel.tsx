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
}

export function SessionCarousel({ goalies, currentIndex, setCurrentIndex, isPro }: SessionCarouselProps) {
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
                        <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentIndex((prev) => (prev === 0 ? goalies.length - 1 : prev - 1))}
                                className="p-1.5 bg-card/80 rounded-full backdrop-blur-sm border border-border shadow-xl hover:bg-card transform hover:scale-110 transition-all"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                        </div>
                        <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentIndex((prev) => (prev === goalies.length - 1 ? 0 : prev + 1))}
                                className="p-1.5 bg-card/80 rounded-full backdrop-blur-sm border border-border shadow-xl hover:bg-card transform hover:scale-110 transition-all"
                            >
                                <ChevronRight size={16} />
                            </Button>
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
