"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, CheckCircle, Circle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
    const toast = useToast();
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
            toast.error("Failed to add goal: " + error.message);
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
        <Card className="mb-6">
            <CardHeader className="cursor-pointer flex flex-row items-center justify-between pb-2" onClick={() => setIsExpanded(!isExpanded)}>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="text-primary" size={20} /> Targets
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground p-1 h-auto w-auto"
                >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </Button>
            </CardHeader>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <CardContent>
                            <div className="space-y-3 mb-4">
                                {goals.map(goal => (
                                    <div key={goal.id} className="flex items-start gap-3 group">
                                        <Button variant="ghost" size="sm" onClick={() => toggleGoalStatus(goal)} className="mt-1 p-0 h-auto hover:bg-transparent">
                                            {goal.status === 'completed' ? (
                                                <CheckCircle className="text-green-500" size={18} />
                                            ) : (
                                                <Circle className="text-muted-foreground hover:text-primary" size={18} />
                                            )}
                                        </Button>
                                        <div className="flex-1">
                                            <p className={`text-sm ${goal.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                                                {goal.description}
                                            </p>
                                            <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                                                <span className="uppercase tracking-wider font-bold text-zinc-500">{goal.category}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity p-0 h-auto hover:bg-transparent">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                                {goals.length === 0 && !isAdding && (
                                    <p className="text-sm text-muted-foreground italic">No active goals. Set your baseline targets!</p>
                                )}
                            </div>

                            {isAdding ? (
                                <div className="bg-muted/30 rounded-xl p-3 border border-border">
                                    <Input
                                        autoFocus
                                        placeholder="I want to improve my..."
                                        className="mb-2"
                                        value={newGoal.description}
                                        onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                                    />
                                    <div className="flex gap-2 mb-2">
                                        {['performance', 'mental', 'physical'].map(cat => (
                                            <Button
                                                key={cat}
                                                variant="ghost"
                                                onClick={() => setNewGoal({ ...newGoal, category: cat as any })}
                                                className={`text-[10px] px-2 py-1 rounded border transition-colors h-auto ${newGoal.category === cat ? 'bg-primary text-black border-primary hover:bg-primary/90' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-transparent'}`}
                                            >
                                                {cat.toUpperCase()}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-xs text-muted-foreground hover:text-white h-auto p-2">Cancel</Button>
                                        <Button onClick={handleAddGoal} disabled={loading} className="text-xs bg-primary text-black px-3 py-1 rounded font-bold h-auto">
                                            {loading ? 'Saving...' : 'Add Goal'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAdding(true)}
                                    className="w-full py-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-primary hover:border-primary transition-colors text-xs font-bold flex items-center justify-center gap-2 h-auto bg-transparent"
                                >
                                    <Plus size={14} /> Add Target
                                </Button>
                            )}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isExpanded && (
                <CardContent className="pt-0 pb-6">
                    <div className="flex gap-2 overflow-hidden">
                        {goals.length > 0 ? goals.slice(0, 3).map(g => (
                            <div key={g.id} className="text-[10px] bg-muted/50 px-2 py-1 rounded-full text-muted-foreground whitespace-nowrap border border-white/5">
                                {g.description.length > 20 ? g.description.substring(0, 20) + '...' : g.description}
                            </div>
                        )) : <div className="text-[10px] text-muted-foreground px-1">Track your growth targets here.</div>}
                        {goals.length > 3 && <div className="text-[10px] px-2 py-1 text-muted-foreground">+{goals.length - 3}</div>}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
