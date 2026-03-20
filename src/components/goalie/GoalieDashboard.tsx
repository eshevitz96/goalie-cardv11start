"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, TrendingUp, Calendar, Clock, ChevronRight, BarChart3, Target, Zap, 
  ShieldCheck, Film, X, Repeat, Maximize2, ArrowRight, Shield, Plus, Trash2, Camera,
  Video
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";

// Components
// ... (rest of imports)
import { GoalieCard } from "@/components/GoalieCard";
import { ScheduleRequest } from "@/components/ScheduleRequest";
import { PostGameReport } from "@/components/PostGameReport";
import { Reflections } from "@/components/Reflections";
import { AiCoachRecommendation } from "@/components/AiCoachRecommendation";
import { BetaFeedback } from "@/components/BetaFeedback";
import { WhatsNewGuide } from "@/components/WhatsNewGuide";
import { EventsList } from "@/components/EventsList";
import TrainingInsights from "@/components/TrainingInsights";
import { GoalsWidget } from "@/components/GoalsWidget";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// New Components
import { GoalieHeader } from "@/components/goalie/GoalieHeader";
import { CoachesCorner } from "@/components/goalie/CoachesCorner";
import { HighlightsSection } from "@/components/goalie/HighlightsSection";
import { NotificationBanner } from "@/components/ui/NotificationBanner";
import { MonthlyCreditsWidget } from "@/components/goalie/MonthlyCreditsWidget";
import { GameFilmUpload } from "@/components/goalie/GameFilmUpload";
import { RequestSessionWidget } from "@/components/goalie/RequestSessionWidget";
import { FilmAnalysisWorkspace } from "@/components/goalie/FilmAnalysisWorkspace";
import { GameReport } from "@/components/goalie/GameReport";

// V11 Algorithm & Components
import { v11Engine } from "@/lib/v11-engine";
import { getSportTerms } from "@/utils/sport-language";
import { GoalieContext, ShotEvent } from "@/types/goalie-v11";
import { GameAnalysisSurface } from "@/components/goalie/GameAnalysisSurface";
import { V11StatWidget } from "@/components/goalie/V11StatWidget";

// Utils
import { isPastSeniorSeason } from "@/utils/role-logic";

interface GoalieDashboardProps {
    goalies: any[];
    userRole: string | null;
    userId: string | null;
    notification: any;
    notifications: any[];
    onDismissNotification: () => void;
    onLogout: () => void;
    onRegister: (eventId: string, goalieId: string) => void;
    onLogAction: (actionName: string) => void;
    journalPrefill: string | null;
    onCoachUpdate: () => void;
}

export function GoalieDashboard({
    goalies,
    userRole,
    userId,
    notification,
    notifications,
    onDismissNotification,
    onLogout,
    onRegister,
    onLogAction,
    journalPrefill,
    onCoachUpdate
}: GoalieDashboardProps) {

    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [expandedBlock, setExpandedBlock] = useState<'journal' | 'notes' | null>(null);
    const [showProgress, setShowProgress] = useState(true);
    const [shotEvents, setShotEvents] = useState<ShotEvent[]>([]);
    const [isUploadingFilm, setIsUploadingFilm] = useState(false);
    const [isAnalyzingFilm, setIsAnalyzingFilm] = useState(false);
    const [showGameReport, setShowGameReport] = useState(false);
    const [unchartedCount, setUnchartedCount] = useState(2); // Mock for local state sync
    const [performanceView, setPerformanceView] = useState<'game' | 'season'>('game');
    const [hasCoach, setHasCoach] = useState(true);
    const [hasAnalyticsAccess, setHasAnalyticsAccess] = useState(true);
    const [readinessState, setReadinessState] = useState({ soreness: 2, sleep: 8 });

    // Sync from search param athleteId (if any)
    useEffect(() => {
        const targetId = searchParams.get('athleteId');
        if (targetId && goalies?.length > 0) {
            const idx = goalies.findIndex(g => g.id === targetId || g. athlete_card_id === targetId);
            if (idx !== -1) setCurrentIndex(idx);
        }
    }, [searchParams, goalies]);

    // Sync V11 Readiness from Journal Entry
    useEffect(() => {
        const syncReadiness = () => {
            const s = localStorage.getItem('demo_latest_soreness');
            const sl = localStorage.getItem('demo_latest_sleep');
            if (s && sl) {
                setReadinessState({ soreness: parseInt(s), sleep: parseInt(sl) });
            }
        };

        window.addEventListener('demo_reflection_updated', syncReadiness);
        syncReadiness(); // Initial check
        return () => window.removeEventListener('demo_reflection_updated', syncReadiness);
    }, []);

    const activeGoalie = goalies[currentIndex];

    // V11 Context Mapping
    const goalieContext: GoalieContext = {
        userId: userId || activeGoalie?.id || 'anonymous',
        sport: (activeGoalie?.sport?.toLowerCase() === 'lacrosse' ? 'lacrosse-boys' : activeGoalie?.sport?.toLowerCase() || 'hockey') as any,
        schedule: {
            nextEventDate: new Date(),
            nextEventType: activeGoalie?.events?.some((e: any) => new Date(e.date).toDateString() === new Date().toDateString()) ? 'game' : 'none',
            lastEventDate: new Date(),
            seasonPhase: 'in-season'
        },
        readiness: {
            sorenessLevel: readinessState.soreness,
            sleepQuality: readinessState.sleep
        },
        priorities: ['Consistency', 'Low Shots'],
        struggles: ['Breakaways'],
        lastCompleted: {
            game: new Date().toISOString(),
            film: new Date().toISOString(),
            mental: new Date().toISOString(),
            physical: new Date().toISOString(),
            stats_logging: new Date().toISOString()
        },
        pendingCoachFeedbackCount: 0,
        unchartedVideosCount: unchartedCount
    };

    const v11Model = v11Engine.generateViewModel(goalieContext);

    // Pro Logic for Default Toggle
    const isPro = activeGoalie && activeGoalie.gradYear && (isPastSeniorSeason(activeGoalie.gradYear) || activeGoalie.team?.toLowerCase().includes('blue') || activeGoalie.team?.toLowerCase().includes('pro'));

    useEffect(() => {
        if (activeGoalie) {
            setShowProgress(!isPro);
        }
    }, [activeGoalie?.id, isPro]);

    // Handle internal logic for expanding journal when log action is triggered
    useEffect(() => {
        if (journalPrefill) {
            setExpandedBlock('journal');
        }
    }, [journalPrefill]);

    if (!activeGoalie) return <div className="min-h-screen bg-background text-foreground p-8">No Goalies Found. <Link href="/activate" className="text-primary underline">Activate a Card</Link></div>;

    const handlePlotShot = (x: number, y: number) => {
        const newShot: ShotEvent = {
            id: Math.random().toString(),
            gameId: 'current',
            sport: goalieContext.sport,
            period: 1,
            result: Math.random() > 0.7 ? 'goal' : 'save',
            shotType: 'wrist',
            originX: x,
            originY: y,
            isShorthanded: false,
            isPowerPlay: false,
            hasTraffic: false,
            isOddManRush: false
        };
        setShotEvents(prev => [...prev, newShot]);
    };

    // Events to show in both Dashboard list and Workspace dropdown
    const dashboardEvents = (activeGoalie.events && activeGoalie.events.length > 0) 
        ? activeGoalie.events 
        : [
            { id: 'm1', name: 'Game: vs Rangers', date: new Date(Date.now() - 86400000).toISOString(), location: 'Home', status: 'past', image: '' },
            { id: 'm2', name: 'Practice: Skills', date: new Date(Date.now() + 86400000).toISOString(), location: 'Home', status: 'upcoming', image: '' }
        ];

    return (
        <main className="min-h-screen bg-background p-4 md:p-8 overflow-x-hidden selection:bg-primary selection:text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

                {/* Notification Banner */}
                <NotificationBanner
                    notification={notification}
                    onDismiss={onDismissNotification}
                />

                <GoalieHeader
                    activeGoalieName={activeGoalie.name}
                    onLogout={onLogout}
                    notifications={notifications}
                />

                {/* HERO ROW: Coach OS (2/3) | Profile (1/3) */}
                <div className="md:col-span-2">
                    <AiCoachRecommendation
                        lastMood={activeGoalie.latestMood}
                        rosterId={activeGoalie.id}
                        sport={activeGoalie.sport}
                        onLogAction={(action) => {
                            onLogAction(action);
                            if (action.includes('Log Training') || action.includes('Log Game Report')) {
                                setExpandedBlock('journal');
                            }
                        }}
                        goalieName={activeGoalie.name}
                        gradYear={activeGoalie.gradYear}
                        stats={activeGoalie.stats}
                        overrideText={journalPrefill || undefined} 
                        isGameday={goalieContext.schedule.nextEventType === 'game'}
                        variant="full"
                    />
                </div>

                <div className="md:col-span-1">
                    <motion.div
                        key={activeGoalie.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <GoalieCard
                            name={activeGoalie.name}
                            team={activeGoalie.team}
                            gradYear={activeGoalie.gradYear}
                            showProgress={showProgress}
                            credits={activeGoalie.credits}
                            className="w-full h-auto shadow-2xl"
                        />
                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full border border-muted-foreground" />
                            <span>Show Activity Counts</span>
                        </div>
                    </motion.div>
                </div>

                {/* WIDGET ROW: 3 Columns */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {/* Column 1: Events */}
                    <div className="space-y-4">
                        <EventsList
                            events={dashboardEvents}
                            onRegister={(eventId) => onRegister(eventId, activeGoalie.id)}
                            onUploadFilm={() => setIsUploadingFilm(true)}
                            hidePayments={true}
                            maxItems={3}
                            goalieId={activeGoalie.id}
                        />
                    </div>

                    {/* Column 2: Journal */}
                    <div className="space-y-4">
                        <Reflections
                            rosterId={activeGoalie.id}
                            isExpanded={expandedBlock === 'journal'}
                            onToggleExpand={() => setExpandedBlock(prev => prev === 'journal' ? null : 'journal')}
                            prefill={journalPrefill}
                        />
                    </div>

                    {/* Column 3: Targets */}
                    <div className="space-y-4">
                        <GoalsWidget rosterId={activeGoalie.id} goalieId={userId || undefined} />
                        
                        {activeGoalie.credits > 0 && (
                            <MonthlyCreditsWidget
                                credits={activeGoalie.credits}
                                coachName={activeGoalie.coach !== 'Assigned Coach' ? activeGoalie.coach : undefined}
                            />
                        )}
                    </div>
                </div>

                {/* ANALYTICS ROW: Performance & Coaches Corner */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border/50">
                    <div className="md:col-span-2 space-y-6 bg-card/30 rounded-[2rem] p-8 border border-white/5 shadow-sm relative overflow-hidden">
                        
                        {/* New Global Toggle for Analytics */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-1.5 p-1 bg-background/50 backdrop-blur-sm border border-border/40 rounded-full">
                                <button 
                                    onClick={() => setPerformanceView('game')}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${performanceView === 'game' ? 'bg-foreground text-background shadow-lg scale-[1.05]' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Current Game
                                </button>
                                <button 
                                    onClick={() => setPerformanceView('season')}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${performanceView === 'season' ? 'bg-foreground text-background shadow-lg scale-[1.05]' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Season View
                                </button>
                            </div>
                            
                            {performanceView === 'game' && shotEvents.length > 0 && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-[10px] h-8 px-3 text-muted-foreground hover:text-red-500 uppercase tracking-widest font-bold flex items-center gap-2" 
                                    onClick={() => setShotEvents([])}
                                >
                                    <Trash2 size={12} /> Reset Chart
                                </Button>
                            )}
                        </div>
                        
                        {/* Status Notification for Uncharted Clips */}
                        {goalieContext.unchartedVideosCount > 0 && (
                            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <Target className="text-primary w-5 h-5 shrink-0" />
                                    <p className="text-sm font-medium text-foreground">
                                        You have <span className="font-bold text-primary">{goalieContext.unchartedVideosCount} uncharted clip{goalieContext.unchartedVideosCount !== 1 && 's'}</span> pending review.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => setIsAnalyzingFilm(true)}
                                    className="bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-[10px] rounded-xl h-auto py-2 px-5 transition-all hover:scale-105"
                                >
                                    Chart Now
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                <Activity size={14} /> {v11Model.headerTitle}
                            </span>
                            {shotEvents.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] uppercase font-black px-3 py-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Analysis Complete</Badge>
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <V11StatWidget 
                                    score={v11Model.readinessScore}
                                    sport={goalieContext.sport}
                                    label={performanceView === 'game' ? "Game Performance" : "Season Average"}
                                    stats={performanceView === 'game' ? [
                                        { 
                                            label: getSportTerms(goalieContext.sport).saveMetric, 
                                            value: shotEvents.length > 0 ? `.${Math.round((shotEvents.filter(s => s.result === 'save').length / shotEvents.length) * 1000)}` : '.000' 
                                        },
                                        { 
                                            label: "Goals Against", 
                                            value: shotEvents.filter(s => s.result === 'goal').length.toString() 
                                        },
                                        { label: "Total Shots", value: shotEvents.length.toString() }
                                    ] : [
                                        { label: getSportTerms(goalieContext.sport).saveMetric, value: v11Model.seasonSavePercentage.toString().replace('0.', '.') },
                                        { label: getSportTerms(goalieContext.sport).averageMetric, value: v11Model.seasonGAA },
                                        { label: getSportTerms(goalieContext.sport).advancedMetric, value: '82.5' }
                                    ]}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Button 
                                        onClick={() => setIsUploadingFilm(true)}
                                        className="bg-card hover:bg-muted border border-border/50 text-foreground font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all h-auto uppercase tracking-widest text-[10px]"
                                    >
                                        <Film size={14} />
                                        <span>Upload</span>
                                    </Button>
                                    <Button 
                                        onClick={() => setIsAnalyzingFilm(true)}
                                        className="bg-foreground text-background hover:bg-foreground/90 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all h-auto uppercase tracking-widest text-[10px]"
                                    >
                                        <Repeat size={14} />
                                        <span>Re-Analysis</span>
                                    </Button>
                                </div>
                                {shotEvents.length > 0 && (
                                    <Link 
                                        href="/clips"
                                        className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 py-4 rounded-2xl hover:bg-muted transition-all"
                                    >
                                        <TrendingUp size={12} /> View Full Season Insights <ChevronRight size={12} />
                                    </Link>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        {performanceView === 'game' ? 'Shot Location Tracker' : 'Season Map Distribution'}
                                    </span>
                                </div>
                                <GameAnalysisSurface 
                        sport={goalieContext.sport} 
                        shots={performanceView === 'game' ? shotEvents : [
                            { id: 's1', gameId: 'g1', sport: goalieContext.sport, result: 'save', shotType: 'wrist', originX: 45, originY: 65, period: 1, isShorthanded: false, isPowerPlay: false, hasTraffic: false, isOddManRush: false },
                            { id: 's2', gameId: 'g1', sport: goalieContext.sport, result: 'goal', shotType: 'wrist', originX: 52, originY: 15, period: 1, isShorthanded: false, isPowerPlay: false, hasTraffic: false, isOddManRush: false },
                            { id: 's3', gameId: 'g2', sport: goalieContext.sport, result: 'save', shotType: 'wrist', originX: 25, originY: 45, period: 2, isShorthanded: false, isPowerPlay: false, hasTraffic: false, isOddManRush: false },
                            { id: 's4', gameId: 'g3', sport: goalieContext.sport, result: 'save', shotType: 'wrist', originX: 75, originY: 45, period: 3, isShorthanded: false, isPowerPlay: false, hasTraffic: false, isOddManRush: false },
                            { id: 's5', gameId: 'g4', sport: goalieContext.sport, result: 'goal', shotType: 'wrist', originX: 48, originY: 10, period: 1, isShorthanded: false, isPowerPlay: false, hasTraffic: false, isOddManRush: false },
                        ]}
                                    interactive={false} 
                                />
                                {shotEvents.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => router.push('/clips')}
                                            className="h-9 text-[9px] font-black uppercase tracking-widest bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        >
                                            Review Clips
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setShowGameReport(true)}
                                            className="h-9 text-[9px] font-black uppercase tracking-widest bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                                        >
                                            Game Report
                                        </Button>
                                    </div>
                                )}

                                {performanceView === 'season' && (
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => router.push('/clips')}
                                            className="h-12 text-[10px] font-black uppercase tracking-widest bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary rounded-2xl flex items-center justify-center gap-3 transition-all"
                                        >
                                            <Video size={14} />
                                            Open Season Database
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => router.push('/clips')}
                                            className="h-12 text-[10px] font-black uppercase tracking-widest bg-foreground/5 hover:bg-foreground/10 border-foreground/10 text-foreground rounded-2xl flex items-center justify-center gap-3 transition-all"
                                        >
                                            <BarChart3 size={14} />
                                            Full Analytics
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1 space-y-6">
                        <CoachesCorner 
                            activeGoalie={activeGoalie} 
                            hasCoach={hasCoach} 
                            onPickCoach={() => setHasCoach(true)} 
                        />
                        {hasCoach ? (
                            <RequestSessionWidget assignedCoach={activeGoalie.coach} />
                        ) : (
                            <div className="bg-card/30 border border-dashed border-border/50 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-all cursor-pointer" onClick={() => setHasCoach(true)}>
                                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Plus size={20} className="text-muted-foreground group-hover:text-primary" />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-foreground">Pick a Coach</h4>
                                <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-widest leading-relaxed">Connect with an elite mentor</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pro Insights / Admin Section */}
                {(userRole === 'admin' || userRole === 'coach') && (
                    <div className="md:col-span-2 mt-8 mb-8 border-t border-border/10 pt-12">
                        <TrainingInsights />
                    </div>
                )}

            </div>
            
            <AnimatePresence>
                {isUploadingFilm && (
                    <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
                        <div className="w-full max-w-lg mb-20 mt-10">
                            <div className="flex justify-end mb-4">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setIsUploadingFilm(false)}
                                    className="bg-black/10 hover:bg-black/20 text-foreground w-10 h-10 p-0 rounded-full"
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                            <GameFilmUpload rosterId={activeGoalie.id} onUploadComplete={() => setTimeout(() => setIsUploadingFilm(false), 2000)} />
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAnalyzingFilm && (
                    <div className="fixed inset-0 z-[300] bg-background flex flex-col p-4 md:p-8 overflow-y-auto">
                        <div className="max-w-7xl mx-auto w-full min-h-full flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                                        <Film size={20} />
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter text-foreground">Film Analysis Workspace</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setIsAnalyzingFilm(false)}
                                        className="bg-card hover:bg-muted text-foreground rounded-full flex items-center gap-2 px-6 border border-border/50"
                                    >
                                        <X size={18} /> Close Session
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="flex-1 min-h-0">
                                <FilmAnalysisWorkspace 
                                    sport={goalieContext.sport} 
                                    videoUrl="https://example.com/mock-game.mp4" 
                                    initialClips={activeGoalie.unchartedClips || (unchartedCount > 0 ? [{ id: 'u1', timestamp: 12, type: 'save', status: 'pending' }, { id: 'u2', timestamp: 45, type: 'goal', status: 'pending' }] : [])}
                                    events={dashboardEvents}
                                    onComplete={async (data) => {
                                        const { syncShotEvents } = await import('@/app/actions');
                                        const result = await syncShotEvents(
                                            activeGoalie.id,
                                            data.associatedEventId,
                                            data.clips.filter((c: any) => c.status === 'plotted').map((c: any) => ({
                                                sport: data.sport,
                                                period: c.period || 1,
                                                result: c.type === 'goal' ? 'goal' : 'save',
                                                shotType: 'wrist',
                                                originX: c.plottedX,
                                                originY: c.plottedY,
                                                targetX: c.netX,
                                                targetY: c.netY
                                            }))
                                        );

                                        if (result.success) {
                                            setIsAnalyzingFilm(false);
                                            setUnchartedCount(0);
                                            // Trigger success state for the report
                                            setShowGameReport(true);
                                        } else {
                                            alert("Failed to sync analysis: " + result.error);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showGameReport && (
                    <div className="fixed inset-0 z-[400] bg-background flex flex-col p-4 md:p-8 overflow-y-auto">
                        <div className="max-w-4xl mx-auto w-full relative">
                            <div className="flex justify-end mb-6 sticky top-0 z-50 pt-2 pr-2">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setShowGameReport(false)}
                                    className="bg-card hover:bg-muted text-foreground rounded-full h-12 px-6 border border-border/50 shadow-xl"
                                >
                                    <X size={20} /> Close Report
                                </Button>
                            </div>
                            <GameReport 
                                sport={goalieContext.sport}
                                opponent="Lutheran South"
                                date={new Date().toLocaleDateString()}
                                shots={shotEvents}
                                stats={{
                                    totalShots: shotEvents.length,
                                    saves: shotEvents.filter(s => s.result === 'save').length,
                                    goalsAgainst: shotEvents.filter(s => s.result === 'goal').length,
                                    savePercentage: `${Math.round((shotEvents.filter(s => s.result === 'save').length / Math.max(1, shotEvents.length)) * 100)}%`
                                }}
                            />
                            <div className="flex justify-center mt-12 mb-20">
                                <Button 
                                    onClick={() => setShowGameReport(false)}
                                    className="w-full max-w-sm py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    Confirm & Sync Season Stats
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <BetaFeedback rosterId={activeGoalie.id} userId={userId || undefined} userRole="goalie" />
            <WhatsNewGuide />
        </main>
    );
}
