"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    Sparkles, 
    Plus, 
    Trash2, 
    Target, 
    Calendar, 
    Clock, 
    Dumbbell, 
    Compass, 
    CheckCircle2,
    Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import { saveInterviewAction, InterviewGoalData, InterviewPlanInputs, GoalRungItem } from '@/app/actions/interview';
import { generateTrainingPlanAction } from '@/app/actions/planGeneration';

interface OnboardingInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialProfile?: {
        sport?: string;
        catch_hand?: string;
        grad_year?: string | number | null;
        date_of_birth?: string | null;
    } | null;
    onComplete?: () => void;
}

export function OnboardingInterviewModal({
    isOpen,
    onClose,
    initialProfile,
    onComplete
}: OnboardingInterviewModalProps) {
    // Flow state: 'conversation' (questions 1-4) | 'ladder' | 'form' | 'success'
    const [viewStage, setViewStage] = useState<'conversation' | 'ladder' | 'form' | 'success'>('conversation');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Part 1 Answers
    const [summitGoal, setSummitGoal] = useState("");
    const [currentLevel, setCurrentLevel] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [obstacles, setObstacles] = useState("");

    // Ladder state
    const [rungs, setRungs] = useState<GoalRungItem[]>([]);
    const [newRungText, setNewRungText] = useState("");

    // Part 2 Form Answers
    const [sport, setSport] = useState<string>(initialProfile?.sport || "hockey");
    const [catchHand, setCatchHand] = useState<string>(initialProfile?.catch_hand || "Left");
    const [daysAvailable, setDaysAvailable] = useState<string[]>(["Mon", "Wed", "Fri", "Sat"]);
    const [sessionLength, setSessionLength] = useState<number>(45);
    const [practiceDays, setPracticeDays] = useState<string[]>(["Tue", "Thu"]);
    const [gameDays, setGameDays] = useState<string[]>(["Sat", "Sun"]);
    const [scheduleVaries, setScheduleVaries] = useState<boolean>(false);
    const [equipmentAccess, setEquipmentAccess] = useState<string[]>(["Gym", "Wall / Rebounder", "Ice"]);
    const [notesWorkaround, setNotesWorkaround] = useState<string>("");
    const [shareWithCoach, setShareWithCoach] = useState<boolean>(false);

    const questions = [
        {
            title: "What's the big goal? Where do you want to be?",
            placeholder: "e.g. Starting varsity goalie next season / Playing NCAA hockey / Dominating playoffs",
            value: summitGoal,
            setValue: setSummitGoal
        },
        {
            title: "Where are you right now?",
            subtitle: "Team, level, role",
            placeholder: "e.g. U16 AAA backup / High school JV starter / Split playing time",
            value: currentLevel,
            setValue: setCurrentLevel
        },
        {
            title: "When do you want to get there?",
            placeholder: "e.g. Next season tryouts (October) / Summer showcase / In 6 months",
            value: targetDate,
            setValue: setTargetDate
        },
        {
            title: "What's in the way?",
            placeholder: "e.g. Rebound placement off low shots, explosive push recoveries, staying calm after a goal",
            value: obstacles,
            setValue: setObstacles
        }
    ];

    // Initialize default ladder rungs when moving from conversation to ladder view
    const buildInitialLadder = () => {
        const rawObstacles = obstacles
            .split(/[,;\n]+/)
            .map(o => o.trim())
            .filter(Boolean);

        const initialSteps: GoalRungItem[] = [];

        if (rawObstacles.length > 0) {
            rawObstacles.slice(0, 3).forEach((obs, idx) => {
                initialSteps.push({
                    title: `Master ${obs.toLowerCase()}`,
                    status: 'active',
                    order: idx + 1
                });
            });
        } else {
            initialSteps.push(
                { title: "Establish consistent weekly mobility & stance foundation", status: 'active', order: 1 },
                { title: "Develop explosive lateral crease recoveries", status: 'active', order: 2 },
                { title: "Game execution & high-pressure rebound control", status: 'active', order: 3 }
            );
        }

        if (initialSteps.length < 2) {
            initialSteps.push({
                title: "Accelerate save consistency and technical precision",
                status: 'active',
                order: initialSteps.length + 1
            });
        }

        setRungs(initialSteps);
        setViewStage('ladder');
    };

    const handleNextQuestion = () => {
        if (!questions[questionIndex].value.trim()) {
            return;
        }

        if (questionIndex < questions.length - 1) {
            setQuestionIndex(prev => prev + 1);
        } else {
            buildInitialLadder();
        }
    };

    const handleRungTextChange = (index: number, newText: string) => {
        setRungs(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], title: newText };
            return updated;
        });
    };

    const handleRemoveRung = (index: number) => {
        if (rungs.length <= 2) {
            alert("Keep at least 2 steps on your ladder.");
            return;
        }
        setRungs(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddRung = () => {
        if (!newRungText.trim()) return;
        setRungs(prev => [
            ...prev,
            { title: newRungText.trim(), status: 'active', order: prev.length + 1 }
        ]);
        setNewRungText("");
    };

    const toggleDay = (day: string, list: string[], setList: (days: string[]) => void) => {
        if (list.includes(day)) {
            setList(list.filter(d => d !== day));
        } else {
            setList([...list, day]);
        }
    };

    const toggleEquipment = (item: string) => {
        if (equipmentAccess.includes(item)) {
            setEquipmentAccess(equipmentAccess.filter(e => e !== item));
        } else {
            setEquipmentAccess([...equipmentAccess, item]);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const goalPayload: InterviewGoalData = {
                summit: summitGoal,
                current_level: currentLevel,
                target_date: targetDate,
                obstacles: obstacles,
                rungs: rungs
            };

            const planPayload: InterviewPlanInputs = {
                sport,
                catch_hand: catchHand,
                days_available: daysAvailable,
                session_length: sessionLength,
                team_practice_days: practiceDays,
                team_game_days: gameDays,
                team_schedule_varies: scheduleVaries,
                access_equipment: equipmentAccess,
                notes_workaround: notesWorkaround,
                share_with_coach: shareWithCoach
            };

            const res = await saveInterviewAction({
                goalData: goalPayload,
                planInputs: planPayload
            });

            if (res.success) {
                if (res.planId) {
                    // Trigger plan generation pipeline
                    await generateTrainingPlanAction(res.planId);
                }
                setViewStage('success');
                if (onComplete) onComplete();
            } else {
                setErrorMessage(res.error || "Failed to save your training setup.");
            }
        } catch (err: any) {
            setErrorMessage(err.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const equipmentOptions = ["Gym", "Home Weights", "Wall / Rebounder", "Ice", "Turf / Field", "Slide Board", "Bands"];

    return (
        <div className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground">
                            <Compass size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Goalie Training Setup</h3>
                            <p className="text-[11px] text-muted-foreground">Tailoring your developmental path</p>
                        </div>
                    </div>

                    {viewStage !== 'success' && (
                        <button
                            onClick={onClose}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-muted transition-colors flex items-center gap-1"
                        >
                            Skip for now <X size={14} />
                        </button>
                    )}
                </div>

                {/* STAGE 1: CONVERSATION (ONE QUESTION AT A TIME) */}
                {viewStage === 'conversation' && (
                    <div className="space-y-6">
                        {/* Progress Dots */}
                        <div className="flex items-center gap-1.5">
                            {questions.map((_, i) => (
                                <div
                                    key={i}
                                    className={clsx(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        i === questionIndex 
                                            ? "w-8 bg-foreground" 
                                            : i < questionIndex 
                                                ? "w-4 bg-foreground/40" 
                                                : "w-2 bg-muted"
                                    )}
                                />
                            ))}
                            <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                                Step {questionIndex + 1} of 4
                            </span>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={questionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <h4 className="text-lg md:text-xl font-bold text-foreground tracking-tight leading-snug">
                                        {questions[questionIndex].title}
                                    </h4>
                                    {questions[questionIndex].subtitle && (
                                        <p className="text-xs text-muted-foreground">
                                            {questions[questionIndex].subtitle}
                                        </p>
                                    )}
                                </div>

                                <textarea
                                    autoFocus
                                    rows={4}
                                    value={questions[questionIndex].value}
                                    onChange={(e) => questions[questionIndex].setValue(e.target.value)}
                                    placeholder={questions[questionIndex].placeholder}
                                    className="w-full bg-muted/50 border border-border focus:border-foreground/40 rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed transition-colors"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleNextQuestion();
                                        }
                                    }}
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Actions */}
                        <div className="flex items-center justify-between pt-2">
                            {questionIndex > 0 ? (
                                <button
                                    onClick={() => setQuestionIndex(prev => prev - 1)}
                                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                                >
                                    <ArrowLeft size={14} /> Back
                                </button>
                            ) : <div />}

                            <button
                                onClick={handleNextQuestion}
                                disabled={!questions[questionIndex].value.trim()}
                                className="px-5 py-2.5 bg-foreground hover:bg-foreground/90 disabled:opacity-40 text-background rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                            >
                                {questionIndex === questions.length - 1 ? "Review Ladder" : "Continue"} <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STAGE 2: LADDER VIEW */}
                {viewStage === 'ladder' && (
                    <div className="space-y-6">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                Your Goal Ladder
                            </span>
                            <h4 className="text-lg font-bold text-foreground tracking-tight">
                                Confirm Your Milestone Progression
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Edit any line below. These are the progressive steps to reach your summit.
                            </p>
                        </div>

                        {/* Summit Card */}
                        <div className="bg-muted/40 border border-border rounded-2xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1">
                                    <Target size={12} /> The Summit (Big Goal)
                                </span>
                            </div>
                            <input
                                type="text"
                                value={summitGoal}
                                onChange={(e) => setSummitGoal(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>

                        {/* Rungs List (Nearest First) */}
                        <div className="space-y-2.5">
                            <span className="text-xs font-bold text-muted-foreground block">
                                Steps (Nearest First):
                            </span>

                            {rungs.map((rung, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="w-6 text-center text-xs font-mono font-bold text-muted-foreground">
                                        {index + 1}.
                                    </span>
                                    <input
                                        type="text"
                                        value={rung.title}
                                        onChange={(e) => handleRungTextChange(index, e.target.value)}
                                        className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-foreground/40"
                                    />
                                    <button
                                        onClick={() => handleRemoveRung(index)}
                                        className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-muted transition-colors"
                                        title="Remove step"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            {/* Add Step Input */}
                            <div className="flex items-center gap-2 pt-1">
                                <span className="w-6 text-center text-xs font-mono font-bold text-muted-foreground">+</span>
                                <input
                                    type="text"
                                    value={newRungText}
                                    onChange={(e) => setNewRungText(e.target.value)}
                                    placeholder="Add another milestone step..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddRung();
                                        }
                                    }}
                                    className="flex-1 bg-muted/30 border border-dashed border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
                                />
                                <button
                                    onClick={handleAddRung}
                                    disabled={!newRungText.trim()}
                                    className="px-3 py-2 bg-muted hover:bg-muted/80 disabled:opacity-40 text-foreground text-xs font-semibold rounded-xl transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                            <button
                                onClick={() => setViewStage('conversation')}
                                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                            >
                                <ArrowLeft size={14} /> Back
                            </button>

                            <button
                                onClick={() => setViewStage('form')}
                                disabled={!summitGoal.trim() || rungs.length < 2}
                                className="px-5 py-2.5 bg-foreground hover:bg-foreground/90 disabled:opacity-40 text-background rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                            >
                                Confirm Ladder <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STAGE 3: QUICK FORM (ONE SCREEN) */}
                {viewStage === 'form' && (
                    <form onSubmit={handleFormSubmit} className="space-y-5">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                                Part 2 • Logistics & Routine
                            </span>
                            <h4 className="text-lg font-bold text-foreground tracking-tight">
                                Training Availability & Environment
                            </h4>
                        </div>

                        {/* Sport & Catch Hand */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1.5">Sport</label>
                                <div className="flex bg-muted/60 p-1 rounded-xl border border-border text-xs">
                                    {["hockey", "lacrosse"].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setSport(s)}
                                            className={clsx(
                                                "flex-1 py-1.5 rounded-lg font-semibold capitalize transition-all",
                                                sport === s ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {s === "hockey" ? "Ice Hockey" : "Lacrosse"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1.5">Catch Hand</label>
                                <div className="flex bg-muted/60 p-1 rounded-xl border border-border text-xs">
                                    {["Left", "Right"].map((hand) => (
                                        <button
                                            key={hand}
                                            type="button"
                                            onClick={() => setCatchHand(hand)}
                                            className={clsx(
                                                "flex-1 py-1.5 rounded-lg font-semibold transition-all",
                                                catchHand === hand ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {hand}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Days Available */}
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1.5">
                                Days Available For Training
                            </label>
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {daysOfWeek.map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day, daysAvailable, setDaysAvailable)}
                                        className={clsx(
                                            "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                                            daysAvailable.includes(day)
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                                        )}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Typical Session Length */}
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1.5">
                                Preferred Session Length
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[30, 45, 60, 90].map((len) => (
                                    <button
                                        key={len}
                                        type="button"
                                        onClick={() => setSessionLength(len)}
                                        className={clsx(
                                            "py-2 rounded-xl text-xs font-bold transition-all border",
                                            sessionLength === len
                                                ? "bg-foreground text-background border-foreground shadow-xs"
                                                : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                                        )}
                                    >
                                        {len} min
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Team Practices & Game Days */}
                        <div className="space-y-3 bg-muted/20 border border-border rounded-2xl p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">Team Schedule</span>
                                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={scheduleVaries}
                                        onChange={(e) => setScheduleVaries(e.target.checked)}
                                        className="rounded border-border accent-foreground"
                                    />
                                    Schedule varies weekly
                                </label>
                            </div>

                            {!scheduleVaries && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Practice Days</span>
                                        <div className="flex gap-1 flex-wrap">
                                            {daysOfWeek.map((day) => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day, practiceDays, setPracticeDays)}
                                                    className={clsx(
                                                        "px-2 py-1 rounded-lg text-[11px] font-medium border",
                                                        practiceDays.includes(day)
                                                            ? "bg-foreground/90 text-background border-foreground"
                                                            : "bg-muted/60 text-muted-foreground border-border"
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Game Days</span>
                                        <div className="flex gap-1 flex-wrap">
                                            {daysOfWeek.map((day) => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day, gameDays, setGameDays)}
                                                    className={clsx(
                                                        "px-2 py-1 rounded-lg text-[11px] font-medium border",
                                                        gameDays.includes(day)
                                                            ? "bg-foreground/90 text-background border-foreground"
                                                            : "bg-muted/60 text-muted-foreground border-border"
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Equipment & Facilities */}
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1.5">
                                Equipment & Facility Access (Multi-select)
                            </label>
                            <div className="flex gap-1.5 flex-wrap">
                                {equipmentOptions.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => toggleEquipment(item)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                                            equipmentAccess.includes(item)
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                                        )}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Workaround Notes */}
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                                Anything we should work around? (Optional)
                            </label>
                            <textarea
                                rows={2}
                                value={notesWorkaround}
                                onChange={(e) => setNotesWorkaround(e.target.value)}
                                placeholder="e.g. Back-to-back games on weekends, limited heavy gym access during school trips"
                                className="w-full bg-muted/50 border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 resize-none"
                            />
                        </div>

                        {/* Privacy Toggle: Share with Coach (Default OFF) */}
                        <div className="p-3.5 bg-muted/20 border border-border rounded-xl flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <label htmlFor="share-with-coach" className="text-xs font-bold text-foreground cursor-pointer block">
                                    Share my goal and plan with my coach
                                </label>
                                <p className="text-[11px] text-muted-foreground">
                                    Allow your coach to view your summit goal and routine on their dashboard.
                                </p>
                            </div>
                            <input
                                id="share-with-coach"
                                type="checkbox"
                                checked={shareWithCoach}
                                onChange={(e) => setShareWithCoach(e.target.checked)}
                                className="w-4 h-4 rounded border-border accent-foreground cursor-pointer shrink-0"
                            />
                        </div>

                        {errorMessage && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                                {errorMessage}
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setViewStage('ladder')}
                                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                            >
                                <ArrowLeft size={14} /> Back
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-foreground hover:bg-foreground/90 disabled:opacity-50 text-background rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                            >
                                {isSubmitting ? "Saving..." : "Submit Training Setup"} <Check size={14} />
                            </button>
                        </div>
                    </form>
                )}

                {/* STAGE 4: SUCCESS / END SCREEN */}
                {viewStage === 'success' && (
                    <div className="py-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} />
                        </div>

                        <div className="space-y-2 max-w-sm mx-auto">
                            <h4 className="text-xl font-bold text-foreground tracking-tight">
                                Your Plan is Being Built
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                You&apos;ll see your tailored development structure on your calendar once it&apos;s ready.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-foreground hover:bg-foreground/90 text-background text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
                            >
                                Done & Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
