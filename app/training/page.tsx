'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Loader2, Play, Pause, RotateCcw, ChevronDown, ChevronUp, BookOpen, Clock, Gamepad2 } from 'lucide-react';
import RavenGame from '@/components/training/RavenGame';
import { DRILL_LIBRARY } from '@/lib/drill-library';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { twMerge } from 'tailwind-merge';
import { useToast } from '@/context/ToastContext';
import { BrandLogo } from "@/components/ui/BrandLogo";

const DRILL_CATEGORIES = {
    physical: [
        "Hand-Eye Activation",
        "Wall Ball (Alt Hands)",
        "Juggling & Wall Ball tracking",
        "Goal Area Movement",
        "Wall Ball - Low Hops",
        "Butterfly Slides & Stick Seal",
        "Rebound Placement (Box Control)",
        "Up-Downs / Recoveries",
        "Post-to-Post Recoveries"
    ],
    mental: [
        "Box Breathing",
        "Box Breathing & Basics",
        "Disconnect & Walk",
        "Positive Visualization (Saves)"
    ],
    video: [
        "Video Review (Goals Against)"
    ]
};

export default function TrainingPage() {
    const auth = useAuth();
    const router = useRouter();
    const toast = useToast();

    const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
    const activeUserId = isDevBypass ? "00000000-0000-0000-0000-000000000000" : auth.userId;
    const activeIsAuthenticated = isDevBypass ? true : auth.isAuthenticated;
    const activeAuthLoading = isDevBypass ? false : auth.loading;

    const [loading, setLoading] = useState(true);
    const [personalBest, setPersonalBest] = useState<number | null>(null);

    // Redesign tabs state: 'drills' | 'timer' | 'game'
    const [activeTab, setActiveTab] = useState<'drills' | 'timer' | 'game'>('drills');
    const [expandedDrill, setExpandedDrill] = useState<string | null>(null);

    // Timer state
    const [timerIsActive, setTimerIsActive] = useState(false);
    const [timerDuration, setTimerDuration] = useState(300); // default 5m
    const [totalDuration, setTotalDuration] = useState(300);
    const [selectedDrill, setSelectedDrill] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Redirect if unauthenticated
    useEffect(() => {
        if (!activeAuthLoading && !activeIsAuthenticated) {
            router.push('/login');
        }
    }, [activeAuthLoading, activeIsAuthenticated, router]);

    // Fetch personal best
    useEffect(() => {
        if (!activeUserId) return;

        const fetchPersonalBest = async () => {
            setLoading(true);
            try {
                const uid = activeUserId;
                if (uid === '00000000-0000-0000-0000-000000000000') {
                    const localPb = localStorage.getItem('dev_training_pb');
                    setPersonalBest(localPb ? parseInt(localPb, 10) : null);
                } else {
                    const { data, error } = await supabase
                        .from('training_game_scores')
                        .select('score')
                        .eq('user_id', uid)
                        .eq('game_type', 'training')
                        .order('score', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        setPersonalBest(data.score);
                    }
                }
            } catch (err) {
                console.error('Error loading training personal best:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPersonalBest();
    }, [activeUserId]);

    // Timer interval loop
    useEffect(() => {
        if (timerIsActive && timerDuration > 0) {
            timerRef.current = setInterval(() => {
                setTimerDuration(prev => prev - 1);
            }, 1000);
        } else if (timerDuration === 0) {
            setTimerIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Log session complete
            logTrainingSession();
            toast.success(`Training complete! Great work.`);
            setSelectedDrill(null);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerIsActive, timerDuration]);

    const logTrainingSession = async () => {
        if (!activeUserId || !selectedDrill) return;
        try {
            if (activeUserId !== '00000000-0000-0000-0000-000000000000') {
                await supabase
                    .from('training_game_scores')
                    .insert({
                        user_id: activeUserId,
                        game_type: 'training',
                        score: Math.round(totalDuration / 60) // log minutes as a score proxy
                    });
                window.dispatchEvent(new CustomEvent('performance_refresh'));
            }
        } catch (e) {
            console.error("Failed to log training completion:", e);
        }
    };

    const startDrillTimer = (drillName: string, durationMinutes: number = 5) => {
        setSelectedDrill(drillName);
        setTotalDuration(durationMinutes * 60);
        setTimerDuration(durationMinutes * 60);
        setExpandedDrill(drillName);
        setTimerIsActive(true);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleTimerPreset = (mins: number) => {
        setTimerIsActive(false);
        setTotalDuration(mins * 60);
        setTimerDuration(mins * 60);
    };

    const adjustTimer = (amountSecs: number) => {
        setTimerIsActive(false);
        setTimerDuration(prev => {
            const next = Math.max(60, prev + amountSecs);
            setTotalDuration(next);
            return next;
        });
    };

    if (activeAuthLoading || (loading && activeUserId)) {
        return (
            <div 
                className="flex items-center justify-center text-foreground w-full"
                style={{ minHeight: '100vh', background: '#09090B' }}
            >
                <Loader2 className="animate-spin text-white/30" size={32} />
            </div>
        );
    }

    if (!activeIsAuthenticated) return null;

    // SVG Circular progress math
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = totalDuration > 0 ? (timerDuration / totalDuration) : 1;
    const strokeDashoffset = circumference - progressPercent * circumference;

    return (
        <div 
            className="text-foreground font-sans flex flex-col justify-start w-full min-h-screen pb-[calc(120px+env(safe-area-inset-bottom))]"
            style={{ background: '#09090B', padding: '32px 24px 140px 24px' }}
        >
            {/* Top Navigation & Header */}
            <div className="max-w-[480px] mx-auto w-full mb-6 flex items-center justify-between border-b border-white/5 pb-4 px-1">
                <Link href="/dashboard" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity text-white">
                    <ArrowLeft size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>
                </Link>
                <BrandLogo textClassName="text-lg font-medium tracking-tight text-white/90 select-none pointer-events-none" />
            </div>

            {/* Segmented Control Selector Tabs */}
            <div className="max-w-[480px] mx-auto w-full mb-8 grid grid-cols-3 p-1 bg-white/[0.03] border border-white/5 rounded-2xl gap-1 shrink-0">
                <button
                    onClick={() => setActiveTab('drills')}
                    className={twMerge(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300",
                        activeTab === 'drills' ? "bg-white text-black font-black" : "text-white/40 hover:text-white/70"
                    )}
                >
                    <BookOpen size={13} />
                    Drills
                </button>
                <button
                    onClick={() => setActiveTab('timer')}
                    className={twMerge(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300",
                        activeTab === 'timer' ? "bg-white text-black font-black" : "text-white/40 hover:text-white/70"
                    )}
                >
                    <Clock size={13} />
                    Timer
                </button>
                <button
                    onClick={() => setActiveTab('game')}
                    className={twMerge(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300",
                        activeTab === 'game' ? "bg-white text-black font-black" : "text-white/40 hover:text-white/70"
                    )}
                >
                    <Gamepad2 size={13} />
                    Game
                </button>
            </div>

            {/* Content view panel */}
            <div className="max-w-[480px] mx-auto w-full flex-1">
                {/* 1. DRILLS TAB */}
                {activeTab === 'drills' && (
                    <div className="space-y-6">
                        {/* Physical Drills */}
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#006747] block mb-3 px-1">Physical Drills</span>
                            <div className="space-y-2.5">
                                {DRILL_CATEGORIES.physical.map(name => {
                                    const details = DRILL_LIBRARY[name];
                                    const isActiveDrill = selectedDrill === name;
                                    const isExpanded = expandedDrill === name || isActiveDrill;
                                    return (
                                        <div 
                                            key={name}
                                            className={twMerge(
                                                "border rounded-2xl p-4 overflow-hidden transition-all duration-300",
                                                isActiveDrill 
                                                    ? "bg-[#1C1C1E]/95 border-[#006747]/60 ring-1 ring-[#006747]/30 shadow-lg shadow-[#006747]/5" 
                                                    : "bg-[#1C1C1E] border-white/5"
                                            )}
                                        >
                                            <div 
                                                onClick={() => setExpandedDrill(isExpanded ? null : name)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">{name}</h4>
                                                {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                                            </div>
                                            {isExpanded && details && (
                                                <div className="mt-4 pt-3 border-t border-white/5 space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#006747] block mb-1">Key Steps</span>
                                                        <ol className="list-decimal pl-4 space-y-1 text-xs text-white/70 font-medium">
                                                            {details.steps.map((step, i) => <li key={i}>{step}</li>)}
                                                        </ol>
                                                    </div>
                                                    {details.points.length > 0 && (
                                                        <div>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-1">Coaching Points</span>
                                                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-white/50 font-medium">
                                                                {details.points.map((pt, i) => <li key={i}>{pt}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {isActiveDrill ? (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-4 flex flex-col sm:flex-row items-center justify-center"
                                                        >
                                                            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                                                <svg className="w-28 h-28 -rotate-90">
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-white/5" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                    />
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-[#006747] transition-all duration-300" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                        strokeDasharray={2 * Math.PI * 44}
                                                                        strokeDashoffset={2 * Math.PI * 44 - (timerDuration / totalDuration) * 2 * Math.PI * 44}
                                                                        strokeLinecap="round"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className="text-xl font-black font-mono tracking-tight text-white">{formatTime(timerDuration)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[120px]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(!timerIsActive);
                                                                    }}
                                                                    className="w-full py-2.5 bg-white text-black hover:bg-neutral-200 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    {timerIsActive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                                                    {timerIsActive ? 'Pause' : 'Resume'}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(false);
                                                                        setTimerDuration(totalDuration);
                                                                    }}
                                                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    <RotateCcw size={12} />
                                                                    Reset
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(false);
                                                                        setSelectedDrill(null);
                                                                        setTotalDuration(300);
                                                                        setTimerDuration(300);
                                                                    }}
                                                                    className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    Done
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startDrillTimer(name, details.duration || 5);
                                                            }}
                                                            className="w-full py-3 bg-[#006747] hover:bg-[#006747]/80 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Start {details.duration || 5}m Timer
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mental Drills */}
                        <div className="pt-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#006747] block mb-3 px-1">Mental & Breathwork</span>
                            <div className="space-y-2.5">
                                {DRILL_CATEGORIES.mental.map(name => {
                                    const details = DRILL_LIBRARY[name];
                                    const isActiveDrill = selectedDrill === name;
                                    const isExpanded = expandedDrill === name || isActiveDrill;
                                    return (
                                        <div 
                                            key={name}
                                            className={twMerge(
                                                "border rounded-2xl p-4 overflow-hidden transition-all duration-300",
                                                isActiveDrill 
                                                    ? "bg-[#1C1C1E]/95 border-[#006747]/60 ring-1 ring-[#006747]/30 shadow-lg shadow-[#006747]/5" 
                                                    : "bg-[#1C1C1E] border-white/5"
                                            )}
                                        >
                                            <div 
                                                onClick={() => setExpandedDrill(isExpanded ? null : name)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">{name}</h4>
                                                {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                                            </div>
                                            {isExpanded && details && (
                                                <div className="mt-4 pt-3 border-t border-white/5 space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#006747] block mb-1">Key Steps</span>
                                                        <ol className="list-decimal pl-4 space-y-1 text-xs text-white/70 font-medium">
                                                            {details.steps.map((step, i) => <li key={i}>{step}</li>)}
                                                        </ol>
                                                    </div>
                                                    {details.points.length > 0 && (
                                                        <div>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-1">Key Points</span>
                                                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-white/50 font-medium">
                                                                {details.points.map((pt, i) => <li key={i}>{pt}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {isActiveDrill ? (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-4 flex flex-col sm:flex-row items-center justify-center"
                                                        >
                                                            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                                                <svg className="w-28 h-28 -rotate-90">
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-white/5" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                    />
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-[#006747] transition-all duration-300" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                        strokeDasharray={2 * Math.PI * 44}
                                                                        strokeDashoffset={2 * Math.PI * 44 - (timerDuration / totalDuration) * 2 * Math.PI * 44}
                                                                        strokeLinecap="round"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className="text-xl font-black font-mono tracking-tight text-white">{formatTime(timerDuration)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[120px]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(!timerIsActive);
                                                                    }}
                                                                    className="w-full py-2.5 bg-white text-black hover:bg-neutral-200 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    {timerIsActive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                                                    {timerIsActive ? 'Pause' : 'Resume'}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(false);
                                                                        setTimerDuration(totalDuration);
                                                                    }}
                                                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    <RotateCcw size={12} />
                                                                    Reset
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(false);
                                                                        setSelectedDrill(null);
                                                                        setTotalDuration(300);
                                                                        setTimerDuration(300);
                                                                    }}
                                                                    className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    Done
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startDrillTimer(name, details.duration || 5);
                                                            }}
                                                            className="w-full py-3 bg-[#006747] hover:bg-[#006747]/80 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Start {details.duration || 5}m Timer
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Video Review */}
                        <div className="pt-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#006747] block mb-3 px-1">Video Review</span>
                            <div className="space-y-2.5">
                                {DRILL_CATEGORIES.video.map(name => {
                                    const details = DRILL_LIBRARY[name];
                                    const isActiveDrill = selectedDrill === name;
                                    const isExpanded = expandedDrill === name || isActiveDrill;
                                    return (
                                        <div 
                                            key={name}
                                            className={twMerge(
                                                "border rounded-2xl p-4 overflow-hidden transition-all duration-300",
                                                isActiveDrill 
                                                    ? "bg-[#1C1C1E]/95 border-[#006747]/60 ring-1 ring-[#006747]/30 shadow-lg shadow-[#006747]/5" 
                                                    : "bg-[#1C1C1E] border-white/5"
                                            )}
                                        >
                                            <div 
                                                onClick={() => setExpandedDrill(isExpanded ? null : name)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">{name}</h4>
                                                {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                                            </div>
                                            {isExpanded && details && (
                                                <div className="mt-4 pt-3 border-t border-white/5 space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#006747] block mb-1">Key Steps</span>
                                                        <ol className="list-decimal pl-4 space-y-1 text-xs text-white/70 font-medium">
                                                            {details.steps.map((step, i) => <li key={i}>{step}</li>)}
                                                        </ol>
                                                    </div>
                                                    {details.points.length > 0 && (
                                                        <div>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-1">Focus Points</span>
                                                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-white/50 font-medium">
                                                                {details.points.map((pt, i) => <li key={i}>{pt}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {isActiveDrill ? (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-4 flex flex-col sm:flex-row items-center justify-center"
                                                        >
                                                            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                                                <svg className="w-28 h-28 -rotate-90">
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-white/5" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                    />
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-[#006747] transition-all duration-300" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                        strokeDasharray={2 * Math.PI * 44}
                                                                        strokeDashoffset={2 * Math.PI * 44 - (timerDuration / totalDuration) * 2 * Math.PI * 44}
                                                                        strokeLinecap="round"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className="text-xl font-black font-mono tracking-tight text-white">{formatTime(timerDuration)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[120px]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(!timerIsActive);
                                                                    }}
                                                                    className="w-full py-2.5 bg-white text-black hover:bg-neutral-200 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    {timerIsActive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                                                    {timerIsActive ? 'Pause' : 'Resume'}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(false);
                                                                        setTimerDuration(totalDuration);
                                                                    }}
                                                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    <RotateCcw size={12} />
                                                                    Reset
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(false);
                                                                        setSelectedDrill(null);
                                                                        setTotalDuration(300);
                                                                        setTimerDuration(300);
                                                                    }}
                                                                    className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                                >
                                                                    Done
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startDrillTimer(name, details.duration || 10);
                                                            }}
                                                            className="w-full py-3 bg-[#006747] hover:bg-[#006747]/80 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Start {details.duration || 10}m Timer
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. TIMER TAB */}
                {activeTab === 'timer' && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        {/* Circular Progress Ring HUD */}
                        <div className="relative w-56 h-56 flex items-center justify-center mb-8">
                            <svg className="w-56 h-56 -rotate-90">
                                <circle
                                    cx="112" cy="112" r={radius}
                                    className="text-white/5" stroke="currentColor" strokeWidth="6" fill="transparent"
                                />
                                <circle
                                    cx="112" cy="112" r={radius}
                                    className="text-[#006747] transition-all duration-300" stroke="currentColor" strokeWidth="6" fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black font-mono tracking-tight text-white">{formatTime(timerDuration)}</span>
                                {selectedDrill ? (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#006747] mt-2 max-w-[140px] truncate">{selectedDrill}</span>
                                ) : (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-2">No Drill Selected</span>
                                )}
                            </div>
                        </div>

                        {/* Adjust / Preset Buttons */}
                        <div className="w-full max-w-[280px] space-y-4 mb-8">
                            <div className="flex justify-between gap-3">
                                <button
                                    onClick={() => adjustTimer(-60)}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold uppercase tracking-wider rounded-xl"
                                >
                                    - 1 Min
                                </button>
                                <button
                                    onClick={() => adjustTimer(60)}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-bold uppercase tracking-wider rounded-xl"
                                >
                                    + 1 Min
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 5, 10].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => handleTimerPreset(mins)}
                                        className="py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[9px] font-bold rounded-lg"
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Controller buttons */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => {
                                    setTimerIsActive(false);
                                    setTimerDuration(totalDuration);
                                }}
                                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-white"
                                title="Reset"
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button
                                onClick={() => setTimerIsActive(!timerIsActive)}
                                className="w-20 h-20 rounded-full border-2 border-white/15 bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-all shadow-xl"
                            >
                                {timerIsActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                            </button>
                            <button
                                onClick={() => {
                                    setTimerIsActive(false);
                                    setSelectedDrill(null);
                                    setTotalDuration(300);
                                    setTimerDuration(300);
                                }}
                                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-white/50 hover:text-white"
                                title="Clear"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. GAME TAB */}
                {activeTab === 'game' && (
                    <div className="flex justify-center items-center py-4">
                        <RavenGame 
                            userId={activeUserId} 
                            personalBest={personalBest} 
                            onNewPb={(newScore) => setPersonalBest(newScore)} 
                        />
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
}
