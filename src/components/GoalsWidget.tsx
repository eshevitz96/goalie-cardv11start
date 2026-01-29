"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, CheckCircle, Circle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

interface Goal {
    id: string;
    description: string;
    category: 'performance' | 'mental' | 'physical';
    status: 'active' | 'completed' | 'abandoned';
    target_date?: string;
    created_at: string;
}

interface GoalsWidgetProps {
    rosterId: string;
    goalieId?: string;
}

export function GoalsWidget({ rosterId, goalieId }: GoalsWidgetProps) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newGoal, setNewGoal] = useState({ description: "", category: "performance", target_date: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (goalieId) fetchGoals();
    }, [goalieId]);

    const fetchGoals = async () => {
        if (!goalieId) return;

        // Try to fetch goals. If table doesn't exist, this will error, which we can ignore for now.
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('goalie_id', goalieId)
            .order('created_at', { ascending: false });

        if (data) {
            setGoals(data);
        }
    };

    const handleAddGoal = async () => {
        if (!newGoal.description) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('goals').insert({
            goalie_id: user.id,
            description: newGoal.description,
            category: newGoal.category,
            target_date: newGoal.target_date || null,
            status: 'active'
        });

        if (error) {
            alert("Failed to add goal: " + error.message);
        } else {
            setNewGoal({ description: "", category: "performance", target_date: "" });
            setIsAdding(false);
            fetchGoals();
        }
        setLoading(false);
    };

    const toggleGoalStatus = async (goal: Goal) => {
        const newStatus = goal.status === 'active' ? 'completed' : 'active';
        setGoals(goals.map(g => g.id === goal.id ? { ...g, status: newStatus } : g));

        const { error } = await supabase
            .from('goals')
            .update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null })
            .eq('id', goal.id);

        if (error) fetchGoals(); // Revert on error
    };

    const deleteGoal = async (id: string) => {
        if (!confirm("Remove this goal?")) return;
        setGoals(goals.filter(g => g.id !== id));
        await supabase.from('goals').delete().eq('id', id);
    };

    return (
        <div className="bg-card/50 border border-border rounded-3xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Target className="text-primary" size={20} /> Targets
                </h3>
                <button
                    className="text-muted-foreground hover:text-foreground"
                >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 mb-4">
                            {goals.map(goal => (
                                <div key={goal.id} className="flex items-start gap-3 group">
                                    <button onClick={() => toggleGoalStatus(goal)} className="mt-1">
                                        {goal.status === 'completed' ? (
                                            <CheckCircle className="text-green-500" size={18} />
                                        ) : (
                                            <Circle className="text-muted-foreground hover:text-primary" size={18} />
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`text-sm ${goal.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                                            {goal.description}
                                        </p>
                                        <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                                            <span className="uppercase tracking-wider font-bold text-zinc-500">{goal.category}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {goals.length === 0 && !isAdding && (
                                <p className="text-sm text-muted-foreground italic">No active goals. Set your baseline targets!</p>
                            )}
                        </div>

                        {isAdding ? (
                            <div className="bg-muted/30 rounded-xl p-3 border border-border">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="I want to improve my..."
                                    className="w-full bg-transparent border-b border-border p-2 mb-2 text-sm text-foreground focus:outline-none"
                                    value={newGoal.description}
                                    onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                                />
                                <div className="flex gap-2 mb-2">
                                    {['performance', 'mental', 'physical'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setNewGoal({ ...newGoal, category: cat as any })}
                                            className={`text-[10px] px-2 py-1 rounded border transition-colors ${newGoal.category === cat ? 'bg-primary text-black border-primary' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            {cat.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsAdding(false)} className="text-xs text-muted-foreground hover:text-white">Cancel</button>
                                    <button onClick={handleAddGoal} disabled={loading} className="text-xs bg-primary text-black px-3 py-1 rounded font-bold">
                                        {loading ? 'Saving...' : 'Add Goal'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full py-2 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-primary hover:border-primary transition-colors text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Add Target
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!isExpanded && (
                <div className="flex gap-2 overflow-hidden mt-2">
                    {goals.length > 0 ? goals.slice(0, 3).map(g => (
                        <div key={g.id} className="text-[10px] bg-muted/50 px-2 py-1 rounded-full text-muted-foreground whitespace-nowrap border border-white/5">
                            {g.description.length > 20 ? g.description.substring(0, 20) + '...' : g.description}
                        </div>
                    )) : <div className="text-[10px] text-muted-foreground px-1">Track your growth targets here.</div>}
                    {goals.length > 3 && <div className="text-[10px] px-2 py-1 text-muted-foreground">+{goals.length - 3}</div>}
                </div>
            )}
        </div>
    );
}
