import React from 'react';
import { GoalieCard } from "@/components/GoalieCard";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface GoalieCarouselProps {
    goalies: any[];
    currentIndex: number;
    setCurrentIndex: (index: number | ((prev: number) => number)) => void;
    activeGoalie: any;
    isPro: boolean;
    showProgress: boolean;
    setShowProgress: (show: boolean) => void;
}

export function GoalieCarousel({
    goalies, currentIndex, setCurrentIndex, activeGoalie, isPro, showProgress, setShowProgress
}: GoalieCarouselProps) {
    if (!activeGoalie) return null;

    return (
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
                id={activeGoalie.id}
                showProgress={showProgress}
                isPro={isPro}
                seasonProgress={undefined}
                className="w-full h-auto aspect-[4/5] md:aspect-auto md:h-[500px]"
            />

            {/* Display Controls */}
            <div className="flex justify-center mt-4">
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

            {/* Switcher Controls */}
            {goalies.length >= 1 && (
                <>
                    {goalies.length > 1 && (
                        <>
                            <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentIndex(prev => prev === 0 ? goalies.length - 1 : prev - 1)}
                                    className="p-1.5 bg-card/80 rounded-full backdrop-blur-sm border border-border shadow-xl hover:bg-card transform hover:scale-110 transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                            </div>
                            <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentIndex(prev => prev === goalies.length - 1 ? 0 : prev + 1)}
                                    className="p-1.5 bg-card/80 rounded-full backdrop-blur-sm border border-border shadow-xl hover:bg-card transform hover:scale-110 transition-all"
                                >
                                    <ChevronRight size={16} />
                                </Button>
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
    );
}
