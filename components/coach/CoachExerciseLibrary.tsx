"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    Dumbbell, 
    CheckCircle2, 
    Clock, 
    Search, 
    Plus, 
    ShieldCheck, 
    RefreshCw, 
    ChevronDown, 
    ChevronUp, 
    Sparkles, 
    AlertCircle, 
    Check, 
    X,
    Flame,
    Zap,
    Activity,
    SlidersHorizontal,
    Layers
} from "lucide-react";
import { clsx } from "clsx";
import { 
    getExerciseLibrary, 
    toggleExerciseApprovalAction, 
    batchApproveExercisesAction, 
    seedCanonicalExercisesAction,
    createExerciseAction,
    ExerciseRecord 
} from "@/app/actions/exerciseLibrary";
import { ExerciseRanges } from "@/lib/data/exerciseSeedData";

interface CoachExerciseLibraryProps {
    coachId?: string | null;
}

export function CoachExerciseLibrary({ coachId }: CoachExerciseLibraryProps) {
    const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedSport, setSelectedSport] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>("all");
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state for creating a new exercise
    const [newExercise, setNewExercise] = useState({
        name: "",
        category: "strength",
        sport: "all",
        equipment: "bodyweight",
        cues: "",
        under14_sets: "2-3",
        under14_reps: "8-10",
        under14_intensity: "Bodyweight / Light form emphasis",
        under14_notes: "Focus on motor control and balance.",
        band1417_sets: "3-4",
        band1417_reps: "6-8",
        band1417_intensity: "Moderate resistance",
        band1417_notes: "Build structural strength and control.",
        adult_sets: "4",
        adult_reps: "5-8",
        adult_intensity: "Working load / explosive intent",
        adult_notes: "Sport-specific power output."
    });

    const loadExercises = async () => {
        setIsLoading(true);
        try {
            const res = await getExerciseLibrary({
                category: selectedCategory,
                sport: selectedSport,
                status: selectedStatus,
                search: searchQuery
            });

            if (res.success) {
                setExercises(res.exercises);
            } else {
                setActionMessage({ type: 'error', text: res.error || "Failed to load exercises." });
            }
        } catch (err: any) {
            setActionMessage({ type: 'error', text: err.message || "Failed to fetch exercise library." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadExercises();
    }, [selectedCategory, selectedSport, selectedStatus]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadExercises();
    };

    const handleToggleApproval = async (exerciseId: string, currentStatus: boolean) => {
        const nextStatus = !currentStatus;
        
        // Optimistic UI update
        setExercises(prev => prev.map(ex => 
            ex.id === exerciseId ? { ...ex, is_active: nextStatus, approved_by: nextStatus ? (coachId || 'coach') : null } : ex
        ));

        startTransition(async () => {
            const res = await toggleExerciseApprovalAction(exerciseId, nextStatus);
            if (res.success) {
                setActionMessage({ 
                    type: 'success', 
                    text: nextStatus ? "Exercise approved and activated." : "Exercise set to inactive." 
                });
            } else {
                // Revert on failure
                setExercises(prev => prev.map(ex => 
                    ex.id === exerciseId ? { ...ex, is_active: currentStatus } : ex
                ));
                setActionMessage({ type: 'error', text: res.error || "Failed to update exercise status." });
            }
        });
    };

    const handleBatchApproveAll = async () => {
        const inactiveIds = exercises.filter(e => !e.is_active).map(e => e.id);
        if (inactiveIds.length === 0) return;

        if (!confirm(`Approve all ${inactiveIds.length} pending exercises for athlete workouts?`)) {
            return;
        }

        // Optimistic update
        setExercises(prev => prev.map(ex => ({ ...ex, is_active: true })));

        startTransition(async () => {
            const res = await batchApproveExercisesAction(inactiveIds);
            if (res.success) {
                setActionMessage({ type: 'success', text: `Approved ${res.count} exercises!` });
                loadExercises();
            } else {
                setActionMessage({ type: 'error', text: res.error || "Batch approval failed." });
                loadExercises();
            }
        });
    };

    const handleSeedCanonical = async () => {
        startTransition(async () => {
            const res = await seedCanonicalExercisesAction();
            if (res.success) {
                setActionMessage({ 
                    type: 'success', 
                    text: res.inserted > 0 ? `Seeded ${res.inserted} canonical exercises!` : "Exercise library is already populated." 
                });
                loadExercises();
            } else {
                setActionMessage({ type: 'error', text: res.error || "Seeding failed." });
            }
        });
    };

    const handleCreateExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExercise.name.trim()) return;

        const ranges: ExerciseRanges = {
            "under-14": {
                sets: newExercise.under14_sets,
                reps: newExercise.under14_reps,
                intensity: newExercise.under14_intensity,
                notes: newExercise.under14_notes
            },
            "14-17": {
                sets: newExercise.band1417_sets,
                reps: newExercise.band1417_reps,
                intensity: newExercise.band1417_intensity,
                notes: newExercise.band1417_notes
            },
            "18+": {
                sets: newExercise.adult_sets,
                reps: newExercise.adult_reps,
                intensity: newExercise.adult_intensity,
                notes: newExercise.adult_notes
            }
        };

        const equipmentArr = newExercise.equipment
            .split(',')
            .map(eq => eq.trim())
            .filter(Boolean);

        const cuesArr = newExercise.cues
            .split('\n')
            .map(c => c.trim())
            .filter(Boolean);

        startTransition(async () => {
            const res = await createExerciseAction({
                name: newExercise.name.trim(),
                category: newExercise.category,
                sport: newExercise.sport,
                equipment: equipmentArr,
                cues: cuesArr,
                ranges,
                is_active: false // Newly inserted exercises start inactive per project rules
            });

            if (res.success && res.exercise) {
                setIsCreateModalOpen(false);
                setExercises(prev => [res.exercise!, ...prev]);
                setActionMessage({ type: 'success', text: `Created "${newExercise.name}". Ready for review.` });
                setNewExercise({
                    name: "",
                    category: "strength",
                    sport: "all",
                    equipment: "bodyweight",
                    cues: "",
                    under14_sets: "2-3",
                    under14_reps: "8-10",
                    under14_intensity: "Bodyweight / Light form emphasis",
                    under14_notes: "Focus on motor control and balance.",
                    band1417_sets: "3-4",
                    band1417_reps: "6-8",
                    band1417_intensity: "Moderate resistance",
                    band1417_notes: "Build structural strength and control.",
                    adult_sets: "4",
                    adult_reps: "5-8",
                    adult_intensity: "Working load / explosive intent",
                    adult_notes: "Sport-specific power output."
                });
            } else {
                setActionMessage({ type: 'error', text: res.error || "Failed to create exercise." });
            }
        });
    };

    const pendingCount = exercises.filter(e => !e.is_active).length;
    const activeCount = exercises.filter(e => e.is_active).length;

    const filteredExercises = exercises.filter(e => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            e.name.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            (Array.isArray(e.equipment) && e.equipment.some(eq => eq.toLowerCase().includes(q)))
        );
    });

    const categoryColors: Record<string, string> = {
        mobility: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        strength: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        power: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        reaction: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        sport: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        recovery: "bg-rose-500/10 text-rose-400 border-rose-500/30"
    };

    return (
        <div className="space-y-6">
            {/* Top Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1 text-xs uppercase font-bold tracking-wider">
                        <span>Total Library</span>
                        <Dumbbell size={16} />
                    </div>
                    <div className="text-3xl font-black text-foreground">{exercises.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Movement catalog</div>
                </div>

                <div className="bg-card border border-amber-500/30 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-amber-500 mb-1 text-xs uppercase font-bold tracking-wider">
                        <span>Pending Review</span>
                        <Clock size={16} />
                    </div>
                    <div className="text-3xl font-black text-amber-400">{pendingCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">Requires coach approval</div>
                </div>

                <div className="bg-card border border-emerald-500/30 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-emerald-500 mb-1 text-xs uppercase font-bold tracking-wider">
                        <span>Active / Approved</span>
                        <CheckCircle2 size={16} />
                    </div>
                    <div className="text-3xl font-black text-emerald-400">{activeCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">Available for workouts</div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center gap-2 shadow-xs">
                    <button
                        onClick={handleBatchApproveAll}
                        disabled={pendingCount === 0 || isPending}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <ShieldCheck size={14} /> Approve All Pending ({pendingCount})
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 py-2 px-3 rounded-xl bg-muted border border-border hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                        >
                            <Plus size={13} /> Add Exercise
                        </button>
                        <button
                            onClick={handleSeedCanonical}
                            disabled={isPending}
                            title="Sync canonical goalie exercise seeds"
                            className="py-2 px-3 rounded-xl bg-muted border border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors flex items-center justify-center"
                        >
                            <RefreshCw size={13} className={clsx(isPending && "animate-spin")} />
                        </button>
                    </div>
                </div>
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

            {/* Filter and Search Bar */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* Search input */}
                    <form onSubmit={handleSearch} className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search exercises, cues, equipment..."
                            className="w-full bg-muted/60 border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                        />
                    </form>

                    {/* Filter controls */}
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
                        {/* Status Filter */}
                        <div className="flex bg-muted/60 p-1 rounded-xl border border-border text-xs">
                            <button
                                onClick={() => setSelectedStatus('all')}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                                    selectedStatus === 'all' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                All Status
                            </button>
                            <button
                                onClick={() => setSelectedStatus('inactive')}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1",
                                    selectedStatus === 'inactive' ? "bg-background text-amber-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Pending ({pendingCount})
                            </button>
                            <button
                                onClick={() => setSelectedStatus('active')}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1",
                                    selectedStatus === 'active' ? "bg-background text-emerald-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Active ({activeCount})
                            </button>
                        </div>

                        {/* Sport Filter */}
                        <select
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                            className="bg-muted/60 border border-border rounded-xl py-2 px-3 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Sports</option>
                            <option value="hockey">Ice Hockey</option>
                            <option value="lacrosse">Lacrosse</option>
                        </select>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                        { id: "all", label: "All Categories" },
                        { id: "mobility", label: "Mobility & Hips" },
                        { id: "strength", label: "Strength & Structure" },
                        { id: "power", label: "Power & Deceleration" },
                        { id: "reaction", label: "Reaction & Tracking" },
                        { id: "sport", label: "Sport Mechanics" },
                        { id: "recovery", label: "Recovery & Tissue" }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={clsx(
                                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                                selectedCategory === cat.id 
                                    ? "bg-foreground text-background shadow-xs" 
                                    : "bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Exercise List */}
            {isLoading ? (
                <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-muted-foreground" size={24} />
                    <span>Loading exercise library...</span>
                </div>
            ) : filteredExercises.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <Dumbbell size={20} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground">No Exercises Found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            No exercises match your filter criteria. Try resetting your search or seeding the canonical drills.
                        </p>
                    </div>
                    <button
                        onClick={handleSeedCanonical}
                        className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-xl hover:bg-foreground/90 transition-all"
                    >
                        Seed Canonical Exercises
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredExercises.map((exercise) => {
                        const isExpanded = expandedCardId === exercise.id;
                        const cuesList = Array.isArray(exercise.cues) 
                            ? exercise.cues 
                            : typeof exercise.cues === 'string' 
                                ? (exercise.cues as string).split('\n').filter(Boolean)
                                : [];

                        const ranges = exercise.ranges || {
                            "under-14": { sets: "2-3", reps: "8-10", intensity: "Bodyweight", notes: "Safe motor control" },
                            "14-17": { sets: "3-4", reps: "6-8", intensity: "Moderate", notes: "Build strength" },
                            "18+": { sets: "4", reps: "5-8", intensity: "Working load", notes: "Power transfer" }
                        };

                        return (
                            <div 
                                key={exercise.id}
                                className={clsx(
                                    "bg-card border rounded-2xl transition-all shadow-xs overflow-hidden",
                                    exercise.is_active 
                                        ? "border-border hover:border-foreground/30" 
                                        : "border-amber-500/30 bg-amber-500/[0.02]"
                                )}
                            >
                                {/* Header / Summary row */}
                                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Status Badge */}
                                            {exercise.is_active ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                    <Check size={11} strokeWidth={3} /> Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                                                    <AlertCircle size={11} /> Inactive / Pending Review
                                                </span>
                                            )}

                                            {/* Category Tag */}
                                            <span className={clsx(
                                                "px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider",
                                                categoryColors[exercise.category] || "bg-muted text-muted-foreground border-border"
                                            )}>
                                                {exercise.category}
                                            </span>

                                            {/* Sport Tag */}
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border capitalize">
                                                {exercise.sport === 'all' ? 'All Sports' : exercise.sport}
                                            </span>

                                            {/* Equipment Tags */}
                                            {Array.isArray(exercise.equipment) && exercise.equipment.map((eq, i) => (
                                                <span key={i} className="text-[11px] text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded-md border border-border">
                                                    {eq}
                                                </span>
                                            ))}
                                        </div>

                                        <h4 className="text-base font-bold text-foreground tracking-tight">
                                            {exercise.name}
                                        </h4>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <button
                                            onClick={() => setExpandedCardId(isExpanded ? null : exercise.id)}
                                            className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                                        >
                                            {isExpanded ? <>Less <ChevronUp size={14} /></> : <>Age Bands & Cues <ChevronDown size={14} /></>}
                                        </button>

                                        <button
                                            onClick={() => handleToggleApproval(exercise.id, exercise.is_active)}
                                            disabled={isPending}
                                            className={clsx(
                                                "px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95",
                                                exercise.is_active
                                                    ? "bg-muted border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30"
                                                    : "bg-emerald-500 hover:bg-emerald-600 text-black shadow-sm"
                                            )}
                                        >
                                            {exercise.is_active ? (
                                                <>Deactivate</>
                                            ) : (
                                                <><Check size={14} strokeWidth={3} /> Approve Exercise</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details: Age Bands & Cues */}
                                {isExpanded && (
                                    <div className="border-t border-border p-4 md:p-6 bg-muted/20 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                        {/* Age Band Safe Ranges */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                <ShieldCheck size={14} className="text-emerald-500" />
                                                <span>Safe Age-Band Prescription Ranges</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {/* Under 14 */}
                                                <div className="bg-card border border-border rounded-xl p-3.5 space-y-1.5 shadow-xs">
                                                    <div className="flex items-center justify-between border-b border-border pb-1">
                                                        <span className="text-xs font-bold text-foreground">Under-14 Band</span>
                                                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Foundation</span>
                                                    </div>
                                                    <div className="text-xs text-foreground/90">
                                                        <span className="font-semibold text-muted-foreground">Sets & Reps:</span> {ranges["under-14"]?.sets || "2-3"} × {ranges["under-14"]?.reps || "8-10"}
                                                    </div>
                                                    <div className="text-xs text-foreground/90">
                                                        <span className="font-semibold text-muted-foreground">Intensity:</span> {ranges["under-14"]?.intensity || "Bodyweight"}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-snug pt-1">
                                                        {ranges["under-14"]?.notes || "Focus on motor control and balance."}
                                                    </p>
                                                </div>

                                                {/* 14-17 */}
                                                <div className="bg-card border border-border rounded-xl p-3.5 space-y-1.5 shadow-xs">
                                                    <div className="flex items-center justify-between border-b border-border pb-1">
                                                        <span className="text-xs font-bold text-foreground">14–17 Band</span>
                                                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">Progression</span>
                                                    </div>
                                                    <div className="text-xs text-foreground/90">
                                                        <span className="font-semibold text-muted-foreground">Sets & Reps:</span> {ranges["14-17"]?.sets || "3-4"} × {ranges["14-17"]?.reps || "6-8"}
                                                    </div>
                                                    <div className="text-xs text-foreground/90">
                                                        <span className="font-semibold text-muted-foreground">Intensity:</span> {ranges["14-17"]?.intensity || "Moderate resistance"}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-snug pt-1">
                                                        {ranges["14-17"]?.notes || "Build foundational strength and eccentric control."}
                                                    </p>
                                                </div>

                                                {/* 18+ */}
                                                <div className="bg-card border border-border rounded-xl p-3.5 space-y-1.5 shadow-xs">
                                                    <div className="flex items-center justify-between border-b border-border pb-1">
                                                        <span className="text-xs font-bold text-foreground">18+ Collegiate / Pro</span>
                                                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Peak Power</span>
                                                    </div>
                                                    <div className="text-xs text-foreground/90">
                                                        <span className="font-semibold text-muted-foreground">Sets & Reps:</span> {ranges["18+"]?.sets || "4-5"} × {ranges["18+"]?.reps || "5-8"}
                                                    </div>
                                                    <div className="text-xs text-foreground/90">
                                                        <span className="font-semibold text-muted-foreground">Intensity:</span> {ranges["18+"]?.intensity || "Working load"}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-snug pt-1">
                                                        {ranges["18+"]?.notes || "Sport-specific power output and high force development."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coaching & Execution Cues */}
                                        {cuesList.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    Coaching Points & Form Cues
                                                </div>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {cuesList.map((cue, idx) => (
                                                        <li key={idx} className="text-xs text-muted-foreground bg-card border border-border rounded-lg p-2.5 flex items-start gap-2">
                                                            <span className="text-primary font-bold">•</span>
                                                            <span className="leading-snug">{cue}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Custom Exercise Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-card border border-border rounded-3xl w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Add New Goalie Exercise</h3>
                                <p className="text-xs text-muted-foreground">
                                    Exercise will be saved as inactive until coach approval.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateExercise} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Exercise Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newExercise.name}
                                    onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                                    placeholder="e.g. Lateral Hurdle Bounds to Stick Lock"
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Category</label>
                                    <select
                                        value={newExercise.category}
                                        onChange={e => setNewExercise({ ...newExercise, category: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                                    >
                                        <option value="mobility">Mobility</option>
                                        <option value="strength">Strength</option>
                                        <option value="power">Power</option>
                                        <option value="reaction">Reaction</option>
                                        <option value="sport">Sport Mechanics</option>
                                        <option value="recovery">Recovery</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Sport</label>
                                    <select
                                        value={newExercise.sport}
                                        onChange={e => setNewExercise({ ...newExercise, sport: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                                    >
                                        <option value="all">All Sports</option>
                                        <option value="hockey">Ice Hockey</option>
                                        <option value="lacrosse">Lacrosse</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Equipment (comma-sep)</label>
                                    <input
                                        type="text"
                                        value={newExercise.equipment}
                                        onChange={e => setNewExercise({ ...newExercise, equipment: e.target.value })}
                                        placeholder="bodyweight, dumbbells"
                                        className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Coaching Points / Cues (one per line)</label>
                                <textarea
                                    rows={3}
                                    value={newExercise.cues}
                                    onChange={e => setNewExercise({ ...newExercise, cues: e.target.value })}
                                    placeholder="Drive through lead heel&#10;Keep hands projected forward&#10;Land softly on midfoot"
                                    className="w-full bg-muted/50 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none resize-none"
                                />
                            </div>

                            {/* Prescription ranges per age band */}
                            <div className="space-y-2 border-t border-border pt-4">
                                <label className="text-xs font-bold uppercase text-muted-foreground block">Age Band Safe Prescriptions</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
                                        <span className="text-xs font-bold text-foreground block">Under-14</span>
                                        <input
                                            type="text"
                                            placeholder="Sets (e.g. 2-3)"
                                            value={newExercise.under14_sets}
                                            onChange={e => setNewExercise({ ...newExercise, under14_sets: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Reps (e.g. 8-10)"
                                            value={newExercise.under14_reps}
                                            onChange={e => setNewExercise({ ...newExercise, under14_reps: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Intensity / Notes"
                                            value={newExercise.under14_intensity}
                                            onChange={e => setNewExercise({ ...newExercise, under14_intensity: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                    </div>

                                    <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
                                        <span className="text-xs font-bold text-foreground block">14–17</span>
                                        <input
                                            type="text"
                                            placeholder="Sets (e.g. 3-4)"
                                            value={newExercise.band1417_sets}
                                            onChange={e => setNewExercise({ ...newExercise, band1417_sets: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Reps (e.g. 6-8)"
                                            value={newExercise.band1417_reps}
                                            onChange={e => setNewExercise({ ...newExercise, band1417_reps: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Intensity / Notes"
                                            value={newExercise.band1417_intensity}
                                            onChange={e => setNewExercise({ ...newExercise, band1417_intensity: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                    </div>

                                    <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
                                        <span className="text-xs font-bold text-foreground block">18+ Adult</span>
                                        <input
                                            type="text"
                                            placeholder="Sets (e.g. 4)"
                                            value={newExercise.adult_sets}
                                            onChange={e => setNewExercise({ ...newExercise, adult_sets: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Reps (e.g. 5-8)"
                                            value={newExercise.adult_reps}
                                            onChange={e => setNewExercise({ ...newExercise, adult_reps: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Intensity / Notes"
                                            value={newExercise.adult_intensity}
                                            onChange={e => setNewExercise({ ...newExercise, adult_intensity: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> Create Exercise (Inactive)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
