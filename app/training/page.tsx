'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Loader2, Play, Pause, RotateCcw, ChevronDown, ChevronUp, BookOpen, Clock, Gamepad2, Dumbbell, Target, Sparkles, CheckCircle2, Flame, Shield, ArrowRight, Activity, Calendar, Trophy, FileText, Edit3, X, Check } from 'lucide-react';
import RavenGame from '@/components/training/RavenGame';
import { DRILL_LIBRARY } from '@/lib/drill-library';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { twMerge } from 'tailwind-merge';
import { useToast } from '@/context/ToastContext';
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LessonsTransparency } from '@/components/goalie/LessonsTransparency';
import { ATHLETE_TRAINING_HISTORY, ATHLETE_PROFILE_METRICS } from '@/lib/athleteTrainingHistory';
import { getCalendarPrivateLessons } from '@/app/training/book/actions';

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
    const [goalieProfileId, setGoalieProfileId] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState(true);
    const [parentGoalies, setParentGoalies] = useState<any[]>([]);

    const validateProfileId = async (id: string | null) => {
        if (!id) return false;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', id)
                .maybeSingle();
            return !error && data !== null;
        } catch (e) {
            console.error("Profile validation failed:", e);
            return false;
        }
    };

    // Resolve goalie child's profiles.id (especially for parent login)
    useEffect(() => {
        if (activeAuthLoading) return;
        if (!activeUserId) {
            setResolvingId(false);
            return;
        }

        const resolveGoalieId = async () => {
            if (activeUserId === '00000000-0000-0000-0000-000000000000') {
                setGoalieProfileId('00000000-0000-0000-0000-000000000000');
                setResolvingId(false);
                return;
            }

            // 1. Goalie login: profiles.id is their own auth ID (activeUserId)
            if (auth.userRole === 'goalie') {
                const isValid = await validateProfileId(activeUserId);
                if (isValid) {
                    setGoalieProfileId(activeUserId);
                } else {
                    console.warn("Active user has no profiles.id record");
                }
                setResolvingId(false);
                return;
            }

            // 2. Parent login: resolve linked goalie's profiles.id (roster_uploads.linked_user_id)
            if (auth.userRole === 'parent' && auth.userEmail) {
                try {
                    // Match guardian_email column intentionally (no loose OR columns matching)
                    const { data: rosters, error } = await supabase
                        .from('roster_uploads')
                        .select('id, linked_user_id, assigned_unique_id, goalie_name')
                        .ilike('guardian_email', auth.userEmail);

                    if (error) {
                        console.error("Error fetching rosters for parent:", error);
                        setResolvingId(false);
                        return;
                    }

                    if (rosters && rosters.length > 0) {
                        // Filter to children that have claimed their card (linked_user_id is not null)
                        const activeRosters = rosters.filter(r => r.linked_user_id);

                        if (activeRosters.length === 0) {
                            setResolvingId(false);
                            return;
                        }

                        const urlParams = new URLSearchParams(window.location.search);
                        const athleteIdParam = urlParams.get('athleteId');

                        let selectedRoster = null;
                        if (athleteIdParam) {
                            // Strictly match within the parent's resolved active children set to enforce parent-child authorization boundary
                            selectedRoster = activeRosters.find(
                                r => r.id === athleteIdParam || 
                                     r.assigned_unique_id === athleteIdParam || 
                                     r.linked_user_id === athleteIdParam
                            ) || null;
                        }

                        if (selectedRoster) {
                            // Validate the resolved id actually maps to a real profile before trusting it
                            const isValid = await validateProfileId(selectedRoster.linked_user_id);
                            if (isValid) {
                                setGoalieProfileId(selectedRoster.linked_user_id);
                            }
                            setResolvingId(false);
                            return;
                        } else {
                            if (activeRosters.length === 1) {
                                // Safe to auto-select single child after validation
                                const singleRoster = activeRosters[0];
                                const isValid = await validateProfileId(singleRoster.linked_user_id);
                                if (isValid) {
                                    setGoalieProfileId(singleRoster.linked_user_id);
                                }
                                setResolvingId(false);
                                return;
                            } else {
                                // Multi-child parent: never auto-select, present child picker
                                setParentGoalies(activeRosters);
                                setResolvingId(false);
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error resolving goalie ID for parent:", e);
                }
            }

            // Fallback to activeUserId
            const isValid = await validateProfileId(activeUserId);
            if (isValid) {
                setGoalieProfileId(activeUserId);
            }
            setResolvingId(false);
        };

        resolveGoalieId();
    }, [activeUserId, activeAuthLoading, auth.userRole, auth.userEmail]);


    // Tabs state: 'regimen' | 'drills' | 'timer' | 'game'
    const [activeTab, setActiveTab] = useState<'regimen' | 'drills' | 'timer' | 'game'>('regimen');
    const [expandedDrill, setExpandedDrill] = useState<string | null>(null);

    // Daily Training Regimen Checklist State
    const [regimenChecklist, setRegimenChecklist] = useState<{ [key: string]: boolean }>({
        mobility: false,
        reaction: false,
        strength: false,
        reflection: false
    });

    const toggleRegimenItem = (key: string) => {
        setRegimenChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const completedRegimenItems = Object.values(regimenChecklist).filter(Boolean).length;
    const totalRegimenItems = Object.keys(regimenChecklist).length;
    const regimenProgressPercent = Math.round((completedRegimenItems / totalRegimenItems) * 100);

    // Season Contract & Goalie Commitment State
    const [contractModalOpen, setContractModalOpen] = useState(false);
    const [seasonContract, setSeasonContract] = useState<{
        season: string;
        team: string;
        level: string;
        primaryGoal: string;
        technicalGoal: string;
        recoveryGoal: string;
        signedDate: string;
        signedBy: string;
    }>({
        season: "2026–2027 Season",
        team: "Atlanta Gladiators / Prep",
        level: "College / Semi-Pro",
        primaryGoal: "Dominate crease depth and hold edges on low-angle releases.",
        technicalGoal: "Arrive set before shot release with zero wasted slide motion.",
        recoveryGoal: "Daily 90/90 hip capsule flow & active tissue recovery.",
        signedDate: "Sep 12, 2026",
        signedBy: "Goalie"
    });
    const [editForm, setEditForm] = useState(seasonContract);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('goalie_season_contract');
            if (saved) {
                const parsed = JSON.parse(saved);
                setSeasonContract(parsed);
                setEditForm(parsed);
            }
        } catch (e) {
            console.error("Error loading season contract:", e);
        }
    }, []);

    const updateContractField = (field: keyof typeof seasonContract, value: string) => {
        setSeasonContract(prev => {
            const next = { ...prev, [field]: value };
            try {
                localStorage.setItem('goalie_season_contract', JSON.stringify(next));
            } catch (e) {
                console.error("Error saving contract field:", e);
            }
            return next;
        });
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveContract = (e: React.FormEvent) => {
        e.preventDefault();
        setSeasonContract(editForm);
        try {
            localStorage.setItem('goalie_season_contract', JSON.stringify(editForm));
            toast.success("Season Contract & Goals saved.");
        } catch (e) {
            console.error("Error saving contract:", e);
        }
        setContractModalOpen(false);
    };

    // Schedule Context & Training Memory State (Calendar <-> Training intelligence)
    const [scheduleAwareness, setScheduleAwareness] = useState<{
        todayKey: string;
        todayFormatted: string;
        hasGameToday: boolean;
        gameTitle?: string;
        hasPracticeToday: boolean;
        lessonsCountToday: number;
        lessonSummary?: string;
        weeklyIntention: string;
        lastWorkout: {
            date: string;
            title: string;
            strengthSummary?: string;
            cues?: string[];
            reflection?: string;
        };
        adaptivePrescription: {
            category: 'game_day' | 'coaching_heavy' | 'overload_day' | 'active_recovery';
            badge: string;
            title: string;
            rationale: string;
            primaryFocus: string;
            recommendedMinutes: number;
            drills: string[];
            cues: string[];
        };
    }>({
        todayKey: "2026-09-12",
        todayFormatted: "Saturday, Sep 12",
        hasGameToday: false,
        hasPracticeToday: false,
        lessonsCountToday: 1,
        lessonSummary: "Coaching Session • 10:30 AM",
        weeklyIntention: "Maintain high hands and explode on bounce shots.",
        lastWorkout: {
            date: "Sep 11, 2026",
            title: "Lower Body Power & Single-Leg Stability",
            strengthSummary: "Trap bar deadlifts (4x5), Bulgarian split squats (3x8/leg), rotational med ball slams",
            cues: ["Sit into edges.", "Arrive set.", "Push the floor away."],
            reflection: "Joints and adductor feeling durable. Explosion off crease reset is sharp."
        },
        adaptivePrescription: {
            category: 'coaching_heavy',
            badge: 'Active Performance & Flush',
            title: 'Crease Movement & Visual Speed',
            rationale: 'You have private coaching lessons on the field/ice today. Keep your nervous system fast and fresh with visual reaction and hip mobility without fatiguing heavy axial loading.',
            primaryFocus: 'Reaction & Crease Movement',
            recommendedMinutes: 25,
            drills: ['Reaction (3 rounds)', '5-Point Arc Shuffles (4 sets x 30s)', '90/90 Hip Flow & Frog Flushes'],
            cues: ['Arrive set before release.', 'Track into the pocket.', 'Soft hands.']
        }
    });

    // Fetch live calendar schedule context & workout memory
    useEffect(() => {
        const loadScheduleAndMemory = async () => {
            try {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, '0');
                const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
                const todayFormatted = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

                // 1. Fetch today's games, practices, private lessons, and intention
                const [{ data: games }, { data: practices }, privateRes, { data: intentionData }] = await Promise.all([
                    supabase.from('games').select('*').eq('scheduled_date', todayKey),
                    supabase.from('practices').select('*').eq('scheduled_date', todayKey),
                    getCalendarPrivateLessons(),
                    supabase.from('weekly_intentions').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
                ]);

                const todayGames = games || [];
                const todayPractices = practices || [];
                const allLessons = privateRes?.success ? (privateRes.sessions || []) : [];
                const todayLessons = allLessons.filter((s: any) => s.date && s.date.startsWith(todayKey));

                const hasGame = todayGames.length > 0;
                const hasPractice = todayPractices.length > 0;
                const lessonCount = todayLessons.length;
                const gameTitle = hasGame ? `${todayGames[0].opponent || 'Game'} (${todayGames[0].scheduled_time?.slice(0, 5) || 'Today'})` : undefined;
                const lessonSummary = lessonCount > 0 ? `${todayLessons[0].athlete_name || 'Lesson'} • ${lessonCount} Session${lessonCount > 1 ? 's' : ''}` : undefined;
                const weeklyIntention = intentionData?.intention_text || "Maintain high hands and explode on bounce shots.";

                // 2. Fetch latest workout from ATHLETE_TRAINING_HISTORY or sessions
                const latestHistory = ATHLETE_TRAINING_HISTORY[ATHLETE_TRAINING_HISTORY.length - 1];
                const lastWorkout = {
                    date: latestHistory ? new Date(latestHistory.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
                    title: latestHistory?.title || "Lower Body Power & Crease Stability",
                    strengthSummary: latestHistory?.strength?.join(', ') || "Trap bar deadlifts, split squats, core stabilization",
                    cues: latestHistory?.cues || ATHLETE_PROFILE_METRICS.currentCues.slice(0, 3),
                    reflection: latestHistory?.notes || "Movement quality and hip adductor durability feeling solid."
                };

                // 3. Compute dynamic intelligent recommendation
                let category: 'game_day' | 'coaching_heavy' | 'overload_day' | 'active_recovery' = 'overload_day';
                let badge = 'Strength & Crease Power';
                let title = 'Power Output & Crease Speed';
                let rationale = 'Open training day with no taxing game collisions. Optimal window for Pillar 1 Strength loading and explosive Pillar 2 crease footwork.';
                let primaryFocus = 'Strength & Crease Footwork';
                let recommendedMinutes = 45;
                let drills = ['Trap Bar Jumps (4 sets x 5 reps)', 'Bulgarian Split Squats (3 sets x 8 reps/leg)', '5-Point Arc Shuffles (5 sets x 30s)', 'Reaction (3 rounds)'];
                let cues = ['Sit into edges.', 'Push the floor away.', 'Arrive set.'];

                if (hasGame) {
                    category = 'game_day';
                    badge = 'Game Day Priming';
                    title = 'Neuro-Visual Speed & Hip Primer';
                    rationale = `Game scheduled today against ${gameTitle}. Zero heavy axial loading to keep fast-twitch snap fresh. Focus strictly on visual reaction, hip/groin flow, and 4-4-4-4 box breathing.`;
                    primaryFocus = 'Reaction & Recovery';
                    recommendedMinutes = 20;
                    drills = ['Reaction (3 rounds)', '2-Ball Wall Ball Switches (50 catches)', '90/90 Hip Flow & Frog Flushes', 'Box Breathing Reset'];
                    cues = ['Track ball into the pocket.', 'Soft hands.', 'Stay square to release channel.'];
                } else if (lessonCount >= 2 || (lessonCount === 1 && hasPractice)) {
                    category = 'coaching_heavy';
                    badge = 'Active Movement & Flush';
                    title = 'Crease Movement & Visual Speed';
                    rationale = `You have ${lessonCount} coaching session(s) and on-field duties today. Protect your hips and lower back with high-frequency reaction drills and mobility flushes.`;
                    primaryFocus = 'Crease Movement & Reaction';
                    recommendedMinutes = 25;
                    drills = ['Reaction (3 rounds)', '5-Point Arc Shuffles (4 sets x 30s)', '90/90 Hip Flow', 'Rotational Med Ball Slams (4x6)'];
                    cues = ['Arrive set.', 'No false steps.', 'Stick into edges.'];
                }

                setScheduleAwareness({
                    todayKey,
                    todayFormatted,
                    hasGameToday: hasGame,
                    gameTitle,
                    hasPracticeToday: hasPractice,
                    lessonsCountToday: lessonCount,
                    lessonSummary,
                    weeklyIntention,
                    lastWorkout,
                    adaptivePrescription: {
                        category,
                        badge,
                        title,
                        rationale,
                        primaryFocus,
                        recommendedMinutes,
                        drills,
                        cues
                    }
                });
            } catch (err) {
                console.error("Error loading schedule context:", err);
            }
        };

        loadScheduleAndMemory();
    }, [activeUserId]);

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

    if (activeAuthLoading || resolvingId || (loading && activeUserId)) {
        return (
            <div 
                className="flex items-center justify-center text-foreground w-full bg-background"
                style={{ minHeight: '100vh' }}
            >
                <Loader2 className="animate-spin text-muted-foreground" size={32} />
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
            className="text-foreground font-sans flex flex-col justify-start w-full min-h-screen pb-[calc(120px+env(safe-area-inset-bottom))] bg-background"
            style={{ padding: '32px 24px 140px 24px' }}
        >
            {/* Top Navigation & Header */}
            <div className="max-w-xl md:max-w-[860px] lg:max-w-5xl xl:max-w-7xl mx-auto w-full mb-6 flex items-center justify-between border-b border-border pb-4 px-1">
                <Link href="/dashboard" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity text-foreground">
                    <ArrowLeft size={16} />
                    <span className="text-xs font-bold  tracking-wider">Dashboard</span>
                </Link>
                <BrandLogo textClassName="text-lg font-medium tracking-tight text-foreground select-none pointer-events-none" />
            </div>

            {/* Lessons Transparency View / Goalie Selector */}
            <div className="max-w-xl md:max-w-[860px] lg:max-w-5xl xl:max-w-7xl mx-auto w-full mb-6 no-print">
                {goalieProfileId ? (
                    <LessonsTransparency goalieProfileId={goalieProfileId} />
                ) : parentGoalies.length > 0 ? (
                    <div className="w-full bg-card border border-border rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div>
                            <span className="text-[9px] font-bold  tracking-[0.2em] text-foreground block mb-1">
                                Goalie Card
                            </span>
                            <h3 className="text-lg font-bold text-foreground tracking-tight leading-none">
                                Select Goalie
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            Please select an athlete to view their private training lessons:
                        </p>
                        <div className="grid grid-cols-1 gap-2.5 pt-2">
                            {parentGoalies.map((roster) => (
                                <button
                                    key={roster.id}
                                    onClick={async () => {
                                        setResolvingId(true);
                                        const isValid = await validateProfileId(roster.linked_user_id);
                                        if (isValid) {
                                            setGoalieProfileId(roster.linked_user_id);
                                        } else {
                                            toast.error("Selected goalie profile is not active yet.");
                                        }
                                        setResolvingId(false);
                                    }}
                                    className="w-full text-left p-4 bg-muted border border-border hover:border-border hover:border-foreground/40 hover:bg-foreground/5 rounded-2xl transition-all font-bold text-sm text-foreground flex items-center justify-between group cursor-pointer"
                                >
                                    <span>{roster.goalie_name}</span>
                                    <span className="text-[9px] font-bold  tracking-wider bg-muted border border-border text-muted-foreground px-2.5 py-1.5 rounded-xl group-hover:bg-foreground group-hover:text-background group-hover:text-foreground transition-all font-sans">
                                        View Lessons
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
                        <span className="text-[9px] font-bold  tracking-[0.2em] text-foreground block mb-1">
                            Private Training
                        </span>
                        <h4 className="text-sm font-bold text-foreground  tracking-wider mb-2">
                            No Active Lessons
                        </h4>
                        <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                            No active athlete profile was found linked to your account.
                        </p>
                    </div>
                )}
            </div>

            {/* Segmented Control Selector Tabs */}
            <div className="max-w-xl md:max-w-[860px] lg:max-w-5xl xl:max-w-7xl mx-auto w-full mb-8 grid grid-cols-2 sm:grid-cols-4 p-1 bg-muted border border-border rounded-2xl gap-1 shrink-0">
                <button
                    onClick={() => setActiveTab('regimen')}
                    className={twMerge(
                        "py-3 rounded-xl text-[10px] font-bold tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300",
                        activeTab === 'regimen' ? "bg-background text-foreground font-black shadow-sm text-[#00E676]" : "text-muted-foreground hover:text-foreground/70"
                    )}
                >
                    <Dumbbell size={13} className={activeTab === 'regimen' ? "text-[#00E676]" : ""} />
                    Regimen & Plan
                </button>
                <button
                    onClick={() => setActiveTab('drills')}
                    className={twMerge(
                        "py-3 rounded-xl text-[10px] font-bold tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300",
                        activeTab === 'drills' ? "bg-background text-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground/70"
                    )}
                >
                    <BookOpen size={13} />
                    Drill Library
                </button>
                <button
                    onClick={() => setActiveTab('timer')}
                    className={twMerge(
                        "py-3 rounded-xl text-[10px] font-bold tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300",
                        activeTab === 'timer' ? "bg-background text-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground/70"
                    )}
                >
                    <Clock size={13} />
                    Timer
                </button>
                <button
                    onClick={() => setActiveTab('game')}
                    className={twMerge(
                        "py-3 rounded-xl text-[10px] font-bold tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300",
                        activeTab === 'game' ? "bg-background text-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground/70"
                    )}
                >
                    <Gamepad2 size={13} />
                    Reaction
                </button>
            </div>

            {/* Content view panel */}
            <div className="max-w-xl md:max-w-[860px] lg:max-w-5xl xl:max-w-7xl mx-auto w-full flex-1">
                {/* 0. Regimen & Plan TAB */}
                {activeTab === 'regimen' && (
                    <div className="space-y-6">
                        {/* 1. Schedule <-> Training Intelligent Prescription Card */}
                        <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-sm space-y-4">
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 85% 15%, rgba(0,230,118,0.12), transparent 60%)', pointerEvents: 'none', borderRadius: '24px' }}></div>
                            
                            <div className="relative z-10 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#00E676]">
                                            Calendar Connected • {scheduleAwareness.todayFormatted}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground">
                                        {scheduleAwareness.hasGameToday ? (
                                            <span className="text-amber-300 font-black">⚔️ Game Day ({scheduleAwareness.gameTitle})</span>
                                        ) : scheduleAwareness.lessonsCountToday > 0 ? (
                                            <span className="text-emerald-300 font-black">🥅 {scheduleAwareness.lessonsCountToday} Coaching Session Today</span>
                                        ) : (
                                            <span>🏋️ Open Training Window</span>
                                        )}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#00E676] text-black rounded-md">
                                            {scheduleAwareness.adaptivePrescription.badge}
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-black text-foreground m-0 tracking-tight">
                                            {scheduleAwareness.adaptivePrescription.title}
                                        </h2>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-3xl pt-1 m-0">
                                        {scheduleAwareness.adaptivePrescription.rationale}
                                    </p>
                                </div>

                                {/* Today's Prescribed Drills */}
                                <div className="bg-muted/40 border border-border/60 rounded-2xl p-3.5 space-y-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-foreground/70 block">
                                        Today's Prescribed Focus ({scheduleAwareness.adaptivePrescription.recommendedMinutes} Min)
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {scheduleAwareness.adaptivePrescription.drills.map((drill, idx) => (
                                            <div key={idx} className="p-2.5 bg-card border border-border/70 rounded-xl text-xs font-semibold text-foreground flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] shrink-0" />
                                                <span className="truncate">{drill}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <button
                                        onClick={() => router.push('/calendar')}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                                    >
                                        <Calendar size={13} />
                                        <span>Log to Calendar</span>
                                        <ArrowRight size={12} />
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('game')}
                                        className="flex items-center gap-2 px-3.5 py-2 bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                                    >
                                        <Gamepad2 size={13} className="text-cyan-400" />
                                        <span>Reaction</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('timer')}
                                        className="flex items-center gap-2 px-3.5 py-2 bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                                    >
                                        <Clock size={13} className="text-amber-400" />
                                        <span>Timer</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Season Contract & Goalie Commitment Card */}
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <Trophy size={16} className="text-[#00E676]" />
                                    <h3 className="text-sm font-bold text-foreground m-0 uppercase tracking-wider">Season Contract & Goals</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditForm(seasonContract);
                                        setContractModalOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                    <Edit3 size={12} />
                                    <span>Edit Contract</span>
                                </button>
                            </div>

                            {/* Adaptive Philosophy Direct Notice */}
                            <div className="p-3.5 bg-muted/40 border border-border/60 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                                <Shield size={16} className="text-[#00E676] shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-foreground m-0">We train with your season, not against it.</p>
                                    <p className="m-0 mt-0.5 text-[11px]">
                                        If you miss a day, have an overtime game, or need rest, your plan automatically adapts without penalties or broken streaks. You set the goals; the system supports you.
                                    </p>
                                </div>
                            </div>

                            {/* Team & Level Badges + Season Goals (Direct Inline Inputs) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-muted/40 border border-border/60 hover:border-border rounded-2xl space-y-1 transition-colors">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Team</label>
                                    <input
                                        type="text"
                                        value={seasonContract.team}
                                        onChange={(e) => updateContractField('team', e.target.value)}
                                        placeholder="Type your team..."
                                        className="w-full bg-transparent font-bold text-foreground text-xs focus:outline-none focus:text-[#00E676] placeholder:text-muted-foreground/40 border-b border-transparent focus:border-[#00E676] transition-colors py-0.5"
                                    />
                                </div>
                                <div className="p-3 bg-muted/40 border border-border/60 hover:border-border rounded-2xl space-y-1 transition-colors">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Level</label>
                                    <input
                                        type="text"
                                        value={seasonContract.level}
                                        onChange={(e) => updateContractField('level', e.target.value)}
                                        placeholder="Type your level (e.g. College / Varsity)..."
                                        className="w-full bg-transparent font-bold text-foreground text-xs focus:outline-none focus:text-[#00E676] placeholder:text-muted-foreground/40 border-b border-transparent focus:border-[#00E676] transition-colors py-0.5"
                                    />
                                </div>
                                <div className="p-3 bg-muted/40 border border-border/60 hover:border-border rounded-2xl space-y-1 transition-colors">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Season Term</label>
                                    <input
                                        type="text"
                                        value={seasonContract.season}
                                        onChange={(e) => updateContractField('season', e.target.value)}
                                        placeholder="Type season (e.g. 2026–2027)..."
                                        className="w-full bg-transparent font-bold text-foreground text-xs focus:outline-none focus:text-[#00E676] placeholder:text-muted-foreground/40 border-b border-transparent focus:border-[#00E676] transition-colors py-0.5"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3.5 bg-muted/30 border border-border/50 rounded-2xl space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Primary Season Goal</span>
                                    <p className="font-semibold text-foreground leading-snug m-0">"{seasonContract.primaryGoal}"</p>
                                </div>
                                <div className="p-3.5 bg-muted/30 border border-border/50 rounded-2xl space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Technical Focus</span>
                                    <p className="font-semibold text-foreground leading-snug m-0">"{seasonContract.technicalGoal}"</p>
                                </div>
                                <div className="p-3.5 bg-muted/30 border border-border/50 rounded-2xl space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Longevity / Recovery</span>
                                    <p className="font-semibold text-foreground leading-snug m-0">"{seasonContract.recoveryGoal}"</p>
                                </div>
                            </div>

                            {/* Goalie Signature Status */}
                            <div className="pt-1 flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-[#00E676]" />
                                    <span className="font-medium">Signed Commitment: <span className="text-foreground font-bold">{seasonContract.signedBy}</span></span>
                                </div>
                                <span className="font-mono text-[11px]">{seasonContract.signedDate}</span>
                            </div>
                        </div>

                        {/* 3. Performance Memory Card */}
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <Activity size={15} className="text-[#00E676]" />
                                    <h3 className="text-sm font-bold text-foreground m-0 uppercase tracking-wider">Performance Memory</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Memory: Weekly Intention */}
                                <div className="p-3.5 bg-muted/40 border border-border/60 rounded-2xl space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Active Intention</span>
                                    <p className="font-bold text-foreground leading-snug m-0">"{scheduleAwareness.weeklyIntention}"</p>
                                </div>

                                {/* Memory: Last Workout */}
                                <div className="p-3.5 bg-muted/40 border border-border/60 rounded-2xl space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Last Session Logged</span>
                                    <p className="font-bold text-foreground leading-snug m-0">{scheduleAwareness.lastWorkout.title}</p>
                                    <p className="text-[10px] text-muted-foreground leading-tight m-0">{scheduleAwareness.lastWorkout.date}</p>
                                </div>

                                {/* Memory: Body Feedback & Readiness */}
                                <div className="p-3.5 bg-muted/40 border border-border/60 rounded-2xl space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Body & Joint Readiness</span>
                                    <p className="font-semibold text-emerald-300 leading-snug m-0">{scheduleAwareness.lastWorkout.reflection}</p>
                                </div>
                            </div>

                            {/* Active Technical Cues */}
                            <div className="pt-1 flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Active Cues:</span>
                                {scheduleAwareness.lastWorkout.cues?.map((cue, idx) => (
                                    <span key={idx} className="text-[10px] font-bold px-2.5 py-1 bg-muted rounded-lg border border-border text-foreground">
                                        {cue}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 4. Daily Goalie Commitment Checklist */}
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-[#00E676]" />
                                    <h3 className="text-base font-bold text-foreground m-0">Daily Commitment</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black font-mono text-[#00E676] bg-[#00E676]/10 px-2.5 py-1 rounded-lg">
                                        {completedRegimenItems} / {totalRegimenItems} Done ({regimenProgressPercent}%)
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#00E676] transition-all duration-500 rounded-full"
                                    style={{ width: `${regimenProgressPercent}%` }}
                                />
                            </div>

                            {/* Checklist items */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {[
                                    {
                                        id: 'mobility',
                                        title: '1. Mobility (10 Min)',
                                        desc: '90/90 hip switches, Cossack squats, groin openers, ankle dorsiflexion.',
                                        icon: '🧘'
                                    },
                                    {
                                        id: 'reaction',
                                        title: '2. Reaction (15 Min)',
                                        desc: 'Visual reaction drills, 2-ball wall ball, numbered tennis ball drops.',
                                        icon: '🎯'
                                    },
                                    {
                                        id: 'strength',
                                        title: '3. Strength & Crease (45 Min)',
                                        desc: 'Trap bar jumps, split squats, rotational med ball slams, 5-point arc pushes.',
                                        icon: '🏋️'
                                    },
                                    {
                                        id: 'reflection',
                                        title: '4. Reflection (5 Min)',
                                        desc: 'Log sets, reps, load, and focal cues directly on your Goalie Card schedule.',
                                        icon: '📝'
                                    }
                                ].map((item) => {
                                    const isChecked = !!regimenChecklist[item.id];
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleRegimenItem(item.id)}
                                            className={twMerge(
                                                "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                                                isChecked 
                                                    ? "bg-[#00E676]/10 border-[#00E676]/50 shadow-xs" 
                                                    : "bg-muted/40 hover:bg-muted/70 border-border hover:border-border/80"
                                            )}
                                        >
                                            <div className={twMerge(
                                                "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                isChecked ? "bg-[#00E676] border-[#00E676] text-black" : "border-muted-foreground/40 bg-card"
                                            )}>
                                                {isChecked && <CheckCircle2 size={13} className="stroke-[3]" />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className={twMerge(
                                                    "text-xs font-bold leading-tight transition-colors",
                                                    isChecked ? "text-foreground line-through opacity-80" : "text-foreground"
                                                )}>
                                                    {item.title}
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed m-0">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 5. The 4 Pillars (Clean Titles) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-foreground m-0">The 4 Pillars</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Pillar 1 */}
                                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-md">
                                            1. Strength
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground">3x / Week</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground m-0">Power, Single-Leg & Core</h4>
                                    <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 border border-border/50 text-xs">
                                        <p className="font-semibold text-foreground m-0">• Trap Bar Deadlift / Jump Shrugs: <span className="text-muted-foreground font-normal">4 sets x 5 reps (Explosive)</span></p>
                                        <p className="font-semibold text-foreground m-0">• Bulgarian Split Squats: <span className="text-muted-foreground font-normal">3 sets x 8 reps/leg</span></p>
                                        <p className="font-semibold text-foreground m-0">• Rotational Med Ball Slams: <span className="text-muted-foreground font-normal">4 sets x 6 reps/side</span></p>
                                        <p className="font-semibold text-foreground m-0">• Pallof Holds & Deadbugs: <span className="text-muted-foreground font-normal">3 sets x 30s</span></p>
                                    </div>
                                </div>

                                {/* Pillar 2 */}
                                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-md">
                                            2. Movement
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground">4x / Week</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground m-0">Crease Footwork & Angles</h4>
                                    <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 border border-border/50 text-xs">
                                        <p className="font-semibold text-foreground m-0">• 5-Point Arc Shuffles: <span className="text-muted-foreground font-normal">5 sets x 30s</span></p>
                                        <p className="font-semibold text-foreground m-0">• Drop Steps (Stick & Off-Stick): <span className="text-muted-foreground font-normal">4 sets x 10 reps</span></p>
                                        <p className="font-semibold text-foreground m-0">• Pipe-to-Pipe Resets: <span className="text-muted-foreground font-normal">6 sets x 4 reps</span></p>
                                        <p className="font-semibold text-foreground m-0">• Low Bounce Explosion: <span className="text-muted-foreground font-normal">4 sets x 8 reps</span></p>
                                    </div>
                                </div>

                                {/* Pillar 3 */}
                                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-md">
                                            3. Reaction
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground">Daily / 15m</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground m-0">Visual Tracking & Hand-Eye</h4>
                                    <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 border border-border/50 text-xs">
                                        <p className="font-semibold text-foreground m-0">• Reaction Drill: <span className="text-muted-foreground font-normal">3 rounds</span></p>
                                        <p className="font-semibold text-foreground m-0">• 2-Ball Wall Ball Switches: <span className="text-muted-foreground font-normal">3 sets x 50 catches</span></p>
                                        <p className="font-semibold text-foreground m-0">• Numbered Tennis Ball Drops: <span className="text-muted-foreground font-normal">4 sets x 10 drops</span></p>
                                        <p className="font-semibold text-foreground m-0">• Juggling & Tracking: <span className="text-muted-foreground font-normal">5 min activation</span></p>
                                    </div>
                                </div>

                                {/* Pillar 4 */}
                                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-md">
                                            4. Recovery
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground">Daily</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground m-0">Hips, Mindset & Longevity</h4>
                                    <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 border border-border/50 text-xs">
                                        <p className="font-semibold text-foreground m-0">• 90/90 Hip Flow & Frog Stretch: <span className="text-muted-foreground font-normal">10 min post-work</span></p>
                                        <p className="font-semibold text-foreground m-0">• Ankle Dorsiflexion & Tibialis: <span className="text-muted-foreground font-normal">3 sets x 15 reps</span></p>
                                        <p className="font-semibold text-foreground m-0">• 4-4-4-4 Box Breathing: <span className="text-muted-foreground font-normal">5 min pre/post work</span></p>
                                        <p className="font-semibold text-foreground m-0">• Clutch Save Visualization: <span className="text-muted-foreground font-normal">Rehearse step-downs</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 1. Drills TAB */}
                {activeTab === 'drills' && (
                    <div className="space-y-6">
                        {/* Physical Drills */}
                        <div>
                            <span className="text-[9px] font-bold  tracking-[0.2em] text-foreground block mb-3 px-1">Physical Drills</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                                    ? "bg-card/95 border-foreground/30 ring-1 ring-foreground/10 shadow-lg shadow-foreground/5" 
                                                    : "bg-card border-border"
                                            )}
                                        >
                                            <div 
                                                onClick={() => setExpandedDrill(isExpanded ? null : name)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <h4 className="text-xs font-bold  tracking-wider text-foreground">{name}</h4>
                                                {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                                            </div>
                                            {isExpanded && details && (
                                                <div className="mt-4 pt-3 border-t border-border space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-bold  tracking-widest text-foreground block mb-1">Key Steps</span>
                                                        <ol className="list-decimal pl-4 space-y-1 text-xs text-foreground/70 font-medium">
                                                            {details.steps.map((step, i) => <li key={i}>{step}</li>)}
                                                        </ol>
                                                    </div>
                                                    {details.points.length > 0 && (
                                                        <div>
                                                            <span className="text-[8px] font-bold  tracking-widest text-muted-foreground block mb-1">Coaching Points</span>
                                                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-foreground/50 font-medium">
                                                                {details.points.map((pt, i) => <li key={i}>{pt}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {isActiveDrill ? (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-4 bg-muted/50 border border-border rounded-2xl p-4 gap-4 flex flex-col sm:flex-row items-center justify-center"
                                                        >
                                                            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                                                <svg className="w-28 h-28 -rotate-90">
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-foreground/5" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                    />
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-foreground transition-all duration-300" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                        strokeDasharray={2 * Math.PI * 44}
                                                                        strokeDashoffset={2 * Math.PI * 44 - (timerDuration / totalDuration) * 2 * Math.PI * 44}
                                                                        strokeLinecap="round"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className="text-xl font-bold font-mono tracking-tight text-foreground">{formatTime(timerDuration)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[120px]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(!timerIsActive);
                                                                    }}
                                                                    className="w-full py-2.5 bg-foreground text-background hover:bg-neutral-200 transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                                    className="w-full py-2.5 bg-muted hover:bg-muted-foreground/20 text-foreground border border-border transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                                    className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                            className="w-full py-3 bg-foreground text-background hover:bg-foreground text-background/80 text-foreground rounded-xl text-[10px] font-bold  tracking-widest transition-all"
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
                            <span className="text-[9px] font-bold  tracking-[0.2em] text-foreground block mb-3 px-1">Mental & Breathwork</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                                    ? "bg-card/95 border-foreground/30 ring-1 ring-foreground/10 shadow-lg shadow-foreground/5" 
                                                    : "bg-card border-border"
                                            )}
                                        >
                                            <div 
                                                onClick={() => setExpandedDrill(isExpanded ? null : name)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <h4 className="text-xs font-bold  tracking-wider text-foreground">{name}</h4>
                                                {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                                            </div>
                                            {isExpanded && details && (
                                                <div className="mt-4 pt-3 border-t border-border space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-bold  tracking-widest text-foreground block mb-1">Key Steps</span>
                                                        <ol className="list-decimal pl-4 space-y-1 text-xs text-foreground/70 font-medium">
                                                            {details.steps.map((step, i) => <li key={i}>{step}</li>)}
                                                        </ol>
                                                    </div>
                                                    {details.points.length > 0 && (
                                                        <div>
                                                            <span className="text-[8px] font-bold  tracking-widest text-muted-foreground block mb-1">Key Points</span>
                                                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-foreground/50 font-medium">
                                                                {details.points.map((pt, i) => <li key={i}>{pt}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {isActiveDrill ? (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-4 bg-muted/50 border border-border rounded-2xl p-4 gap-4 flex flex-col sm:flex-row items-center justify-center"
                                                        >
                                                            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                                                <svg className="w-28 h-28 -rotate-90">
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-foreground/5" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                    />
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-foreground transition-all duration-300" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                        strokeDasharray={2 * Math.PI * 44}
                                                                        strokeDashoffset={2 * Math.PI * 44 - (timerDuration / totalDuration) * 2 * Math.PI * 44}
                                                                        strokeLinecap="round"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className="text-xl font-bold font-mono tracking-tight text-foreground">{formatTime(timerDuration)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[120px]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(!timerIsActive);
                                                                    }}
                                                                    className="w-full py-2.5 bg-foreground text-background hover:bg-neutral-200 transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                                    className="w-full py-2.5 bg-muted hover:bg-muted-foreground/20 text-foreground border border-border transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                                    className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                            className="w-full py-3 bg-foreground text-background hover:bg-foreground text-background/80 text-foreground rounded-xl text-[10px] font-bold  tracking-widest transition-all"
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
                            <span className="text-[9px] font-bold  tracking-[0.2em] text-foreground block mb-3 px-1">Video Review</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                                    ? "bg-card/95 border-foreground/30 ring-1 ring-foreground/10 shadow-lg shadow-foreground/5" 
                                                    : "bg-card border-border"
                                            )}
                                        >
                                            <div 
                                                onClick={() => setExpandedDrill(isExpanded ? null : name)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <h4 className="text-xs font-bold  tracking-wider text-foreground">{name}</h4>
                                                {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                                            </div>
                                            {isExpanded && details && (
                                                <div className="mt-4 pt-3 border-t border-border space-y-4">
                                                    <div>
                                                        <span className="text-[8px] font-bold  tracking-widest text-foreground block mb-1">Key Steps</span>
                                                        <ol className="list-decimal pl-4 space-y-1 text-xs text-foreground/70 font-medium">
                                                            {details.steps.map((step, i) => <li key={i}>{step}</li>)}
                                                        </ol>
                                                    </div>
                                                    {details.points.length > 0 && (
                                                        <div>
                                                            <span className="text-[8px] font-bold  tracking-widest text-muted-foreground block mb-1">Focus Points</span>
                                                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-foreground/50 font-medium">
                                                                {details.points.map((pt, i) => <li key={i}>{pt}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {isActiveDrill ? (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-4 bg-muted/50 border border-border rounded-2xl p-4 gap-4 flex flex-col sm:flex-row items-center justify-center"
                                                        >
                                                            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                                                <svg className="w-28 h-28 -rotate-90">
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-foreground/5" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                    />
                                                                    <circle
                                                                        cx="56" cy="56" r="44"
                                                                        className="text-foreground transition-all duration-300" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                        strokeDasharray={2 * Math.PI * 44}
                                                                        strokeDashoffset={2 * Math.PI * 44 - (timerDuration / totalDuration) * 2 * Math.PI * 44}
                                                                        strokeLinecap="round"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className="text-xl font-bold font-mono tracking-tight text-foreground">{formatTime(timerDuration)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[120px]">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTimerIsActive(!timerIsActive);
                                                                    }}
                                                                    className="w-full py-2.5 bg-foreground text-background hover:bg-neutral-200 transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                                    className="w-full py-2.5 bg-muted hover:bg-muted-foreground/20 text-foreground border border-border transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                                    className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all rounded-xl text-[10px] font-bold  tracking-widest flex items-center justify-center gap-1.5"
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
                                                            className="w-full py-3 bg-foreground text-background hover:bg-foreground text-background/80 text-foreground rounded-xl text-[10px] font-bold  tracking-widest transition-all"
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

                {/* 2. Timer TAB */}
                {activeTab === 'timer' && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        {/* Circular Progress Ring HUD */}
                        <div className="relative w-56 h-56 flex items-center justify-center mb-8">
                            <svg className="w-56 h-56 -rotate-90">
                                <circle
                                    cx="112" cy="112" r={radius}
                                    className="text-foreground/5" stroke="currentColor" strokeWidth="6" fill="transparent"
                                />
                                <circle
                                    cx="112" cy="112" r={radius}
                                    className="text-foreground transition-all duration-300" stroke="currentColor" strokeWidth="6" fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold font-mono tracking-tight text-foreground">{formatTime(timerDuration)}</span>
                                {selectedDrill ? (
                                    <span className="text-[9px] font-bold  tracking-widest text-foreground mt-2 max-w-[140px] truncate">{selectedDrill}</span>
                                ) : (
                                    <span className="text-[9px] font-bold  tracking-widest text-muted-foreground mt-2">No Drill Selected</span>
                                )}
                            </div>
                        </div>

                        {/* Adjust / Preset Buttons */}
                        <div className="w-full max-w-[280px] space-y-4 mb-8">
                            <div className="flex justify-between gap-3">
                                <button
                                    onClick={() => adjustTimer(-60)}
                                    className="flex-1 py-2 bg-muted hover:bg-muted-foreground/20 text-foreground border border-border text-[10px] font-bold  tracking-wider rounded-xl"
                                >
                                    - 1 Min
                                </button>
                                <button
                                    onClick={() => adjustTimer(60)}
                                    className="flex-1 py-2 bg-muted hover:bg-muted-foreground/20 text-foreground border border-border text-[10px] font-bold  tracking-wider rounded-xl"
                                >
                                    + 1 Min
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 5, 10].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => handleTimerPreset(mins)}
                                        className="py-1.5 bg-muted hover:bg-muted-foreground/20 text-foreground border border-border text-[9px] font-bold rounded-lg"
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
                                className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground"
                                title="Reset"
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button
                                onClick={() => setTimerIsActive(!timerIsActive)}
                                className="w-20 h-20 rounded-full border-2 border-white/15 bg-foreground text-background flex items-center justify-center hover:bg-neutral-200 transition-all shadow-xl"
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
                                className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground/50 hover:text-foreground"
                                title="Clear"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Game TAB */}
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

            {/* Season Contract & Goals Modal */}
            {contractModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Trophy size={18} className="text-[#00E676]" />
                                <h3 className="text-base font-bold text-foreground m-0">Season Contract & Goals</h3>
                            </div>
                            <button
                                onClick={() => setContractModalOpen(false)}
                                className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveContract} className="space-y-4">
                            {/* Season & Team & Level */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Season</label>
                                    <input
                                        type="text"
                                        value={editForm.season}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, season: e.target.value }))}
                                        placeholder="e.g. 2026–2027"
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-[#00E676]"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Team</label>
                                    <input
                                        type="text"
                                        value={editForm.team}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, team: e.target.value }))}
                                        placeholder="e.g. Varsity / Prep"
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-[#00E676]"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Level</label>
                                    <input
                                        type="text"
                                        value={editForm.level}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, level: e.target.value }))}
                                        placeholder="e.g. College / Committed"
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-[#00E676]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Goals */}
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Primary Season Goal</label>
                                    <input
                                        type="text"
                                        value={editForm.primaryGoal}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, primaryGoal: e.target.value }))}
                                        placeholder="e.g. Dominate crease depth and hold edges on low-angle releases."
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-[#00E676]"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Technical / Movement Focus</label>
                                    <input
                                        type="text"
                                        value={editForm.technicalGoal}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, technicalGoal: e.target.value }))}
                                        placeholder="e.g. Arrive set before shot release with zero wasted slide motion."
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-[#00E676]"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Recovery & Joint Longevity Goal</label>
                                    <input
                                        type="text"
                                        value={editForm.recoveryGoal}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, recoveryGoal: e.target.value }))}
                                        placeholder="e.g. Daily 90/90 hip capsule flow & active tissue recovery."
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-[#00E676]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Goalie Signature */}
                            <div className="space-y-1 pt-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Goalie Signature</label>
                                <input
                                    type="text"
                                    value={editForm.signedBy}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, signedBy: e.target.value }))}
                                    placeholder="Your Full Name"
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-[#00E676]"
                                    required
                                />
                            </div>

                            {/* Commitment Agreement */}
                            <div className="p-3 bg-muted/40 border border-border rounded-xl text-[11px] text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground block mb-0.5">The Goalie Commitment:</span>
                                "I commit to the daily process over outcome. This system trains with my season, not against it. When games or life shift my schedule, the plan adapts with me."
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setContractModalOpen(false)}
                                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <Check size={14} />
                                    <span>Sign & Save Contract</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
}
