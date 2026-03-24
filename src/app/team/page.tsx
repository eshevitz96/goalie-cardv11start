"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, CreditCard, TrendingUp, History, 
    ChevronRight, Plus, Info, ShieldCheck, Zap,
    ArrowUpRight, User as UserIcon, Activity
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { SquadIntelligence } from "@/components/team/SquadIntelligence";

interface TeamData {
    id: string;
    name: string;
    organization: string;
    owner_id: string;
}

interface RosterMember {
    id: string;
    parent_name: string;
    athlete_name: string;
    last_usage?: string;
    is_active: boolean;
    sport: string;
}

interface FundTransaction {
    id: string;
    amount: number;
    description: string;
    created_at: string;
}

export default function TeamDashboardPage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<TeamData | null>(null);
    const [balance, setBalance] = useState(0);
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [history, setHistory] = useState<FundTransaction[]>([]);

    // Team Creation
    const [isInitializing, setIsInitializing] = useState(false);
    const [newName, setNewName] = useState("");
    const [newOrg, setNewOrg] = useState("");

    // Athlete Management
    const [isAddingAthlete, setIsAddingAthlete] = useState(false);
    const [athleteEmail, setAthleteEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTeamData();
        
        // Handle Return from Stripe
        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) {
            toast.success("Payment Received! Your credits are updating now.");
            // Clear URL
            window.history.replaceState({}, '', '/team');
        }
        if (params.get('canceled')) {
            toast.error("Process canceled. Your payment was not processed.");
            window.history.replaceState({}, '', '/team');
        }
    }, []);

    const fetchTeamData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Team where user is owner
            const { data: teamsData, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (teamError) throw teamError;
            if (!teamsData) {
                setTeam(null);
                setLoading(false);
                return;
            }

            setTeam(teamsData);

            // 2. Fetch Balance
            const { data: fund } = await supabase
                .from('team_credit_funds')
                .select('balance')
                .eq('team_id', teamsData.id)
                .maybeSingle();
            setBalance(fund?.balance || 0);

            // 3. Fetch Roster Members
            const { data: rosterData } = await supabase
                .from('roster_uploads')
                .select('id, parent_name, goalie_name, sport')
                .eq('team_id', teamsData.id);
            
            // Map members with some dummy data for high-fidelity feel if needed
            setRoster(rosterData?.map(m => ({
                id: m.id,
                parent_name: m.parent_name,
                athlete_name: m.goalie_name || m.parent_name || 'Anonymous Athlete',
                is_active: true,
                last_usage: '2 days ago',
                sport: m.sport || 'Hockey'
            })) || []);

            // 4. Fetch History
            const { data: txData } = await supabase
                .from('team_fund_transactions')
                .select('*')
                .eq('team_id', teamsData.id)
                .order('created_at', { ascending: false })
                .limit(5);
            setHistory(txData || []);

        } catch (err: any) {
            toast.error("Error loading team: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async () => {
        if (!team) return;
        toast.info("Connecting to secure payment portal...");
        
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceData: {
                        unit_amount: 250000, 
                        product_name: `Goalie Card - Organizational Credit Bucket (${team.name})`
                    },
                    userId: team.owner_id,
                    returnUrl: window.location.origin + '/team',
                    metadata: {
                        type: 'team_credit_purchase',
                        teamId: team.id,
                        creditAmount: 50
                    }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Payment Gateway Error");
            if (data.url) window.location.href = data.url;
        } catch (err: any) {
            toast.error("Stripe Connection Failed: " + err.message);
        }
    };

    const handleCreateTeam = async () => {
        if (!newName) return toast.error("Please name your team.");
        setIsSubmitting(true);
        const { createTeam } = await import('@/app/actions');
        const result = await createTeam(newName, newOrg);
        if (result.success) {
            toast.success("Team Initialized! Enjoy your 5 gift credits.");
            fetchTeamData();
            setIsInitializing(false);
        } else {
            toast.error(result.error);
        }
        setIsSubmitting(false);
    };

    const handleAddAthlete = async () => {
        if (!athleteEmail || !team) return;
        setIsSubmitting(true);
        const { addAthleteToTeam } = await import('@/app/actions');
        const result = await addAthleteToTeam(team.id, athleteEmail);
        if (result.success) {
            toast.success("Athlete linked to team!");
            fetchTeamData();
            setIsAddingAthlete(false);
            setAthleteEmail("");
        } else {
            toast.error(result.error);
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <AnimatePresence>
                    {isInitializing ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
                        >
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Initialize Organization</h2>
                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Team/Group Name</label>
                                    <input 
                                        type="text" value={newName} onChange={e => setNewName(e.target.value)}
                                        placeholder="e.g. Ironbound Elite"
                                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Organization (Optional)</label>
                                    <input 
                                        type="text" value={newOrg} onChange={e => setNewOrg(e.target.value)}
                                        placeholder="e.g. NJ Youth Hockey"
                                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-primary outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleCreateTeam}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl mt-4"
                                >
                                    {isSubmitting ? "Initializing..." : "Create Organization Hub"}
                                </button>
                                <button onClick={() => setIsInitializing(false)} className="w-full text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Cancel</button>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                                <ShieldCheck size={40} />
                            </div>
                            <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Team Hub Activation</h1>
                            <p className="text-zinc-400 max-w-sm mb-8 leading-relaxed">
                                You haven't initialized a Team Fund yet. Create your organization to manage bulk credits and roster-wide intelligence.
                            </p>
                            <button 
                                onClick={() => setIsInitializing(true)}
                                className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                            >
                                Initialize Team Fund
                            </button>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white pb-20">
            {/* Header / Brand */}
            <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-black select-none pointer-events-none" />
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                
                <div className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-1">
                                <ShieldCheck size={14} /> Organization Hub
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{team.name}</h1>
                            <div className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 opacity-70">
                                {team.organization || "Independent Organization"} • Established 2024
                            </div>
                        </div>
                        <button 
                            onClick={handleTopUp}
                            className="group flex items-center gap-3 px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary transition-all shadow-xl shadow-white/5"
                        >
                            <Plus size={16} /> Activate Full Squad Access
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Stats Overview */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1 space-y-4"
                    >
                        {/* THE WALLET CARD (Glassmorphism) */}
                        <div className="relative group overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />
                            
                            <div className="relative z-10">
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Organization Hub</div>
                                <div className="flex items-end gap-2 mb-1">
                                    <div className="text-6xl font-black text-white">{balance}</div>
                                    <div className="text-xs font-black text-primary uppercase pb-2 tracking-widest">Active Seats</div>
                                </div>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                                    All-access performance tracking for {roster.length} athletes
                                </div>
                                
                                <hr className="my-6 border-white/5" />
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Squad Capacity</div>
                                        <div className="text-sm font-black">{roster.length} / {Math.max(25, balance)}</div>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(roster.length / Math.max(25, balance)) * 100}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Info */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4">
                                <Info size={14} className="text-primary" /> Squad Policies
                            </h4>
                            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">
                                All verified squad members have all-access to high-fidelity analytics, game processing, and coaching reflections.
                            </p>
                        </div>
                    </motion.div>

                    {/* Main Roster & Intel Management */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-3 space-y-8"
                    >
                        {/* Squad Intelligence (V11 Organization Hub Special) */}
                        <SquadIntelligence 
                            teamId={team.id} 
                            members={roster} 
                        />

                        {/* ROSTER TABLE (The Core) */}
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                                    <Users size={20} className="text-primary" /> Verified Performance Roster
                                </h3>
                                <div className="flex gap-2">
                                    <AnimatePresence>
                                        {isAddingAthlete ? (
                                            <motion.div 
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: "auto", opacity: 1 }}
                                                className="flex gap-2 overflow-hidden"
                                            >
                                                <input 
                                                    type="text" value={athleteEmail} onChange={e => setAthleteEmail(e.target.value)}
                                                    placeholder="Athlete Email or ID"
                                                    className="bg-black border border-white/10 rounded-lg px-4 py-1.5 text-[10px] w-48 outline-none focus:border-primary"
                                                />
                                                <button onClick={handleAddAthlete} className="bg-primary text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Add</button>
                                                <button onClick={() => setIsAddingAthlete(false)} className="text-zinc-500 px-2 uppercase text-[10px] font-black">X</button>
                                            </motion.div>
                                        ) : (
                                            <button 
                                                onClick={() => setIsAddingAthlete(true)}
                                                className="px-4 py-1.5 bg-primary text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                            >
                                                Add Athlete
                                            </button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-black/40">
                                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 tracking-widest">Athlete Name</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 tracking-widest">Player ID</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 tracking-widest">Position</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 tracking-widest">Recent Usage</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-zinc-500 tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {roster.map((member, idx) => (
                                            <tr 
                                                key={member.id} 
                                                onClick={() => router.push('/dashboard?athleteId=' + member.id)}
                                                className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-zinc-400 group-hover:border-primary/50 transition-all">
                                                            <UserIcon size={18} />
                                                        </div>
                                                        <div className="font-black text-sm uppercase tracking-tight">{member.athlete_name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-xs font-bold text-zinc-500 uppercase tracking-tighter">#{member.id.split('-')[0].toUpperCase()}</td>
                                                <td className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Goalie</td>
                                                <td className="px-8 py-5 text-xs font-bold text-emerald-500/80 uppercase tracking-wider">{member.last_usage}</td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Active</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                            <h4 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2 mb-6">
                                <History size={16} className="text-primary" /> Membership Activity Log
                            </h4>
                            <div className="space-y-4">
                                {history.length > 0 ? history.map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                                {tx.amount > 0 ? <ArrowUpRight size={16} /> : <Zap size={16} />}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-tight">{tx.description}</div>
                                                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(tx.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-white'}`}>
                                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 opacity-30 text-xs font-black uppercase tracking-widest">
                                        No recent transactions recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </main>
    );
}
