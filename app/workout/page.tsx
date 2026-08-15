"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Printer, RotateCcw, Check, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/navigation";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

// ----------------------------------------------------
// Import decoupled Coach Core modules (V1.1 Architecture)
// ----------------------------------------------------
import { AthleteProfile, ReadinessContext, Mission, Reflection, LearningResult, Session } from "@/lib/coach/types";
import { GLADIATORS_KNOWLEDGE_BASE } from "@/lib/coach/knowledge-base";
import { generateMission } from "@/lib/coach/engine";
import { processReflection } from "@/lib/coach/learning";
import { useAuth } from "@/hooks/useAuth";
import { coachRepository } from "@/lib/coach/repository";
import { supabase } from "@/utils/supabase/client";

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function MissionCardPage() {
    const router = useRouter();
    const auth = useAuth();
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<'readiness' | 'active_mission' | 'reflection' | 'learning_archive'>('readiness');

    // Permanent profile state
    const [profile, setProfile] = useState<AthleteProfile>({
        user_id: "",
        baselines: {
            balance: 4.0,
            landing: 4.0,
            conditioning: 4.0
        },
        recentFatigueLevel: "moderate",
        previousMissionCompleted: false,
        totalCompletedMissions: 0,
        learnedInsights: []
    });

    // Step 1: Readiness check-in states
    const [energy, setEnergy] = useState<number>(7);
    const [sorenessLegs, setSorenessLegs] = useState<boolean>(false);
    const [sorenessCore, setSorenessCore] = useState<boolean>(false);
    const [sorenessUpper, setSorenessUpper] = useState<boolean>(false);
    const [timeAvailable, setTimeAvailable] = useState<"30" | "60">("60");
    const [environment, setEnvironment] = useState<"home" | "gym">("gym");
    const [activeBottleneck, setActiveBottleneck] = useState<"Landing Quality" | "Right-Side Balance" | "Conditioning">("Landing Quality");

    // Step 2: Active Mission Card state
    const [mission, setMission] = useState<Mission | null>(null);

    // Step 3: Reflection inputs
    const [reflectEnergy, setReflectEnergy] = useState<number>(7);
    const [reflectBalance, setReflectBalance] = useState<number>(5);
    const [reflectLanding, setReflectLanding] = useState<number>(5);
    const [reflectConditioning, setReflectConditioning] = useState<number>(5);
    const [reflectWinToday, setReflectWinToday] = useState<string>("");
    const [reflectBottleneck, setReflectBottleneck] = useState<string>("");
    const [reflectTomorrow, setReflectTomorrow] = useState<string>("");

    // Step 4: Learning update result
    const [learningResult, setLearningResult] = useState<LearningResult | null>(null);

    const [activeContract, setActiveContract] = useState<any | null>(null);
    const [contractLoading, setContractLoading] = useState<boolean>(true);

    // Debug tool: explainability toggle
    const [showExplanation, setShowExplanation] = useState<boolean>(false);

    // Hydration from Local Storage / Supabase
    useEffect(() => {
        if (auth.loading) return;
        
        async function initData() {
            setMounted(true);
            const todayStr = new Date().toISOString().split('T')[0];
            
            if (auth.userId) {
                console.log("☁️ Authenticated session detected. Running sync...");
                await coachRepository.syncLocalToCloud(auth.userId);
                
                // Fetch active contract
                const contract = await coachRepository.fetchActiveContract(auth.userId);
                setActiveContract(contract);
                setContractLoading(false);

                const fetched = await coachRepository.fetchProfile(auth.userId);
                if (fetched) {
                    setProfile(fetched);
                    
                    const todayMission = await coachRepository.fetchTodayMission(auth.userId, todayStr);
                    if (todayMission) {
                        setMission(todayMission);
                        
                        const savedStep = localStorage.getItem("goalie_companion_step");
                        if (savedStep) {
                            setStep(JSON.parse(savedStep) as any);
                        } else {
                            setStep("active_mission");
                        }
                    } else {
                        setMission(null);
                        setStep("readiness");
                    }
                } else {
                    const newProfile: AthleteProfile = {
                        user_id: auth.userId,
                        baselines: {
                            balance: 4.0,
                            landing: 4.0,
                            conditioning: 4.0
                        },
                        recentFatigueLevel: "moderate",
                        previousMissionCompleted: false,
                        totalCompletedMissions: 0,
                        learnedInsights: []
                    };
                    setProfile(newProfile);
                    await coachRepository.saveProfile(newProfile);
                    setStep("readiness");
                }
            } else {
                console.log("💾 Offline mode. Loading from LocalStorage...");
                // Set default dummy contract for offline mode
                setActiveContract({
                    id: "5c60360d-6ea8-4db3-ac00-ec4065681e9a",
                    name: "Gladiators (Local)",
                    bottlenecks: ["landing_quality", "right_side_balance", "conditioning"]
                });
                setContractLoading(false);

                try {
                    const savedProfile = localStorage.getItem("goalie_companion_profile");
                    const savedActiveMission = localStorage.getItem("goalie_companion_active_mission");
                    const savedStep = localStorage.getItem("goalie_companion_step");

                    if (savedProfile) {
                        setProfile(JSON.parse(savedProfile));
                    } else {
                        setProfile(prev => ({
                            ...prev,
                            user_id: generateUUID()
                        }));
                    }
                    if (savedActiveMission) {
                        setMission(JSON.parse(savedActiveMission));
                    }
                    if (savedStep) {
                        setStep(JSON.parse(savedStep) as any);
                    }
                } catch (e) {
                    console.error("Failed to load local storage state", e);
                }
            }
        }
        initData();
    }, [auth.loading, auth.userId]);

    // Save step to Local Storage
    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem("goalie_companion_step", JSON.stringify(step));
        } catch (e) {
            console.error("Failed to save goalie_companion_step state", e);
        }
    }, [step, mounted]);

    // Call pure Coach Engine to generate Mission
    const handleGenerateMission = async () => {
        if (!activeContract) {
            alert("No active contract found. Cannot generate mission.");
            return;
        }

        let dayNumber = 1;
        if (auth.userId) {
            const todayIso = new Date().toISOString().split('T')[0];
            const { count, error } = await supabase
                .from("missions")
                .select("id", { count: "exact", head: true })
                .eq("user_id", auth.userId)
                .eq("contract_id", activeContract.id)
                .lt("mission_date", todayIso);
            
            if (!error && count !== null) {
                dayNumber = count + 1;
            }
        } else {
            dayNumber = (profile.totalCompletedMissions || 0) + 1;
        }

        const dbBottleneckMapping: Record<string, string> = {
            "Landing Quality": "landing_quality",
            "Right-Side Balance": "right_side_balance",
            "Conditioning": "conditioning"
        };
        const mappedBottleneck = dbBottleneckMapping[activeBottleneck] || activeBottleneck;

        const readiness: ReadinessContext = {
            energy,
            soreness: {
                legs: sorenessLegs,
                core: sorenessCore,
                upper: sorenessUpper
            },
            location: environment,
            time_minutes: parseInt(timeAvailable, 10),
            activeBottleneck: mappedBottleneck
        };

        const generated = generateMission(
            profile.user_id,
            profile,
            readiness,
            activeContract.id,
            dayNumber,
            GLADIATORS_KNOWLEDGE_BASE
        );
        setMission(generated);
        setStep("active_mission");
        
        await coachRepository.saveMission(generated);
    };

    // Toggle checklist items in Mission object
    const toggleTaskDone = (blockIndex: number, taskIndex: number) => {
        if (!mission) return;
        const nextBlocks = [...mission.blocks];
        const nextTasks = [...nextBlocks[blockIndex].tasks];
        nextTasks[taskIndex] = {
            ...nextTasks[taskIndex],
            done: !nextTasks[taskIndex].done
        };
        nextBlocks[blockIndex] = {
            ...nextBlocks[blockIndex],
            tasks: nextTasks
        };
        const updatedMission = {
            ...mission,
            blocks: nextBlocks
        };
        setMission(updatedMission);
        
        // Save the updated mission tasks state
        coachRepository.saveMission(updatedMission);
    };

    // Submit Reflection -> Call pure Learning Service -> Update baselines & persist
    const handleCompleteMission = async () => {
        if (!mission) return;

        const reflection: Reflection = {
            reflection_id: generateUUID(),
            mission_id: mission.id,
            athlete_id: profile.user_id,
            energy: reflectEnergy,
            balanceRating: reflectBalance,
            landingRating: reflectLanding,
            conditioningRating: reflectConditioning,
            winToday: reflectWinToday,
            bottleneck: reflectBottleneck,
            tomorrowFocus: reflectTomorrow
        };

        const bottleneckType = mission.bottleneck;

        // Delegate learning processing to learning layer
        const result = processReflection(reflection, profile, bottleneckType);
        
        // Create session representation
        const session: Session = {
            session_id: generateUUID(),
            mission_id: mission.id,
            athlete_id: profile.user_id,
            completed_at: new Date().toISOString(),
            actual_time: mission.readiness.time_minutes,
            completed_blocks: mission.blocks,
            status: "completed",
            source: "mission"
        };

        setLearningResult(result);
        setProfile(result.updatedProfile);
        setStep("learning_archive");

        await coachRepository.completeMissionFlow(session, reflection, result);
    };

    const handleStartNewDay = () => {
        setMission(null);
        setReflectWinToday("");
        setReflectBottleneck("");
        setReflectTomorrow("");
        setSorenessLegs(false);
        setSorenessCore(false);
        setSorenessUpper(false);
        setStep("readiness");
    };

    const handleHardReset = async () => {
        if (confirm("Reset athlete profile and baseline history?")) {
            const nextProfile: AthleteProfile = {
                user_id: auth.userId || generateUUID(),
                baselines: {
                    balance: 4.0,
                    landing: 4.0,
                    conditioning: 4.0
                },
                recentFatigueLevel: "moderate",
                previousMissionCompleted: false,
                totalCompletedMissions: 0,
                learnedInsights: []
            };
            setProfile(nextProfile);
            setMission(null);
            setStep("readiness");
            
            await coachRepository.saveProfile(nextProfile);
            localStorage.removeItem("goalie_companion_active_mission");
        }
    };

    if (!mounted || auth.loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
                <span className="text-xs uppercase tracking-widest text-zinc-400">Syncing Coach Engine...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none antialiased md:h-screen md:max-h-screen md:overflow-hidden print:h-auto print:max-h-none print:bg-white print:text-white">
            
            {/* Top Toolbar (Hidden on Print) */}
            <div className="w-full bg-[#18181B]/80 border-b border-white/5 px-4 py-2 flex items-center justify-between shrink-0 no-print backdrop-blur-md sticky top-0 z-50">
                <button 
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
                >
                    <ArrowLeft size={14} />
                    <span className="font-bold uppercase tracking-wider">Dashboard</span>
                </button>
                
                <div className="flex items-center gap-3">
                    {profile.totalCompletedMissions > 0 && (
                        <span className="text-[9px] font-black uppercase bg-[#7DD3FC]/10 border border-[#7DD3FC]/20 text-[#7DD3FC] px-2 py-0.5 rounded">
                            {profile.totalCompletedMissions} Missions Archived
                        </span>
                    )}
                    <button 
                        onClick={handleHardReset}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-red-400 transition-colors px-2 py-1 rounded bg-white/5"
                    >
                        Reset Engine
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 w-full max-w-[840px] mx-auto flex flex-col justify-center p-2 md:p-3 overflow-y-auto md:overflow-hidden print:p-0 print:w-[8.1in] print:h-[10.6in] print:overflow-hidden print:mx-0">
                
                {contractLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-2">
                        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#7DD3FC] animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#7DD3FC]">Syncing Contract...</span>
                    </div>
                ) : !activeContract ? (
                    <div className="bg-[#18181B] border border-border rounded-2xl p-6 shadow-2xl max-w-lg mx-auto w-full text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-400/10 border border-red-450/30 flex items-center justify-center mx-auto text-red-400">
                            <AlertCircle size={20} />
                        </div>
                        <h1 className="text-xl font-black text-white uppercase tracking-tight">No Active Contract</h1>
                        <p className="text-xs text-zinc-400">
                            You currently do not have an active performance contract assigned. Please reach out to your coach to set up your contract objectives.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* STEP 1: READINESS CHECK-IN */}
                        {step === 'readiness' && (
                            <div className="bg-[#18181B] border border-border rounded-2xl p-4 md:p-6 shadow-2xl space-y-4 max-w-lg mx-auto w-full">
                                <header className="border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006747]">
                                        {activeContract.objective ? activeContract.objective.toUpperCase() : 'READINESS CHECK-IN'}
                                    </span>
                                    <h1 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">Readiness Check-in</h1>
                                    <p className="m-0 text-[11px] text-zinc-400 mt-1">The Coach Engine evaluates these metrics to determine your daily mission.</p>
                                </header>

                        {/* Energy Slider */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
                                <span>Current Energy</span>
                                <span className="text-[#006747]">{energy}/10</span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                                    <button 
                                        key={val}
                                        onClick={() => setEnergy(val)}
                                        className={twMerge(
                                            "flex-1 h-8 rounded-xl font-black text-xs transition-all",
                                            energy === val 
                                                ? "bg-[#006747] hover:bg-[#005238] text-white" 
                                                : "bg-muted hover:bg-muted-foreground/10 text-zinc-400"
                                        )}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            {energy <= 4 && (
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1.5 font-semibold bg-white/5 border border-white/5 p-2 rounded-xl">
                                    <AlertCircle size={12} className="text-zinc-400" />
                                    <span>Daily mission will automatically adapt for active recovery.</span>
                                </div>
                            )}
                        </div>

                        {/* Soreness Select */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400">Targeted Muscle Soreness</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setSorenessLegs(!sorenessLegs)}
                                    className={twMerge(
                                        "py-2 text-center text-[10px] font-black uppercase rounded-xl border transition-all",
                                        sorenessLegs 
                                            ? "bg-[#006747] border-[#006747] text-[#006747]" 
                                            : "bg-transparent border-white/5 text-zinc-400 hover:border-border"
                                    )}
                                >
                                    Legs
                                </button>
                                <button 
                                    onClick={() => setSorenessCore(!sorenessCore)}
                                    className={twMerge(
                                        "py-2 text-center text-[10px] font-black uppercase rounded-xl border transition-all",
                                        sorenessCore 
                                            ? "bg-[#006747] border-[#006747] text-[#006747]" 
                                            : "bg-transparent border-white/5 text-zinc-400 hover:border-border"
                                    )}
                                >
                                    Core
                                </button>
                                <button 
                                    onClick={() => setSorenessUpper(!sorenessUpper)}
                                    className={twMerge(
                                        "py-2 text-center text-[10px] font-black uppercase rounded-xl border transition-all",
                                        sorenessUpper 
                                            ? "bg-[#006747] border-[#006747] text-[#006747]" 
                                            : "bg-transparent border-white/5 text-zinc-400 hover:border-border"
                                    )}
                                >
                                    Upper Body
                                </button>
                            </div>
                        </div>

                        {/* Environment & Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400">Location & Gear</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button 
                                        onClick={() => setEnvironment("home")}
                                        className={twMerge(
                                            "py-2 text-[10px] font-black uppercase rounded-xl border transition-all",
                                            environment === "home" 
                                                ? "bg-[#006747] hover:bg-[#005238] text-white border-white" 
                                                : "bg-transparent border-white/5 text-zinc-400 hover:border-border"
                                        )}
                                    >
                                        Home
                                    </button>
                                    <button 
                                        onClick={() => setEnvironment("gym")}
                                        className={twMerge(
                                            "py-2 text-[10px] font-black uppercase rounded-xl border transition-all",
                                            environment === "gym" 
                                                ? "bg-[#006747] hover:bg-[#005238] text-white border-white" 
                                                : "bg-transparent border-white/5 text-zinc-400 hover:border-border"
                                        )}
                                    >
                                        Gym
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400">Time Available</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button 
                                        onClick={() => setTimeAvailable("30")}
                                        className={twMerge(
                                            "py-2 text-[10px] font-black uppercase rounded-xl border transition-all",
                                            timeAvailable === "30" 
                                                ? "bg-[#006747] hover:bg-[#005238] text-white border-white" 
                                                : "bg-transparent border-white/5 text-zinc-400 hover:border-border"
                                        )}
                                    >
                                        30 Mins
                                    </button>
                                    <button 
                                        onClick={() => setTimeAvailable("60")}
                                        className={twMerge(
                                            "py-2 text-[10px] font-black uppercase rounded-xl border transition-all",
                                            timeAvailable === "60" 
                                                ? "bg-[#006747] hover:bg-[#005238] text-white border-white" 
                                                : "bg-transparent border-white/5 text-zinc-400 hover:border-border"
                                        )}
                                    >
                                        60 Mins
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottleneck Choice */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400">Targeted Bottleneck</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {["Landing Quality", "Right-Side Balance", "Conditioning"].map((opt) => (
                                    <button 
                                        key={opt}
                                        onClick={() => setActiveBottleneck(opt as any)}
                                        className={twMerge(
                                            "py-2 text-[9px] font-black uppercase rounded-xl border transition-all",
                                            activeBottleneck === opt 
                                                ? "bg-[#006747] border-[#006747] text-[#006747]" 
                                                : "bg-transparent border-white/5 text-zinc-400 hover:border-border"
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            onClick={handleGenerateMission}
                            className="w-full py-3.5 bg-[#006747] hover:bg-[#006747]/80 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-98 flex items-center justify-center gap-2 mt-4"
                        >
                            Generate Today&apos;s Mission
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}

                {/* STEP 2: ACTIVE MISSION CARD */}
                {step === 'active_mission' && mission && (
                    <div className="flex-1 flex flex-col justify-between bg-zinc-950/40 border border-border rounded-2xl p-3 md:p-4 relative shadow-2xl overflow-hidden print:bg-white print:border-zinc-800 print:rounded-none print:shadow-none print:p-0 print:border-2">
                        
                        {/* Control buttons */}
                        <div className="absolute top-4 right-4 no-print flex gap-2">
                            <button 
                                onClick={() => setShowExplanation(!showExplanation)}
                                className="bg-white/5 border border-border p-2 rounded-lg hover:bg-muted text-white flex items-center justify-center"
                                title="Toggle Decision Trace"
                            >
                                {showExplanation ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="bg-white/5 border border-border p-2 rounded-lg hover:bg-muted text-white flex items-center justify-center"
                                title="Print Card"
                            >
                                <Printer size={14} />
                            </button>
                        </div>

                        <header className="border-b border-border pb-2 mb-2 print:border-zinc-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-[#006747] uppercase print:text-[#006747]">
                                            {(mission.bottleneck || "ACTIVE").toUpperCase().replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[8px] font-black tracking-wider bg-zinc-850 border border-white/15 text-zinc-300 px-1.5 py-0.5 rounded print:border print:border-zinc-400 print:bg-zinc-100 print:text-zinc-800">DAY {mission.day_number}</span>
                                    </div>
                                    <h1 className="text-lg md:text-2xl font-black text-white leading-tight uppercase tracking-tighter print:text-white">
                                        {mission.title}
                                    </h1>
                                </div>
                            </div>

                            {mission.recovery_notes && (
                                <div className="mt-1 bg-white/5 border border-white/5 text-zinc-400 text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1.5 print:border-zinc-300 print:text-zinc-700">
                                    <AlertCircle size={12} className="text-zinc-500" />
                                    <span>Daily mission will automatically adapt for active recovery.</span>
                                </div>
                            )}

                            <div className="mt-1.5 flex items-center gap-2 bg-[#1E293B]/40 border border-white/5 rounded px-2 py-1 print:bg-zinc-50 print:border-zinc-200">
                                <span className="text-[8px] font-black uppercase text-[#006747] shrink-0 print:text-zinc-700">MISSION:</span>
                                <span className="text-xs font-bold text-zinc-200 print:text-white">{mission.directive}</span>
                            </div>
                        </header>

                        {/* Explainability Log Overlay */}
                        {showExplanation && (
                            <div className="mb-3 bg-white/5 border border-white/5 rounded-xl p-3 no-print space-y-1">
                                <h3 className="text-[9px] font-black uppercase text-[#006747] tracking-wider">Coach Engine Decision Trace</h3>
                                <ul className="list-disc pl-4 space-y-0.5 m-0 text-[10px] text-zinc-300 font-semibold">
                                    {mission.explanation.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* GRID OF SECTIONS */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 overflow-hidden print:grid-cols-2 print:gap-3">
                            
                            {/* LEFT COLUMN */}
                            <div className="flex flex-col gap-2 overflow-hidden print:gap-2">
                                
                                {/* WARMUP PANEL */}
                                {mission.blocks.filter(b => b.id === "block-warmup").map((block, bIdx) => (
                                    <section key={block.id} className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 print:bg-white print:border-zinc-300">
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006747] mb-2 flex items-center justify-between print:text-zinc-800">
                                            <span>{block.title}</span>
                                            <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">{block.subtitle}</span>
                                        </h2>
                                        <div className="grid grid-cols-1 gap-1">
                                            {block.tasks.map((task, tIdx) => (
                                                <div key={tIdx} className="flex items-center gap-2 py-0.5">
                                                    <div className="w-4 h-4 rounded border border-[#006747] text-white bg-[#006747] flex items-center justify-center shrink-0 print:border-zinc-400">
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                    <span className="text-xs font-bold text-zinc-300 print:text-white">{task.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ))}

                                {/* STRENGTH PANEL */}
                                {mission.blocks.filter(b => b.id === "block-strength").map((block, bIdx) => {
                                    const actualBlockIndex = mission.blocks.findIndex(b => b.id === block.id);
                                    return (
                                        <section key={block.id} className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 flex-1 flex flex-col justify-between print:bg-white print:border-zinc-300 print:flex-none">
                                            <div>
                                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006747] mb-2 flex items-center justify-between print:text-zinc-800">
                                                    <span>{block.title}</span>
                                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">{block.subtitle}</span>
                                                </h2>
                                                <div className="w-full text-xs">
                                                    <div className="grid grid-cols-12 border-b border-border pb-1 mb-1 font-black text-zinc-400 uppercase tracking-wider text-[9px] print:border-zinc-300 print:text-zinc-600">
                                                        <div className="col-span-6">Exercise</div>
                                                        <div className="col-span-2 text-center">Sets</div>
                                                        <div className="col-span-2 text-center">Weight</div>
                                                        <div className="col-span-2 text-right">Done</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {block.tasks.map((task, tIdx) => (
                                                            <div 
                                                                key={tIdx}
                                                                onClick={() => toggleTaskDone(actualBlockIndex, tIdx)}
                                                                className="grid grid-cols-12 items-center py-0.5 cursor-pointer group hover:bg-white/5 rounded px-0.5 -mx-0.5 transition-colors print:hover:bg-transparent"
                                                            >
                                                                <div className={twMerge(
                                                                    "col-span-6 font-bold truncate print:text-white",
                                                                    task.done ? "line-through text-zinc-500" : "text-zinc-200"
                                                                )}>
                                                                    {task.name}
                                                                </div>
                                                                <div className="col-span-2 text-center font-bold text-zinc-400 print:text-zinc-700">{task.sets}</div>
                                                                <div className="col-span-2 text-center font-bold text-zinc-300 print:text-white">{task.weight}</div>
                                                                <div className="col-span-2 flex justify-end">
                                                                    <div className={twMerge(
                                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all print:border-zinc-400",
                                                                        task.done 
                                                                            ? "bg-[#006747] border-[#006747] text-white print:bg-[#006747] print:text-white" 
                                                                            : "bg-transparent border-border group-hover:border-white/30"
                                                                    )}>
                                                                        {task.done && <Check size={11} strokeWidth={3} />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    );
                                })}

                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="flex flex-col gap-2 overflow-hidden print:gap-2">
                                
                                {/* ATHLETIC SKILL */}
                                {mission.blocks.filter(b => b.id === "block-athletic").map((block, bIdx) => {
                                    const actualBlockIndex = mission.blocks.findIndex(b => b.id === block.id);
                                    return (
                                        <section key={block.id} className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 print:bg-white print:border-zinc-300">
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006747] mb-2 flex items-center justify-between print:text-zinc-800">
                                                <span>{block.title}</span>
                                                <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">{block.subtitle}</span>
                                            </h2>
                                            {block.tasks.map((task, tIdx) => (
                                                <div 
                                                    key={tIdx}
                                                    onClick={() => toggleTaskDone(actualBlockIndex, tIdx)}
                                                    className="grid grid-cols-12 items-center py-1 cursor-pointer group hover:bg-white/5 rounded px-0.5 -mx-0.5 transition-colors print:hover:bg-transparent"
                                                >
                                                    <div className="col-span-10">
                                                        <div className={twMerge(
                                                            "font-black text-xs print:text-white",
                                                            task.done ? "line-through text-zinc-500" : "text-white"
                                                        )}>
                                                            {task.name}
                                                        </div>
                                                        <div className="text-[9px] text-[#006747] font-bold uppercase mt-0.5 print:text-[#006747]">
                                                            {task.sets}
                                                        </div>
                                                        <div className="text-[9px] text-zinc-400 mt-0.5 print:text-zinc-600">
                                                            {task.weight}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 flex justify-end">
                                                        <div className={twMerge(
                                                            "w-4 h-4 rounded border flex items-center justify-center transition-all print:border-zinc-400",
                                                            task.done 
                                                                ? "bg-[#006747] border-[#006747] text-white print:bg-[#006747] print:text-white" 
                                                                : "bg-transparent border-border group-hover:border-white/30"
                                                        )}>
                                                            {task.done && <Check size={11} strokeWidth={3} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </section>
                                    );
                                })}

                                {/* CORE */}
                                {mission.blocks.filter(b => b.id === "block-core").map((block, bIdx) => {
                                    const actualBlockIndex = mission.blocks.findIndex(b => b.id === block.id);
                                    return (
                                        <section key={block.id} className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 print:bg-white print:border-zinc-300">
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006747] mb-2 flex items-center justify-between print:text-zinc-800">
                                                <span>{block.title}</span>
                                                <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">{block.subtitle}</span>
                                            </h2>
                                            <div className="w-full text-xs">
                                                <div className="grid grid-cols-12 border-b border-border pb-1 mb-1 font-black text-zinc-400 uppercase tracking-wider text-[9px] print:border-zinc-300 print:text-zinc-600">
                                                    <div className="col-span-6">Exercise</div>
                                                    <div className="col-span-3 text-center">Reps</div>
                                                    <div className="col-span-3 text-right">Done</div>
                                                </div>
                                                <div className="space-y-1">
                                                    {block.tasks.map((task, tIdx) => (
                                                        <div 
                                                            key={tIdx}
                                                            onClick={() => toggleTaskDone(actualBlockIndex, tIdx)}
                                                            className="grid grid-cols-12 items-center py-0.5 cursor-pointer group hover:bg-white/5 rounded px-0.5 -mx-0.5 transition-colors print:hover:bg-transparent"
                                                        >
                                                            <div className={twMerge(
                                                                "col-span-6 font-bold truncate print:text-white",
                                                                task.done ? "line-through text-zinc-500" : "text-zinc-200"
                                                             )}>
                                                                {task.name}
                                                            </div>
                                                            <div className="col-span-3 text-center font-bold text-zinc-300 print:text-white">{task.reps}</div>
                                                            <div className="col-span-3 flex justify-end">
                                                                <div className={twMerge(
                                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all print:border-zinc-400",
                                                                    task.done 
                                                                        ? "bg-[#006747] border-[#006747] text-white print:bg-[#006747] print:text-white" 
                                                                        : "bg-transparent border-border group-hover:border-white/30"
                                                                )}>
                                                                    {task.done && <Check size={11} strokeWidth={3} />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>
                                    );
                                })}

                                {/* CONDITIONING */}
                                {mission.blocks.filter(b => b.id === "block-conditioning").map((block, bIdx) => {
                                    const actualBlockIndex = mission.blocks.findIndex(b => b.id === block.id);
                                    return (
                                        <section key={block.id} className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 print:bg-white print:border-zinc-300">
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006747] mb-2 flex items-center justify-between print:text-zinc-800">
                                                <span>{block.title}</span>
                                                <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">{block.subtitle}</span>
                                            </h2>
                                            {block.tasks.map((task, tIdx) => (
                                                <div 
                                                    key={tIdx}
                                                    onClick={() => toggleTaskDone(actualBlockIndex, tIdx)}
                                                    className="flex items-center justify-between bg-black/20 border border-white/5 rounded p-1.5 cursor-pointer group hover:border-border print:bg-zinc-50 print:border-zinc-200"
                                                >
                                                    <div className={twMerge(
                                                        "text-xs font-bold print:text-white",
                                                        task.done ? "line-through text-zinc-500" : "text-zinc-200"
                                                    )}>
                                                        {task.name}
                                                    </div>
                                                    <div className={twMerge(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 print:border-zinc-400",
                                                        task.done 
                                                            ? "bg-[#006747] border-[#006747] text-white print:bg-[#006747] print:text-white" 
                                                            : "bg-transparent border-border group-hover:border-white/30"
                                                    )}>
                                                        {task.done && <Check size={11} strokeWidth={3} />}
                                                    </div>
                                                </div>
                                            ))}
                                        </section>
                                    );
                                })}

                            </div>

                        </div>

                        {/* FOOTER */}
                        <footer className="border-t border-border pt-2 shrink-0 print:border-zinc-300">
                            <div className="grid grid-cols-3 gap-2 items-start">
                                <div className="col-span-2">
                                    <span className="text-[8px] font-black text-[#006747] uppercase tracking-wider block print:text-[#006747]">CURRENT FOCUS</span>
                                    <div className="text-[10px] font-bold text-zinc-300 leading-tight uppercase print:text-white">
                                        Become a better goalie today. Not a stronger lifter.
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-end">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block print:text-zinc-650">BOTTLENECK</span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-tight print:text-white">
                                        {mission.bottleneck.toUpperCase().replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-1.5 border-t border-white/5 pt-1 flex justify-between items-center text-[7px] md:text-[8px] font-sans text-zinc-500 uppercase tracking-tight print:border-zinc-200 print:text-zinc-600">
                                <div>OBJECTIVE: {activeContract.objective ? activeContract.objective.toUpperCase() : 'GENERAL ATHLETIC PERFORMANCE'}</div>
                                <div>FOCUS: {mission.bottleneck.toUpperCase().replace(/_/g, ' ')}</div>
                            </div>

                            {/* Execution Complete button */}
                            <button 
                                onClick={() => setStep("reflection")}
                                className="w-full py-2.5 bg-[#006747] hover:bg-[#006747]/80 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all mt-3 no-print active:scale-98"
                            >
                                Complete Mission
                            </button>
                        </footer>

                    </div>
                )}

                {/* STEP 3: MISSION REFLECTION */}
                {step === 'reflection' && mission && (
                    <div className="bg-[#18181B] border border-border rounded-2xl p-4 md:p-6 shadow-2xl space-y-4 max-w-lg mx-auto w-full">
                        <header className="border-b border-white/5 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FBBF24]">MISSION COMPLETED</span>
                            <h1 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">Mission Reflection</h1>
                            <p className="m-0 text-[11px] text-zinc-400 mt-1">Briefly log today&apos;s observations. The Coach interprets these values to update your profile.</p>
                        </header>

                        {/* Dynamic Bottleneck Score check */}
                        {mission.blocks.find(b => b.id === "block-athletic")?.tasks[0].name === "Box Jumps" && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
                                    <span>Landing Quality Rating</span>
                                    <span className="text-[#7DD3FC]">{reflectLanding}/10</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                                        <button 
                                            key={v}
                                            onClick={() => setReflectLanding(v)}
                                            className={twMerge(
                                                "flex-1 h-8 rounded font-black text-xs transition-colors",
                                                reflectLanding === v ? "bg-[#7DD3FC] text-white" : "bg-muted hover:bg-muted-foreground/10"
                                            )}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mission.blocks.find(b => b.id === "block-athletic")?.tasks[0].name === "Skater Jumps" && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
                                    <span>Right-Side Balance Rating</span>
                                    <span className="text-[#7DD3FC]">{reflectBalance}/10</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                                        <button 
                                            key={v}
                                            onClick={() => setReflectBalance(v)}
                                            className={twMerge(
                                                "flex-1 h-8 rounded font-black text-xs transition-colors",
                                                reflectBalance === v ? "bg-[#7DD3FC] text-white" : "bg-muted hover:bg-muted-foreground/10"
                                            )}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mission.blocks.find(b => b.id === "block-athletic")?.tasks[0].name === "Shadow Crease Work" && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
                                    <span>Aerobic Index Rating</span>
                                    <span className="text-[#7DD3FC]">{reflectConditioning}/10</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                                        <button 
                                            key={v}
                                            onClick={() => setReflectConditioning(v)}
                                            className={twMerge(
                                                "flex-1 h-8 rounded font-black text-xs transition-colors",
                                                reflectConditioning === v ? "bg-[#7DD3FC] text-white" : "bg-muted hover:bg-muted-foreground/10"
                                            )}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* General fatigue reflection */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
                                <span>Energy Level Post-Mission</span>
                                <span className="text-[#7DD3FC]">{reflectEnergy}/10</span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                                    <button 
                                        key={v}
                                        onClick={() => setReflectEnergy(v)}
                                        className={twMerge(
                                            "flex-1 h-8 rounded font-black text-xs transition-colors",
                                            reflectEnergy === v ? "bg-[#7DD3FC] text-white" : "bg-muted hover:bg-muted-foreground/10"
                                        )}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Note Fields */}
                        <div className="space-y-2">
                            <div className="flex flex-col border-b border-white/5 pb-1">
                                <label className="text-[9px] font-black uppercase text-zinc-400 mb-0.5">BIGGEST WIN TODAY:</label>
                                <input 
                                    type="text" 
                                    value={reflectWinToday}
                                    onChange={(e) => setReflectWinToday(e.target.value)}
                                    className="w-full bg-transparent text-xs font-bold text-white outline-none border-none p-0 min-h-0"
                                    placeholder="Brief note..."
                                />
                            </div>
                            <div className="flex flex-col border-b border-white/5 pb-1">
                                <label className="text-[9px] font-black uppercase text-zinc-400 mb-0.5">CURRENT BOTTLENECK:</label>
                                <input 
                                    type="text" 
                                    value={reflectBottleneck}
                                    onChange={(e) => setReflectBottleneck(e.target.value)}
                                    className="w-full bg-transparent text-xs font-bold text-white outline-none border-none p-0 min-h-0"
                                    placeholder="What held you back?"
                                />
                            </div>
                            <div className="flex flex-col border-b border-white/5 pb-1">
                                <label className="text-[9px] font-black uppercase text-zinc-400 mb-0.5">TOMORROW&apos;S PREPARATION:</label>
                                <input 
                                    type="text" 
                                    value={reflectTomorrow}
                                    onChange={(e) => setReflectTomorrow(e.target.value)}
                                    className="w-full bg-transparent text-xs font-bold text-white outline-none border-none p-0 min-h-0"
                                    placeholder="One sentence plan..."
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleCompleteMission}
                            className="w-full py-3.5 bg-[#FBBF24] hover:bg-yellow-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-98"
                        >
                            Archive Mission & Update Model
                        </button>
                    </div>
                )}

                {/* STEP 4: LEARNING & ARCHIVE SUMMARY */}
                {step === 'learning_archive' && learningResult && (
                    <div className="bg-[#18181B] border border-border rounded-2xl p-4 md:p-6 shadow-2xl space-y-4 max-w-lg mx-auto w-full">
                        <header className="border-b border-white/5 pb-2 text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-[#FBBF24]/30 flex items-center justify-center mx-auto mb-2 text-[#FBBF24]">
                                <Sparkles size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FBBF24]">MISSION COMPLETED & ARCHIVED</span>
                            <h1 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">Model Learning Summary</h1>
                            <p className="m-0 text-[11px] text-zinc-400 mt-1">The Coach analyzed today&apos;s observations and updated your profile parameters.</p>
                        </header>

                        {/* Baseline parameter changes */}
                        <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2">
                            <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Baseline Parameters Updated</h3>
                            
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 border border-white/5 rounded text-center">
                                    <span className="text-[8px] font-black text-zinc-500 block uppercase">BALANCE</span>
                                    <span className="text-sm font-black text-white">{learningResult.updatedProfile.baselines.balance.toFixed(1)}</span>
                                    {learningResult.deltas.balanceDelta > 0 && <span className="text-[8px] font-black text-emerald-400 block">+0.5</span>}
                                    {learningResult.deltas.balanceDelta < 0 && <span className="text-[8px] font-black text-red-400 block">-0.2</span>}
                                </div>
                                <div className="p-2 border border-white/5 rounded text-center">
                                    <span className="text-[8px] font-black text-zinc-500 block uppercase">LANDING</span>
                                    <span className="text-sm font-black text-white">{learningResult.updatedProfile.baselines.landing.toFixed(1)}</span>
                                    {learningResult.deltas.landingDelta > 0 && <span className="text-[8px] font-black text-emerald-400 block">+0.5</span>}
                                    {learningResult.deltas.landingDelta < 0 && <span className="text-[8px] font-black text-red-400 block">-0.2</span>}
                                </div>
                                <div className="p-2 border border-white/5 rounded text-center">
                                    <span className="text-[8px] font-black text-zinc-500 block uppercase">AEROBIC</span>
                                    <span className="text-sm font-black text-white">{learningResult.updatedProfile.baselines.conditioning.toFixed(1)}</span>
                                    {learningResult.deltas.conditioningDelta > 0 && <span className="text-[8px] font-black text-emerald-400 block">+0.5</span>}
                                    {learningResult.deltas.conditioningDelta < 0 && <span className="text-[8px] font-black text-red-400 block">-0.2</span>}
                                </div>
                            </div>
                        </div>

                        {/* Coach learned insights log */}
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Coach Insights Learned Today</h3>
                            <ul className="space-y-1.5 m-0 p-0 list-none">
                                {learningResult.insights.map((insight, idx) => (
                                    <li key={idx} className="text-xs text-zinc-300 font-semibold bg-[#1E293B]/20 border border-white/5 p-2 rounded flex items-start gap-2 animate-fadeIn">
                                        <span className="text-[#FBBF24] font-black select-none mt-0.5">•</span>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-2 border-t border-white/5 text-center">
                            <button 
                                onClick={handleStartNewDay}
                                className="px-5 py-2.5 bg-[#006747] hover:bg-[#005238] text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all hover:bg-neutral-200 active:scale-95 shadow-md cursor-pointer"
                            >
                                Fast-forward to Tomorrow&apos;s Mission
                            </button>
                        </div>
                    </div>
                )}

                    </>
                )}
            </div>
            
            {/* Custom stylesheet specifically to force high contrast layout and fit on exactly 1 letter page */}
            <style jsx global>{`
                @media print {
                    /* Root reset for printing */
                    html, body {
                        background: #fff !important;
                        color: #000 !important;
                        width: 8.5in;
                        height: 11in;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide header bar */
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
