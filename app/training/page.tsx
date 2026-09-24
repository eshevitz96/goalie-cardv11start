"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/utils/supabase/client';
import { saveTrainingSession } from '@/app/actions/training';
import { 
    Dumbbell, 
    Calendar as CalendarIcon, 
    Plus, 
    Check, 
    Clock, 
    Shield, 
    CheckCircle2, 
    Send, 
    Trash2,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    X,
    Play,
    MessageSquare,
    History,
    Edit2,
    Sparkles,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompletedSessionInput {
    id: string;
    date: string;
    title: string;
    durationMins: number | '';
    type: 'strength' | 'conditioning' | 'sport' | 'recovery' | 'other';
    routineNotes: string;
    fatigueNotes: string;
}

interface Drill {
    id: string;
    name: string;
    sets: string;
    durationMins: number;
    cue: string;
    completed: boolean;
}

interface ChatThread {
    id: string;
    date: string;
    title: string;
    lastMessage: string;
    updatedAt: string;
    messageCount: number;
}

interface Message {
    id: string;
    sender: 'goalie' | 'goalie_card';
    text: string;
    timestamp: string;
    responseMode?: 'conversation' | 'mission';
    mission?: {
        what: string;
        why: string;
        plan: Array<{
            name: string;
            sets?: string | number | null;
            reps?: string | number | null;
            load?: string | null;
            duration?: string | number | null;
            notes?: string | null;
        }>;
        guardrail: string;
    } | null;
    decisionFactors?: string[];
    actionCard?: {
        type: 'training_session' | 'calendar_event' | 'logged_session' | 'prescribed_protocol' | string;
        title: string;
        data?: any;
    };
    provenance?: {
        mode: 'AI_COACH' | 'DETERMINISTIC_ACTION' | 'OFFLINE_UNAVAILABLE';
        historyThroughDate: string;
        lookaheadSource: string;
        details?: string;
    };
}

export default function TrainingPage() {
    const auth = useAuth();
    const router = useRouter();
    const toast = useToast();

    const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
    const activeUserId = isDevBypass ? "00000000-0000-0000-0000-000000000000" : auth.userId;
    const activeIsAuthenticated = isDevBypass ? true : auth.isAuthenticated;
    const activeAuthLoading = isDevBypass ? false : auth.loading;

    const athleteName = "Elliott Shevitz";
    const todayDateStr = new Date().toISOString().slice(0, 10);

    // Calculate dynamic contract week and day (June 22, 2026 contract start)
    const getContractWeekAndDay = (dateStr: string = todayDateStr) => {
        try {
            const start = new Date('2026-06-22T00:00:00');
            const current = new Date(`${dateStr}T00:00:00`);
            const diffTime = current.getTime() - start.getTime();
            const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
            const weekNum = Math.floor(diffDays / 7) + 1;
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[current.getDay()];
            return `Week ${weekNum}, ${dayName} — Training`;
        } catch (e) {
            return `Week 14 — Training Session`;
        }
    };

    // 3-STEP INTAKE STATE
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // STEP 1: TRAINING INTAKE (Clean & Blank Defaults)
    const [hasTrained, setHasTrained] = useState<boolean | null>(true);
    const [sessionsList, setSessionsList] = useState<CompletedSessionInput[]>([
        {
            id: 'sess-1',
            date: todayDateStr,
            title: getContractWeekAndDay(todayDateStr),
            durationMins: '',
            type: 'strength',
            routineNotes: '',
            fatigueNotes: ''
        }
    ]);

    // STEP 2: BODY READINESS & RECOVERY (Clean Defaults)
    const [groinTightness, setGroinTightness] = useState<number>(1); // 1-5
    const [generalFatigue, setGeneralFatigue] = useState<number>(1); // 1-5
    const [bodyNotes, setBodyNotes] = useState("");
    const [daysUntilGame, setDaysUntilGame] = useState<number | null>(null);
    const [upcomingEventTitle, setUpcomingEventTitle] = useState<string | null>(null);

    // STEP 3: PRESCRIBED DIRECTIVE & DRILLS
    const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
    const [directiveTitle, setDirectiveTitle] = useState("Active Recovery & Preparation Flow");
    const [directiveContext, setDirectiveContext] = useState("Daily training intake & readiness flow.");

    const [whatToDoList, setWhatToDoList] = useState([
        "15-minute hip capsule decompression & 90/90 adductor flow.",
        "10 minutes of visual reaction & hand-eye snap drills.",
        "Hydration and 20-minute post-session walk."
    ]);

    const [whatNotToDoList, setWhatNotToDoList] = useState([
        "No heavy squats, deadlifts, or leg press.",
        "No explosive lateral butterfly pushes with tight adductors.",
        "No excessive fatigue before upcoming performance."
    ]);

    const [drills, setDrills] = useState<Drill[]>([
        {
            id: 'd1',
            name: '90/90 Hip Flow & Capsule Openers',
            sets: '3 sets x 8 switches',
            durationMins: 4,
            cue: 'Keep tall chest, pause 2 seconds in end-range',
            completed: false
        },
        {
            id: 'd2',
            name: 'Cossack Squats & Adductor Flushes',
            sets: '3 sets x 6 reps per leg',
            durationMins: 4,
            cue: 'Keep straight-leg heel planted, sink smoothly into hips',
            completed: false
        },
        {
            id: 'd3',
            name: '2-Ball Wall Reaction & Hand-Eye Snap',
            sets: '3 rounds x 45 seconds',
            durationMins: 4,
            cue: 'Eyes lead the hands, stay set in ready stance',
            completed: false
        },
        {
            id: 'd4',
            name: 'Glute Medius & Piriformis Ball Release',
            sets: '2 minutes per side',
            durationMins: 4,
            cue: 'Find trigger points, deep diaphragmatic breathing',
            completed: false
        }
    ]);

    // Timer State
    const [activeDrillId, setActiveDrillId] = useState<string | null>(null);
    const [timerRemaining, setTimerRemaining] = useState<number>(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Chat Stream & Thread State (Right Column)
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string>(() => `thread-${todayDateStr}-${Date.now().toString().slice(-4)}`);
    const [activeThreadTitle, setActiveThreadTitle] = useState<string>(`Chat • ${todayDateStr}`);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const [showThreadDrawer, setShowThreadDrawer] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'msg-1',
            sender: 'goalie_card',
            text: `Goalie Card active. Let's talk through your training, physical readiness, or game prep. What did you work on today?`,
            timestamp: 'Today'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isSendingChat, setIsSendingChat] = useState(false);
    const [addedToTrainingIds, setAddedToTrainingIds] = useState<Set<string>>(new Set());
    const [addedToCalendarIds, setAddedToCalendarIds] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Load user's chat threads & active thread messages
    const fetchThreadsAndMessages = async () => {
        try {
            const emailParam = encodeURIComponent(auth.userEmail || '');
            const res = await fetch(`/api/goalie-card/chat?userId=${activeUserId || ''}&userEmail=${emailParam}&threads=true`);
            if (res.ok) {
                const data = await res.json();
                if (data.threads && data.threads.length > 0) {
                    setThreads(data.threads);
                }
            }
        } catch (e) {
            console.warn("Failed to load chat threads:", e);
        }
    };

    useEffect(() => {
        fetchThreadsAndMessages();
    }, [activeUserId, auth.userEmail]);

    const handleSelectThread = async (t: ChatThread) => {
        setActiveThreadId(t.id);
        setActiveThreadTitle(t.title);
        setShowThreadDrawer(false);
        try {
            const emailParam = encodeURIComponent(auth.userEmail || '');
            const res = await fetch(`/api/goalie-card/chat?userId=${activeUserId || ''}&userEmail=${emailParam}&threadId=${t.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages);
                }
            }
        } catch (e) {
            toast.error("Failed to load thread.");
        }
    };

    const handleNewThread = () => {
        const newId = `thread-${todayDateStr}-${Date.now().toString().slice(-4)}`;
        const newTitle = `Chat • ${todayDateStr}`;
        setActiveThreadId(newId);
        setActiveThreadTitle(newTitle);
        setMessages([
            {
                id: `msg-${Date.now()}`,
                sender: 'goalie_card',
                text: `New coaching session started. What are we focusing on today?`,
                timestamp: 'Now'
            }
        ]);
        setShowThreadDrawer(false);
        toast.success("Started new conversation.");
    };

    const handleSaveTitle = () => {
        if (titleInput.trim()) {
            setActiveThreadTitle(titleInput.trim());
        }
        setIsEditingTitle(false);
    };

    // Auth redirection guard
    useEffect(() => {
        if (!activeAuthLoading && !activeIsAuthenticated) {
            router.push('/login?redirect=/training');
        }
    }, [activeAuthLoading, activeIsAuthenticated, router]);

    // Live Event Lookahead Fetching (Dynamic & Non-fabricated)
    useEffect(() => {
        async function fetchUpcomingMatch() {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .gte('date', todayDateStr)
                    .order('date', { ascending: true })
                    .limit(1);

                if (!error && data && data.length > 0) {
                    const nextEvt = data[0];
                    setUpcomingEventTitle(nextEvt.name || nextEvt.title || 'Competition');
                    if (nextEvt.date) {
                        const evtDate = new Date(nextEvt.date);
                        const today = new Date(todayDateStr);
                        const diffDays = Math.ceil((evtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays >= 0) {
                            setDaysUntilGame(diffDays);
                        }
                    }
                } else {
                    setDaysUntilGame(null);
                    setUpcomingEventTitle(null);
                }
            } catch (e) {
                setDaysUntilGame(null);
                setUpcomingEventTitle(null);
            }
        }
        fetchUpcomingMatch();
    }, [todayDateStr]);

    // Timer Engine
    useEffect(() => {
        if (timerRunning && timerRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimerRemaining(prev => {
                    if (prev <= 1) {
                        setTimerRunning(false);
                        toast.success(`Interval complete.`);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerRunning, timerRemaining, toast]);

    // Auto-scroll chat feed to bottom on new message or typing state
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSendingChat]);

    const startDrillTimer = (drill: Drill) => {
        setActiveDrillId(drill.id);
        setTimerRemaining(drill.durationMins * 60);
        setTimerRunning(true);
    };

    const toggleDrillCompleted = (drillId: string) => {
        setDrills(prev => prev.map(d => d.id === drillId ? { ...d, completed: !d.completed } : d));
        toast.success("Drill updated.");
    };

    const handleAddSessionRow = () => {
        const newId = `sess-${Date.now()}`;
        setSessionsList(prev => [
            ...prev,
            {
                id: newId,
                date: todayDateStr,
                title: getContractWeekAndDay(todayDateStr),
                durationMins: '',
                type: 'strength',
                routineNotes: '',
                fatigueNotes: ''
            }
        ]);
    };

    const handleRemoveSessionRow = (id: string) => {
        if (sessionsList.length === 1) {
            setHasTrained(false);
            return;
        }
        setSessionsList(prev => prev.filter(s => s.id !== id));
    };

    const handleUpdateSession = (id: string, field: keyof CompletedSessionInput, value: any) => {
        setSessionsList(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleCompleteStep2 = async () => {
        setIsSubmittingCheckin(true);
        try {
            if (hasTrained) {
                for (const sess of sessionsList) {
                    await saveTrainingSession({
                        title: sess.title,
                        sessionType: (['team', 'private', 'wall_ball', 'footwork', 'reaction', 'film', 'coach_mission'].includes(sess.type) ? sess.type : 'other') as any,
                        durationMins: Number(sess.durationMins) || 30,
                        sessionDate: sess.date || todayDateStr,
                        notes: `${sess.routineNotes}\n${sess.fatigueNotes}`,
                        userId: activeUserId,
                        userEmail: auth.userEmail,
                        reflection: {
                            win: 'Logged via Training Check-In',
                            tightness: `${bodyNotes} | Groin Strain Level: ${groinTightness}/5`
                        }
                    });
                }
                toast.success(`Logged ${sessionsList.length} session(s) to Calendar.`);
            }

            if (groinTightness >= 3) {
                setDirectiveTitle("Active Recovery & Adductor Decompression");
                setDirectiveContext(`Game in ${daysUntilGame} days. High adductor strain (${groinTightness}/5) recorded.`);
                setWhatToDoList([
                    "15m Hip capsule flow & 90/90 adductor openers.",
                    "10m Visual reaction & hand-eye snap drills.",
                    "Glute medius and piriformis ball release (4 mins)."
                ]);
                setWhatNotToDoList([
                    "NO heavy axial loaded squats or leg presses.",
                    "NO explosive lateral butterfly slides under fatigue.",
                    "NO extra high-intensity conditioning before Friday."
                ]);
            } else {
                setDirectiveTitle("Pre-Game Priming & Crease Edge Set");
                setDirectiveContext(`Game in ${daysUntilGame} days. Readiness high.`);
                setWhatToDoList([
                    "20m Crease depth and set-before-release arrival drills.",
                    "10m Hand-eye visual tracking.",
                    "Active hip mobility flush."
                ]);
                setWhatNotToDoList([
                    "NO training to failure.",
                    "Keep on-ice contact under 35 minutes."
                ]);
            }

            setCurrentStep(3);

            // Automatically synchronize with Goalie Card AI Stream
            const syncSummary = hasTrained
                ? `Logged completed session(s): ${sessionsList.map(s => `${s.title} (${s.durationMins}m${s.routineNotes ? ` - ${s.routineNotes}` : ''})`).join('; ')}. Physical status: Groin strain level ${groinTightness}/5. Notes: ${bodyNotes || 'Feeling good'}. Adapt my upcoming schedule and game plan.`
                : `Checked in for today: No workout completed yet. Physical status: Groin strain level ${groinTightness}/5. Notes: ${bodyNotes || 'Fresh'}. Prescribe today's focus.`;

            setTimeout(() => {
                handleSendMessage(syncSummary);
            }, 250);
        } catch (err) {
            console.error("Check-in submission error:", err);
            toast.error("Failed to commit training data. Proceeding to plan.");
            setCurrentStep(3);
        } finally {
            setIsSubmittingCheckin(false);
        }
    };

    const handleSendMessage = async (customText?: string) => {
        const query = (customText || inputText).trim();
        if (!query || isSendingChat) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            sender: 'goalie',
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        if (!customText) setInputText('');
        setIsSendingChat(true);

        try {
            const res = await fetch('/api/goalie-card/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userMessage: query,
                    userId: activeUserId,
                    userEmail: auth.userEmail,
                    threadId: activeThreadId,
                    threadTitle: activeThreadTitle,
                    threadDate: todayDateStr,
                    messages
                })
            });

            const data = await res.json();
            const replyMsg: Message = {
                id: `gc-${Date.now()}`,
                sender: 'goalie_card',
                text: data.reply || "Tracking your workload.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                responseMode: data.responseMode,
                mission: data.mission || null,
                decisionFactors: Array.isArray(data.decisionFactors) ? data.decisionFactors : [],
                actionCard: data.actionCard || undefined,
                provenance: data.provenance || undefined
            };

            setMessages(prev => [...prev, replyMsg]);

            if (data.threadTitle && data.threadTitle !== activeThreadTitle) {
                setActiveThreadTitle(data.threadTitle);
            }

            // If training session was recognized in chat, sync draft form
            if (data.actionCard?.type === 'training_session' || data.actionCard?.type === 'logged_session') {
                const cardData = data.actionCard.data || {};
                const cardTitle = cardData.title || getContractWeekAndDay();
                const cardDuration = Number(cardData.duration) || 30;
                const cardType = (cardData.type === 'footwork' ? 'conditioning' : cardData.type === 'reaction' ? 'recovery' : cardData.type || 'strength') as any;
                const cardDetails = cardData.details || '';
                const cardRecovery = cardData.recoveryNotes || '';

                setSessionsList(prev => {
                    if (prev.length === 1 && !prev[0].routineNotes && !prev[0].durationMins) {
                        return [{
                            id: prev[0].id,
                            date: todayDateStr,
                            title: cardTitle,
                            durationMins: cardDuration,
                            type: cardType,
                            routineNotes: cardDetails,
                            fatigueNotes: cardRecovery
                        }];
                    }
                    return [
                        ...prev,
                        {
                            id: `sess-${Date.now()}`,
                            date: todayDateStr,
                            title: cardTitle,
                            durationMins: cardDuration,
                            type: cardType,
                            routineNotes: cardDetails,
                            fatigueNotes: cardRecovery
                        }
                    ];
                });
                setHasTrained(true);
            }

            fetchThreadsAndMessages();

        } catch (err) {
            toast.error("Failed to connect with Goalie Card.");
        } finally {
            setIsSendingChat(false);
        }
    };

    // ACTION: Add to Training
    const handleAddToTraining = async (msg: Message) => {
        if (addedToTrainingIds.has(msg.id)) return;

        try {
            const cardData = msg.actionCard?.data || {};
            const title = cardData.title || msg.actionCard?.title || (msg.mission ? msg.mission.what : "Goalie Training Session");
            const duration = Number(cardData.duration) || 30;
            const type = cardData.type || (msg.mission?.what?.toLowerCase().includes('recovery') ? 'recovery' : msg.mission?.what?.toLowerCase().includes('condition') ? 'conditioning' : 'strength');
            const notes = cardData.details || (msg.mission ? `${msg.mission.what}\n\nPrescribed Plan:\n${msg.mission.plan?.map(p => `- ${p.name}: ${[p.sets ? `${p.sets} sets` : null, p.reps ? `${p.reps}` : null, p.load, p.duration].filter(Boolean).join(', ')}${p.notes ? ` (${p.notes})` : ''}`).join('\n')}\n\nGuardrail: ${msg.mission.guardrail}` : msg.text.slice(0, 200));

            const res = await fetch('/api/goalie-card/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_to_training',
                    userId: activeUserId,
                    userEmail: auth.userEmail,
                    payload: {
                        date: cardData.date || todayDateStr,
                        title,
                        duration,
                        type,
                        notes
                    }
                })
            });

            if (res.ok) {
                setAddedToTrainingIds(prev => new Set(prev).add(msg.id));
                toast.success(`Added "${title}" to Training!`);
                setHasTrained(true);
            } else {
                toast.error("Failed to add to training.");
            }
        } catch (e) {
            console.error("Add to training error:", e);
            toast.error("Failed to add to training.");
        }
    };

    // ACTION: Add to Calendar
    const handleAddToCalendar = async (msg: Message) => {
        if (addedToCalendarIds.has(msg.id)) return;

        try {
            const cardData = msg.actionCard?.data || {};
            const title = cardData.title || msg.actionCard?.title || (msg.mission ? msg.mission.what : "Scheduled Event");
            const date = cardData.date || todayDateStr;
            const time = cardData.time || "TBD";
            const location = cardData.location || "Local Rink / Gym";
            const notes = cardData.details || (msg.mission ? `${msg.mission.what}\n\nPlan:\n${msg.mission.plan?.map(p => `- ${p.name}`).join('\n')}\n\nGuardrail: ${msg.mission.guardrail}` : msg.text.slice(0, 200));

            const res = await fetch('/api/goalie-card/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_to_calendar',
                    userId: activeUserId,
                    userEmail: auth.userEmail,
                    payload: {
                        date,
                        title,
                        time,
                        location,
                        sport: cardData.sport || 'Hockey',
                        notes
                    }
                })
            });

            if (res.ok) {
                setAddedToCalendarIds(prev => new Set(prev).add(msg.id));
                toast.success(`Scheduled "${title}" on your Calendar!`);
            } else {
                toast.error("Failed to add to calendar.");
            }
        } catch (e) {
            console.error("Add to calendar error:", e);
            toast.error("Failed to add to calendar.");
        }
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-background text-foreground font-sans">
            {/* FULL-WIDTH HEADER MATCHING OTHER PAGES */}
            <header className="sticky top-0 z-[1100] w-full bg-background border-b border-border h-auto md:h-20">
                <div className="w-full max-w-[1600px] mx-auto px-4 md:px-16 flex flex-col md:flex-row justify-between items-center h-full py-3 md:py-0 gap-3 md:gap-0">
                    {/* Left: Brand / Title */}
                    <div className="flex items-center justify-between md:justify-start gap-4 md:gap-12 w-full md:w-auto h-full">
                        <div className="flex items-center gap-2 md:gap-4 text-xl md:text-2xl">
                            <Link 
                                href="/dashboard"
                                className="text-foreground tracking-tight font-sans font-bold text-[1.25rem] md:text-[1.4rem] hover:text-foreground/80 transition-colors"
                            >
                                Goalie Card
                            </Link>
                            
                            <span className="text-muted-foreground/30 font-light hidden md:inline">/</span>
                            
                            <span className="text-muted-foreground font-medium tracking-tight font-sans text-[1.3rem] md:text-[1.5rem] hidden md:inline">
                                Training
                            </span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="w-full md:w-auto flex items-center justify-end gap-3">
                        <Link 
                            href="/calendar"
                            className="px-4 py-2 bg-muted border border-border hover:bg-muted/80 font-semibold rounded-xl text-xs md:text-sm text-foreground transition-all flex items-center gap-1.5"
                        >
                            <CalendarIcon size={16} />
                            Calendar
                        </Link>
                    </div>
                </div>
            </header>

            {/* FULL-WIDTH CANVAS (max-w-[1600px]) */}
            <main className="w-full max-w-[1600px] mx-auto px-4 py-4 md:px-12 md:py-5 flex-1 flex flex-col gap-4 lg:h-[calc(100vh-5rem)] lg:overflow-hidden">
                {/* Title Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <Dumbbell size={32} className="text-foreground md:w-9 md:h-9" strokeWidth={2.5} />
                        <div>
                            <h1 className="text-2xl md:text-[2.2rem] font-bold tracking-tight text-foreground font-sans">
                                Training
                            </h1>
                            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                {athleteName} • {daysUntilGame !== null ? (upcomingEventTitle ? `${upcomingEventTitle} in ${daysUntilGame} day${daysUntilGame === 1 ? '' : 's'}` : `Match in ${daysUntilGame} day${daysUntilGame === 1 ? '' : 's'}`) : 'In-Season Performance Track'}
                            </p>
                        </div>
                    </div>

                    {currentStep === 3 && (
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border text-foreground font-semibold rounded-xl text-xs md:text-sm transition-all flex items-center gap-1.5"
                        >
                            <ArrowLeft size={14} />
                            Update Completed Training
                        </button>
                    )}
                </div>

                {/* TWO-COLUMN LAYOUT: TRAINING INTAKE & DRILLS (2/3) + GOALIE CARD (1/3) */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch pb-2">
                    {/* LEFT 2 COLUMNS: 3-STEP FLOW */}
                    <div className="lg:col-span-2 flex flex-col h-full min-h-0 lg:overflow-y-auto pr-1 lg:pr-3 space-y-6">
                        {/* STEPPER PILLS */}
                        <div className="flex items-center justify-between bg-muted/40 p-1.5 rounded-2xl border border-border text-xs font-bold">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className={`flex-1 py-2 rounded-xl text-center transition-all ${
                                    currentStep === 1 ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                1. Training Check-In
                            </button>
                            <button
                                onClick={() => setCurrentStep(2)}
                                className={`flex-1 py-2 rounded-xl text-center transition-all ${
                                    currentStep === 2 ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                2. Readiness & Fatigue
                            </button>
                            <button
                                onClick={() => setCurrentStep(3)}
                                className={`flex-1 py-2 rounded-xl text-center transition-all ${
                                    currentStep === 3 ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                3. Daily Game Plan
                            </button>
                        </div>

                        {/* STEP 1: COMPLETED TRAINING INTAKE */}
                        {currentStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-[28px] p-6 md:p-8 space-y-6 shadow-sm"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                        Did you already complete training today or this week?
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                        Log one or multiple workouts (on-ice, lifts, HIIT, recovery). You can backfill multiple sessions at once.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setHasTrained(true)}
                                        className={`p-4 rounded-2xl border text-sm font-bold transition-all text-center ${
                                            hasTrained === true 
                                                ? 'bg-foreground text-background border-foreground' 
                                                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        ✓ Yes, I trained
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasTrained(false);
                                            setCurrentStep(2);
                                        }}
                                        className={`p-4 rounded-2xl border text-sm font-bold transition-all text-center ${
                                            hasTrained === false 
                                                ? 'bg-foreground text-background border-foreground' 
                                                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Rest Day / Haven't trained yet
                                    </button>
                                </div>

                                {hasTrained && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Logged Workouts ({sessionsList.length})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleAddSessionRow}
                                                className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl border border-border flex items-center gap-1.5 transition-all"
                                            >
                                                <Plus size={14} />
                                                Add Another Session
                                            </button>
                                        </div>

                                        {sessionsList.map((sess, index) => (
                                            <div key={sess.id} className="p-5 bg-muted/30 border border-border rounded-2xl space-y-3 relative">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-foreground">
                                                        Workout #{index + 1}
                                                    </span>
                                                    {sessionsList.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSessionRow(sess.id)}
                                                            className="text-muted-foreground hover:text-rose-500 p-1 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="sm:col-span-2">
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Session Title</label>
                                                        <input
                                                            type="text"
                                                            value={sess.title}
                                                            onChange={(e) => handleUpdateSession(sess.id, 'title', e.target.value)}
                                                            placeholder="e.g. 38m HIIT Deck of Cards or Stick 'n Puck"
                                                            className="w-full px-3.5 py-2 text-xs md:text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-foreground mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Duration (mins)</label>
                                                        <input
                                                            type="number"
                                                            value={sess.durationMins}
                                                            onChange={(e) => handleUpdateSession(sess.id, 'durationMins', Number(e.target.value))}
                                                            className="w-full px-3.5 py-2 text-xs md:text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-foreground mt-1"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Date Completed</label>
                                                        <input
                                                            type="date"
                                                            value={sess.date}
                                                            onChange={(e) => handleUpdateSession(sess.id, 'date', e.target.value)}
                                                            className="w-full px-3.5 py-2 text-xs md:text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-foreground mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Type</label>
                                                        <select
                                                            value={sess.type}
                                                            onChange={(e) => handleUpdateSession(sess.id, 'type', e.target.value as any)}
                                                            className="w-full px-3.5 py-2 text-xs md:text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-foreground mt-1 font-medium"
                                                        >
                                                            <option value="strength">Gym / Strength</option>
                                                            <option value="conditioning">Conditioning / Cardio</option>
                                                            <option value="sport">Sport Practice / Skills</option>
                                                            <option value="recovery">Mobility / Recovery</option>
                                                            <option value="other">Other / Custom</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Routine Breakdown & Notes</label>
                                                    <textarea
                                                        rows={2}
                                                        value={sess.routineNotes}
                                                        onChange={(e) => handleUpdateSession(sess.id, 'routineNotes', e.target.value)}
                                                        placeholder="Exercises, reps, sets, drill cues..."
                                                        className="w-full px-3.5 py-2 text-xs md:text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-foreground mt-1 resize-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        {/* Additional Training Button */}
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={handleAddSessionRow}
                                                className="w-full py-3 px-4 bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-bold rounded-2xl border border-dashed border-border hover:border-foreground/40 flex items-center justify-center gap-2 transition-all shadow-sm"
                                            >
                                                <Plus size={16} />
                                                Add Additional Training Session for Today
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(2)}
                                        className="px-6 py-2.5 bg-foreground text-background font-bold text-xs md:text-sm rounded-xl hover:bg-foreground/90 transition-all flex items-center gap-2"
                                    >
                                        <span>Next: Readiness & Physical Check</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: READINESS & FATIGUE */}
                        {currentStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-[28px] p-6 md:p-8 space-y-6 shadow-sm"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                        Physical Readiness & Muscle State
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                        State any acute tightness or fatigue to establish safety restrictions before your next start.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-2">
                                        <label className="text-xs font-bold text-foreground block">
                                            Groin / Adductor Tightness (1 = Fresh, 5 = Severe)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setGroinTightness(level)}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                        groinTightness === level 
                                                            ? 'bg-foreground text-background border-foreground' 
                                                            : 'bg-background border-border text-muted-foreground'
                                                    }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-2">
                                        <label className="text-xs font-bold text-foreground block">
                                            General Fatigue Level (1 = Peaked, 5 = Drained)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setGeneralFatigue(level)}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                        generalFatigue === level 
                                                            ? 'bg-foreground text-background border-foreground' 
                                                            : 'bg-background border-border text-muted-foreground'
                                                    }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                                        Specific Tissue / Joint Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={bodyNotes}
                                        onChange={(e) => setBodyNotes(e.target.value)}
                                        placeholder="e.g. Right groin tight, shoulders fatigued after push-ups..."
                                        className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-foreground resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                                    >
                                        <ArrowLeft size={14} />
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmittingCheckin}
                                        onClick={handleCompleteStep2}
                                        className="px-6 py-2.5 bg-foreground text-background font-bold text-xs md:text-sm rounded-xl hover:bg-foreground/90 transition-all flex items-center gap-2"
                                    >
                                        {isSubmittingCheckin ? "Processing..." : "Generate Today's Game Plan →"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: PRESCRIBED GAME PLAN & DRILL RUNNER */}
                        {currentStep === 3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* DIRECTIVE SUMMARY BANNER */}
                                <div className="p-6 md:p-8 bg-muted/40 border border-border rounded-[28px]">
                                    <div className="flex items-center justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-foreground text-background">
                                                Today's Focus
                                            </span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs font-semibold text-muted-foreground">{directiveContext}</span>
                                        </div>
                                        <button
                                            onClick={() => setCurrentStep(1)}
                                            className="text-xs font-semibold text-muted-foreground hover:text-foreground underline"
                                        >
                                            Adjust Input
                                        </button>
                                    </div>

                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-4">
                                        {directiveTitle}
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="p-4 bg-background/80 border border-border rounded-2xl">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-2.5 flex items-center gap-1.5">
                                                <Check size={16} />
                                                Recommended Work & Movement Focus
                                            </h4>
                                            <ul className="text-xs text-foreground space-y-1.5 list-disc list-inside">
                                                {whatToDoList.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-background/80 border border-border rounded-2xl">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2.5 flex items-center gap-1.5">
                                                <X size={16} />
                                                Load Management & What to Avoid
                                            </h4>
                                            <ul className="text-xs text-foreground space-y-1.5 list-disc list-inside">
                                                {whatNotToDoList.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* DRILL DECK */}
                                <div>
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
                                            Prescribed Drills ({drills.filter(d => d.completed).length}/{drills.length} Complete)
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {drills.map((drill) => {
                                            const isTimerActive = activeDrillId === drill.id && timerRunning;
                                            return (
                                                <div
                                                    key={drill.id}
                                                    className={`p-5 rounded-[24px] border transition-all flex flex-col justify-between ${
                                                        drill.completed 
                                                            ? 'bg-muted/40 border-emerald-500/40' 
                                                            : 'bg-muted/30 border-border'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <h4 className={`text-sm md:text-base font-bold leading-tight ${drill.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                                {drill.name}
                                                            </h4>
                                                            <button
                                                                onClick={() => toggleDrillCompleted(drill.id)}
                                                                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                                                                    drill.completed 
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                                        : 'border-border hover:border-foreground/40'
                                                                }`}
                                                            >
                                                                {drill.completed && <Check size={14} />}
                                                            </button>
                                                        </div>

                                                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                                                            {drill.sets}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground italic mb-4">
                                                            Cue: "{drill.cue}"
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                                                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {drill.durationMins} mins
                                                        </span>

                                                        {isTimerActive ? (
                                                            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-mono font-bold">
                                                                <Clock size={14} className="animate-spin" />
                                                                <span>{Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, '0')}</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => startDrillTimer(drill)}
                                                                className="px-3.5 py-1.5 bg-background hover:bg-muted border border-border text-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                                                            >
                                                                <Play size={12} className="text-foreground" />
                                                                <span>Start</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* RIGHT 1 COLUMN: GOALIE CARD STREAM (SIDE-BY-SIDE ON DESKTOP) */}
                    <div className="p-5 bg-muted/30 border border-border rounded-[28px] flex flex-col h-[650px] lg:h-full min-h-0 relative">
                        {/* THREAD HEADER & CONTROLS */}
                        <div className="pb-3.5 border-b border-border mb-3 space-y-2 shrink-0">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                    {isEditingTitle ? (
                                        <div className="flex items-center gap-1 flex-1">
                                            <input
                                                type="text"
                                                defaultValue={activeThreadTitle}
                                                onChange={(e) => setTitleInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveTitle();
                                                    if (e.key === 'Escape') setIsEditingTitle(false);
                                                }}
                                                autoFocus
                                                className="px-2 py-0.5 text-xs bg-background border border-foreground rounded font-bold text-foreground w-full focus:outline-none"
                                            />
                                            <button
                                                onClick={handleSaveTitle}
                                                className="p-1 text-emerald-500 hover:text-emerald-400"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-foreground truncate" title={activeThreadTitle}>
                                                {activeThreadTitle}
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    setTitleInput(activeThreadTitle);
                                                    setIsEditingTitle(true);
                                                }}
                                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 flex-shrink-0"
                                                title="Rename Chat"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowThreadDrawer(prev => !prev)}
                                        className="px-2.5 py-1 bg-background hover:bg-muted border border-border rounded-xl text-[11px] font-bold text-foreground transition-all flex items-center gap-1 shadow-sm"
                                        title="View Chat History by Date"
                                    >
                                        <History size={12} />
                                        <span>Chats ({threads.length || 1})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNewThread}
                                        className="px-2.5 py-1 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                                        title="Start New Chat"
                                    >
                                        <Plus size={12} />
                                        <span>New</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* THREADS POPUP / DRAWER */}
                        <AnimatePresence>
                            {showThreadDrawer && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-20 left-4 right-4 z-50 bg-card border border-border shadow-2xl rounded-2xl p-4 max-h-[400px] overflow-y-auto space-y-2"
                                >
                                    <div className="flex items-center justify-between pb-2 border-b border-border">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                            <History size={14} />
                                            Saved Conversations by Date
                                        </h4>
                                        <button
                                            onClick={() => setShowThreadDrawer(false)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                        {threads.length === 0 ? (
                                            <p className="text-xs text-muted-foreground py-3 text-center">No past chats recorded yet.</p>
                                        ) : (
                                            threads.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => handleSelectThread(t)}
                                                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                                                        activeThreadId === t.id
                                                            ? 'bg-foreground text-background border-foreground font-bold'
                                                            : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-bold truncate">{t.title}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeThreadId === t.id ? 'bg-background/20 text-background' : 'bg-background border border-border text-muted-foreground'}`}>
                                                            {t.date}
                                                        </span>
                                                    </div>
                                                    {t.lastMessage && (
                                                        <p className={`text-[11px] truncate ${activeThreadId === t.id ? 'text-background/80' : 'text-muted-foreground'}`}>
                                                            {t.lastMessage}
                                                        </p>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-border flex justify-end">
                                        <button
                                            onClick={handleNewThread}
                                            className="w-full py-2 bg-foreground text-background text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                                        >
                                            <Plus size={14} />
                                            Start New Chat for Today
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 pr-1 mb-3 text-xs md:text-sm">
                            {messages.map((msg) => {
                                const cardData = msg.actionCard?.data || {};
                                const isTrainingCard = msg.actionCard && (
                                    msg.actionCard.type === 'training_session' ||
                                    msg.actionCard.type === 'logged_session' ||
                                    msg.actionCard.type === 'prescribed_protocol'
                                );
                                const isCalendarCard = msg.actionCard && msg.actionCard.type === 'calendar_event';

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${msg.sender === 'goalie' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1 px-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground">
                                                {msg.sender === 'goalie' ? 'You' : 'Goalie Card'}
                                            </span>
                                            {msg.sender === 'goalie_card' && msg.provenance && (
                                                <span 
                                                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold tracking-tight ${
                                                        msg.provenance.mode === 'AI_COACH' 
                                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                                            : (msg.provenance.mode === 'DETERMINISTIC_ACTION' 
                                                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                                                                : 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border border-zinc-500/30')
                                                    }`}
                                                    title={`Mode: ${msg.provenance.mode} | History-Through: ${msg.provenance.historyThroughDate} | Lookahead: ${msg.provenance.lookaheadSource}`}
                                                >
                                                    {msg.provenance.mode}
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className={`max-w-[92%] p-3.5 rounded-2xl leading-relaxed ${
                                                msg.sender === 'goalie'
                                                    ? 'bg-foreground text-background rounded-tr-sm font-medium'
                                                    : 'bg-background border border-border text-foreground rounded-tl-sm shadow-sm'
                                            }`}
                                        >
                                            <div className="space-y-2">
                                                {msg.text.split('\n\n').map((paragraph, pIdx) => {
                                                    if (paragraph.startsWith('### ')) {
                                                        return (
                                                            <h4 key={pIdx} className="text-xs md:text-sm font-bold text-foreground tracking-tight border-b border-border/50 pb-1 mt-1">
                                                                {paragraph.replace('### ', '')}
                                                            </h4>
                                                        );
                                                    }
                                                    if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                                                        const items = paragraph.split('\n');
                                                        return (
                                                            <ul key={pIdx} className="space-y-1 my-1 pl-3.5 list-disc list-outside text-xs">
                                                                {items.map((it, itIdx) => {
                                                                    const cleanIt = it.replace(/^[\*\-]\s+/, '');
                                                                    return (
                                                                        <li key={itIdx} className="leading-snug">
                                                                            <span dangerouslySetInnerHTML={{
                                                                                __html: cleanIt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                                            }} />
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        );
                                                    }
                                                    return (
                                                        <p key={pIdx} className="leading-relaxed text-xs md:text-sm" dangerouslySetInnerHTML={{
                                                            __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                        }} />
                                                    );
                                                })}

                                                {/* STRUCTURED MISSION PRESCRIPTION (SCAN-FIRST UX: WHAT -> WHY -> PLAN -> GUARDRAIL) */}
                                                {msg.sender === 'goalie_card' && msg.mission && (
                                                    <div className="mt-3 pt-3 border-t border-border/60 space-y-2.5">
                                                        {/* WHAT Header */}
                                                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5">
                                                            <span className="text-[10px] font-mono font-bold tracking-wider text-primary uppercase block mb-0.5">
                                                                Today's Mission (WHAT)
                                                            </span>
                                                            <p className="text-xs font-bold text-foreground leading-snug">
                                                                {msg.mission.what}
                                                            </p>
                                                        </div>

                                                        {/* WHY Context */}
                                                        {msg.mission.why && (
                                                            <div className="px-1 text-[11px] text-muted-foreground leading-relaxed">
                                                                <strong className="text-foreground font-semibold">Context (WHY): </strong>
                                                                {msg.mission.why}
                                                            </div>
                                                        )}

                                                        {/* PLAN Exercises */}
                                                        {msg.mission.plan && msg.mission.plan.length > 0 && (
                                                            <div className="space-y-1.5 pt-0.5">
                                                                <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase px-1">
                                                                    Prescribed Plan ({msg.mission.plan.length} Movements)
                                                                </span>
                                                                <div className="space-y-1.5">
                                                                    {msg.mission.plan.map((item, itemIdx) => (
                                                                        <div key={itemIdx} className="bg-muted/40 border border-border/40 rounded-xl p-2 text-xs space-y-1">
                                                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                                <span className="font-bold text-foreground">{item.name}</span>
                                                                                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                                                                    {item.sets && (
                                                                                        <span className="bg-background px-1.5 py-0.5 rounded border border-border/50 font-mono font-semibold">
                                                                                            {item.sets} {typeof item.sets === 'number' || !String(item.sets).includes('set') ? 'sets' : ''}
                                                                                        </span>
                                                                                    )}
                                                                                    {item.reps && (
                                                                                        <span className="bg-background px-1.5 py-0.5 rounded border border-border/50 font-mono font-semibold">
                                                                                            {item.reps} {typeof item.reps === 'number' || (!String(item.reps).includes('rep') && !String(item.reps).includes('s') && !String(item.reps).includes('min')) ? 'reps' : ''}
                                                                                        </span>
                                                                                    )}
                                                                                    {item.load && (
                                                                                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono font-semibold">
                                                                                            {item.load}
                                                                                        </span>
                                                                                    )}
                                                                                    {item.duration && (
                                                                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-mono font-semibold">
                                                                                            {item.duration}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {item.notes && (
                                                                                <p className="text-[11px] text-muted-foreground italic leading-tight pt-0.5">
                                                                                    {item.notes}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* GUARDRAIL Banner */}
                                                        {msg.mission.guardrail && (
                                                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
                                                                <div>
                                                                    <span className="font-bold block text-[10px] tracking-wide uppercase font-mono mb-0.5">Guardrail & Limit</span>
                                                                    <span className="leading-snug text-[11px]">{msg.mission.guardrail}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Decision Factors Badges */}
                                                        {msg.decisionFactors && msg.decisionFactors.length > 0 && (
                                                            <div className="pt-1 px-1">
                                                                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                                                                    Decision Context Facts
                                                                </span>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {msg.decisionFactors.map((df, dfIdx) => (
                                                                        <span key={dfIdx} className="text-[9px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border/40">
                                                                            • {df}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Quick Action Buttons for Mission */}
                                                        {!isTrainingCard && (
                                                            <div className="flex items-center gap-2 pt-1">
                                                                <button
                                                                    type="button"
                                                                    disabled={addedToTrainingIds.has(msg.id)}
                                                                    onClick={() => handleAddToTraining(msg)}
                                                                    className={`flex-1 py-1.5 px-2.5 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                                                                        addedToTrainingIds.has(msg.id)
                                                                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 cursor-default'
                                                                            : 'bg-foreground text-background hover:bg-foreground/90'
                                                                    }`}
                                                                >
                                                                    {addedToTrainingIds.has(msg.id) ? (
                                                                        <>
                                                                            <Check size={12} />
                                                                            <span>Added to Training</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Plus size={12} />
                                                                            <span>Add to Training</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={addedToCalendarIds.has(msg.id)}
                                                                    onClick={() => handleAddToCalendar(msg)}
                                                                    className={`flex-1 py-1.5 px-2.5 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all border shadow-sm ${
                                                                        addedToCalendarIds.has(msg.id)
                                                                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 cursor-default'
                                                                            : 'bg-background hover:bg-muted border-border text-foreground'
                                                                    }`}
                                                                >
                                                                    {addedToCalendarIds.has(msg.id) ? (
                                                                        <>
                                                                            <Check size={12} />
                                                                            <span>Added to Calendar</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CalendarIcon size={12} />
                                                                            <span>Add to Calendar</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ACTION CARDS: TRAINING (TWO SEPARATE BUTTONS) */}
                                                {msg.sender === 'goalie_card' && isTrainingCard && (
                                                    <div className="mt-3 pt-3 border-t border-border/60 space-y-2.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5 truncate">
                                                                <Dumbbell size={13} className="text-emerald-500 flex-shrink-0" />
                                                                <span className="truncate">{msg.actionCard?.title || "Recognized Training"}</span>
                                                            </span>
                                                            {cardData.duration && (
                                                                <span className="text-[10px] font-semibold text-muted-foreground flex-shrink-0">
                                                                    {cardData.duration}m
                                                                </span>
                                                            )}
                                                        </div>

                                                        {cardData.details && (
                                                            <p className="text-[11px] text-muted-foreground italic leading-tight">
                                                                {cardData.details}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-2 pt-1">
                                                            {/* Button 1: Add to Training */}
                                                            <button
                                                                type="button"
                                                                disabled={addedToTrainingIds.has(msg.id)}
                                                                onClick={() => handleAddToTraining(msg)}
                                                                className={`flex-1 py-1.5 px-2.5 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                                                                    addedToTrainingIds.has(msg.id)
                                                                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 cursor-default'
                                                                        : 'bg-foreground text-background hover:bg-foreground/90'
                                                                }`}
                                                            >
                                                                {addedToTrainingIds.has(msg.id) ? (
                                                                    <>
                                                                        <Check size={12} />
                                                                        <span>Added to Training</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus size={12} />
                                                                        <span>Add to Training</span>
                                                                    </>
                                                                )}
                                                            </button>

                                                            {/* Button 2: Add to Calendar */}
                                                            <button
                                                                type="button"
                                                                disabled={addedToCalendarIds.has(msg.id)}
                                                                onClick={() => handleAddToCalendar(msg)}
                                                                className={`flex-1 py-1.5 px-2.5 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all border shadow-sm ${
                                                                    addedToCalendarIds.has(msg.id)
                                                                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 cursor-default'
                                                                        : 'bg-background hover:bg-muted border-border text-foreground'
                                                                }`}
                                                            >
                                                                {addedToCalendarIds.has(msg.id) ? (
                                                                    <>
                                                                        <Check size={12} />
                                                                        <span>Added to Calendar</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CalendarIcon size={12} />
                                                                        <span>Add to Calendar</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ACTION CARDS: CALENDAR EVENT (SINGLE BUTTON) */}
                                                {msg.sender === 'goalie_card' && isCalendarCard && (
                                                    <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5 truncate">
                                                                <CalendarIcon size={13} className="text-sky-500 flex-shrink-0" />
                                                                <span className="truncate">{msg.actionCard?.title || "Calendar Event"}</span>
                                                            </span>
                                                            <span className="text-[10px] font-semibold text-muted-foreground">
                                                                {cardData.date || todayDateStr}
                                                            </span>
                                                        </div>

                                                        {cardData.time && (
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Time: {cardData.time} • {cardData.location || "Rink"}
                                                            </p>
                                                        )}

                                                        <div className="pt-1">
                                                            <button
                                                                type="button"
                                                                disabled={addedToCalendarIds.has(msg.id)}
                                                                onClick={() => handleAddToCalendar(msg)}
                                                                className={`w-full py-1.5 px-2.5 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                                                                    addedToCalendarIds.has(msg.id)
                                                                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 cursor-default'
                                                                        : 'bg-foreground text-background hover:bg-foreground/90'
                                                                }`}
                                                            >
                                                                {addedToCalendarIds.has(msg.id) ? (
                                                                    <>
                                                                        <Check size={12} />
                                                                        <span>Added to Calendar</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus size={12} />
                                                                        <span>Add to Calendar</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {isSendingChat && (
                                <div className="flex flex-col items-start animate-fade-in">
                                    <span className="text-[10px] font-semibold text-muted-foreground mb-1 px-1">Goalie Card</span>
                                    <div className="bg-background border border-border text-foreground rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-1.5 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar text-[11px] shrink-0">
                            <button
                                onClick={() => handleSendMessage("Logged: 38-min Deck of Cards HIIT workout today (burpees, push-ups, squats, planks). Groin is slightly tight.")}
                                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground font-medium transition-all"
                            >
                                38m HIIT
                            </button>
                            <button
                                onClick={() => handleSendMessage("Logged: 50-min Stick 'n Puck on-ice session focusing on crease depth.")}
                                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground font-medium transition-all"
                            >
                                50m On-Ice
                            </button>
                            <button
                                onClick={() => handleSendMessage("Explain the 90/90 hip capsule flow and why it helps my butterfly recovery")}
                                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground font-medium transition-all"
                            >
                                Explain 90/90
                            </button>
                            <button
                                onClick={() => handleSendMessage("I have a stick 'n puck skate on Thursday at 2pm. Can you put that on my calendar?")}
                                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground font-medium transition-all"
                            >
                                Schedule Skate
                            </button>
                        </div>

                        {/* Chat Input */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="relative flex items-center shrink-0"
                        >
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Message Goalie Card, log training, or schedule..."
                                disabled={isSendingChat}
                                className="w-full bg-background border border-border rounded-xl pl-3.5 pr-10 py-2.5 text-xs md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isSendingChat}
                                className="absolute right-1.5 p-1.5 rounded-lg bg-foreground text-background disabled:opacity-40 hover:opacity-90 transition-all"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
