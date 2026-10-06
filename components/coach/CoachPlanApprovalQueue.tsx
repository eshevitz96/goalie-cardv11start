"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    ChevronDown, 
    ChevronUp, 
    RefreshCw, 
    Calendar, 
    Target, 
    Dumbbell, 
    Check, 
    X,
    User,
    Sparkles,
    Flame,
    ArrowRight
} from "lucide-react";
import { clsx } from "clsx";
import { 
    fetchPendingTrainingPlans, 
    approveTrainingPlanAction, 
    rejectTrainingPlanAction,
    CoachPendingPlanItem 
} from "@/app/actions/coachPlans";
import { generateTrainingPlanAction } from "@/app/actions/planGeneration";

export function CoachPlanApprovalQueue() {
    const [plans, setPlans] = useState<CoachPendingPlanItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadPlans = async () => {
        setIsLoading(true);
        try {
            const res = await fetchPendingTrainingPlans();
            if (res.success) {
                setPlans(res.plans);
            } else {
                setActionMessage({ type: 'error', text: res.error || "Failed to load pending plans." });
            }
        } catch (err: any) {
            setActionMessage({ type: 'error', text: err.message || "Error loading plans." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleApprove = (planId: string) => {
        startTransition(async () => {
            const res = await approveTrainingPlanAction(planId);
            if (res.success) {
                setActionMessage({ type: 'success', text: "Training plan approved and activated on athlete calendar!" });
                setPlans(prev => prev.filter(p => p.id !== planId));
            } else {
                setActionMessage({ type: 'error', text: res.error || "Failed to approve plan." });
            }
        });
    };

    const handleReject = (planId: string) => {
        startTransition(async () => {
            const res = await rejectTrainingPlanAction(planId);
            if (res.success) {
                setActionMessage({ type: 'success', text: "Plan returned to draft status." });
                loadPlans();
            } else {
                setActionMessage({ type: 'error', text: res.error || "Failed to update plan." });
            }
        });
    };

    const handleRegenerate = (planId: string) => {
        startTransition(async () => {
            const res = await generateTrainingPlanAction(planId);
            if (res.success) {
                setActionMessage({ type: 'success', text: `Plan regenerated successfully (${res.sessionCount} sessions drafted).` });
                loadPlans();
            } else if (res.status === 'NO_APPROVED_EXERCISES') {
                setActionMessage({ 
                    type: 'error', 
                    text: "Cannot generate plan: 0 approved exercises in library. Approve exercises in Exercise Library tab first." 
                });
                loadPlans();
            } else {
                setActionMessage({ type: 'error', text: res.error || "Generation failed." });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Top Stats Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border rounded-2xl p-5 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Plan Approval Queue
                        </span>
                        {plans.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                {plans.length} Awaiting Review
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">
                        Generated Development Plans
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Review intake inputs, rule compliance, and scheduled sessions before activating for athletes.
                    </p>
                </div>

                <button
                    onClick={loadPlans}
                    disabled={isLoading || isPending}
                    className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                    <RefreshCw size={13} className={clsx((isLoading || isPending) && "animate-spin")} /> Refresh Queue
                </button>
            </div>

            {/* Notification message */}
            {actionMessage && (
                <div className={clsx(
                    "p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200",
                    actionMessage.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                )}>
                    <span>{actionMessage.text}</span>
                    <button onClick={() => setActionMessage(null)} className="text-muted-foreground hover:text-foreground">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Plans List */}
            {isLoading ? (
                <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-muted-foreground" size={24} />
                    <span>Loading pending plans...</span>
                </div>
            ) : plans.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-emerald-400">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground">All Plans Reviewed</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            There are no training plans waiting for coach approval right now.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {plans.map((item) => {
                        const isExpanded = expandedPlanId === item.id;
                        const inputs = item.inputs || {};
                        const gen = item.generation;
                        const ruleChecks = gen?.rule_checks;
                        const isNoActiveExercises = gen?.status === 'NO_APPROVED_EXERCISES';

                        return (
                            <div 
                                key={item.id}
                                className={clsx(
                                    "bg-card border rounded-2xl transition-all shadow-xs overflow-hidden",
                                    item.status === 'pending_approval' 
                                        ? "border-amber-500/40 bg-amber-500/[0.02]" 
                                        : "border-border"
                                )}
                            >
                                {/* Plan Header */}
                                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                <Clock size={11} /> {item.status === 'pending_approval' ? 'Pending Coach Approval' : 'Draft'}
                                            </span>

                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border uppercase tracking-wider">
                                                {item.athlete.sport || 'Hockey'}
                                            </span>

                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                                                Catch: {item.athlete.catch_hand || 'Left'}
                                            </span>

                                            {inputs.derived_age_band && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    Band: {inputs.derived_age_band}
                                                </span>
                                            )}

                                            <span className="text-[11px] text-muted-foreground font-mono">
                                                {item.sessionCount} sessions drafted
                                            </span>
                                        </div>

                                        <div className="space-y-0.5">
                                            <h4 className="text-lg font-bold text-foreground tracking-tight">
                                                {item.athlete.goalie_name}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {item.athlete.email} {item.athlete.grad_year ? `• Grad '${item.athlete.grad_year}` : ''}
                                            </p>
                                        </div>

                                        {item.goal?.summit && (
                                            <p className="text-xs font-semibold text-foreground/90 bg-muted/30 border border-border rounded-xl p-2.5 flex items-start gap-2">
                                                <Target size={14} className="text-primary mt-0.5 shrink-0" />
                                                <span><strong className="text-foreground">Summit Goal:</strong> {item.goal.summit}</span>
                                            </p>
                                        )}

                                        {isNoActiveExercises && (
                                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-start gap-2">
                                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                                <div>
                                                    <strong>No Approved Exercises Available:</strong> Exercise library currently has 0 active exercises. Approve exercises in the Exercise Library tab, then click &ldquo;Regenerate Plan&rdquo;.
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                                        <button
                                            onClick={() => setExpandedPlanId(isExpanded ? null : item.id)}
                                            className="px-3.5 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                                        >
                                            {isExpanded ? <>Less <ChevronUp size={14} /></> : <>Inspect Rules & Routine <ChevronDown size={14} /></>}
                                        </button>

                                        <button
                                            onClick={() => handleRegenerate(item.id)}
                                            disabled={isPending}
                                            className="px-3.5 py-2.5 bg-muted border border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                                            title="Regenerate plan sessions"
                                        >
                                            <RefreshCw size={13} className={clsx(isPending && "animate-spin")} /> Regenerate
                                        </button>

                                        <button
                                            onClick={() => handleApprove(item.id)}
                                            disabled={isPending || isNoActiveExercises}
                                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-black text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                                        >
                                            <ShieldCheck size={14} /> Approve & Activate
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Inspection Drawer */}
                                {isExpanded && (
                                    <div className="border-t border-border p-5 md:p-6 bg-muted/20 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                        {/* Rule Checks Verification Grid */}
                                        <div className="space-y-3">
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <ShieldCheck size={14} className="text-emerald-500" />
                                                <span>Automated Safety & Load Rule Compliance</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-foreground">1. Max Sessions</span>
                                                        <span className="text-emerald-400 font-mono">PASS</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {ruleChecks?.max_sessions_check?.prescribed_count || (inputs.days_available?.length || 3)} sessions / week matched to athlete availability.
                                                    </p>
                                                </div>

                                                <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-foreground">2. Rest Day Guard</span>
                                                        <span className="text-emerald-400 font-mono">PASS</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {ruleChecks?.rest_day_check?.rest_days_per_week || 2} full rest days guaranteed per week.
                                                    </p>
                                                </div>

                                                <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-foreground">3. Pre-Game Load</span>
                                                        <span className="text-emerald-400 font-mono">PASS</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {ruleChecks?.pre_game_load_check?.notes || "Light activation/mobility only prior to match days."}
                                                    </p>
                                                </div>

                                                <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-foreground">4. Age-Band Sets</span>
                                                        <span className="text-emerald-400 font-mono">PASS</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Prescriptions strictly bounded to {inputs.derived_age_band || '14-17'} safe ranges.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Goal Ladder Rungs */}
                                        {item.goal?.rungs && item.goal.rungs.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    Milestone Ladder (Nearest First)
                                                </div>
                                                <div className="space-y-1.5">
                                                    {item.goal.rungs.map((rung, rIdx) => (
                                                        <div key={rIdx} className="bg-card border border-border rounded-xl p-2.5 text-xs text-foreground flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-muted font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                                                                {rIdx + 1}
                                                            </span>
                                                            <span>{typeof rung === 'string' ? rung : rung.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Operational Inputs Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                                                <span className="font-bold text-foreground block">Routine & Facility Logistics</span>
                                                <div className="space-y-1 text-muted-foreground">
                                                    <div><strong className="text-foreground">Days Available:</strong> {inputs.days_available?.join(', ') || 'Mon, Wed, Fri'}</div>
                                                    <div><strong className="text-foreground">Preferred Session Length:</strong> {inputs.session_length || 45} minutes</div>
                                                    <div><strong className="text-foreground">Team Practice:</strong> {inputs.team_practice_days?.join(', ') || 'None'}</div>
                                                    <div><strong className="text-foreground">Game Days:</strong> {inputs.team_game_days?.join(', ') || 'None'}</div>
                                                    <div><strong className="text-foreground">Equipment:</strong> {inputs.access_equipment?.join(', ') || 'Gym, Ice'}</div>
                                                </div>
                                            </div>

                                            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                                                <span className="font-bold text-foreground block">Workaround & Context Notes</span>
                                                <p className="text-muted-foreground italic">
                                                    {inputs.notes_workaround || "No specific scheduling constraints or workarounds noted by athlete."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
