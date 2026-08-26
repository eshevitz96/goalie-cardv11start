"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { 
    Users, 
    FileEdit, 
    PlayCircle, 
    CheckCircle2, 
    AlertCircle, 
    TrendingUp, 
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function CoachDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [coachId, setCoachId] = useState<string | null>(null);
    const [activeContracts, setActiveContracts] = useState<any[]>([]);
    const [actionItems, setActionItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                setCoachId(user.id);
                
                // Fetch Active Contracts for this coach
                const { data: contractsData } = await supabase
                    .from('contracts')
                    .select(`
                        *,
                        contract_templates (
                            name,
                            price_monthly_cents,
                            film_reviews_per_month
                        )
                    `)
                    .eq('coach_id', user.id)
                    .eq('status', 'active');

                // To get athlete names, we fetch their profiles
                let hydratedContracts = [];
                if (contractsData && contractsData.length > 0) {
                    const athleteIds = contractsData.map(c => c.athlete_id);
                    const { data: profiles } = await supabase
                        .from('athlete_profiles')
                        .select('athlete_id')
                        .in('athlete_id', athleteIds);
                    
                    // Fallback to user metadata if athlete_profiles doesn't have names easily, or use auth.users
                    // Since we can't easily join auth.users on client, we'll use a dummy/placeholder name logic if missing
                    // In a real production environment, you'd have a public 'profiles' table with 'goalie_name'.
                    const { data: genericProfiles } = await supabase
                        .from('profiles')
                        .select('id, goalie_name, email')
                        .in('id', athleteIds);

                    hydratedContracts = contractsData.map(contract => {
                        const prof = genericProfiles?.find(p => p.id === contract.athlete_id);
                        return {
                            ...contract,
                            athlete_name: prof?.goalie_name || prof?.email || "Unknown Athlete",
                            tier_name: contract.contract_templates?.name || "Custom Plan",
                            price: contract.contract_templates?.price_monthly_cents ? (contract.contract_templates.price_monthly_cents / 100) : 0
                        };
                    });
                }
                
                setActiveContracts(hydratedContracts);

                // Mock Action Items (To be wired to real film submissions/missions later)
                // For now, if there are active contracts, we generate 1-2 demo action items
                if (hydratedContracts.length > 0) {
                    setActionItems([
                        {
                            id: '1',
                            athlete_name: hydratedContracts[0].athlete_name,
                            type: 'FILM_REVIEW',
                            message: 'Uploaded 3 new clips for review',
                            urgency: 'high',
                            date: 'Today'
                        },
                        {
                            id: '2',
                            athlete_name: hydratedContracts[0].athlete_name,
                            type: 'WEEKLY_FOCUS',
                            message: 'Needs updated weekly intention',
                            urgency: 'medium',
                            date: 'Yesterday'
                        }
                    ]);
                }
            }
            setIsLoading(false);
        };

        fetchDashboardData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    // Calculate MRR
    const currentMRR = activeContracts.reduce((sum, c) => sum + (c.price || 0), 0);

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <div>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Command Center</h2>
                    <h1 className="text-3xl font-black tracking-normal">
                        Coach<span className="text-[#00E676]">OS</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/coach/contracts" className="bg-[#00E676] hover:bg-[#00C853] text-black px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2">
                        <FileEdit size={14} /> Contract Builder
                    </Link>
                    <div className="relative group z-50">
                        <button className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:border-[#00E676] transition-colors">
                            <span className="font-bold text-sm">CM</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right backdrop-blur-md">
                            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                <ExternalLink size={16} /> Public Storefront
                            </button>
                            <div className="h-px bg-border my-1" />
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading CoachOS...</div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: Inbox & CRM */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* QUICK STATS */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm">
                                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Active Athletes</div>
                                <div className="text-3xl font-black">{activeContracts.length}</div>
                            </div>
                            <div className="bg-card border border-[#00E676]/30 rounded-[24px] p-6 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <TrendingUp size={100} className="text-[#00E676]" />
                                </div>
                                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Monthly Recurring</div>
                                <div className="text-3xl font-black text-[#00E676]">${currentMRR}</div>
                            </div>
                        </div>

                        {/* INBOX / ACTION ITEMS */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <AlertCircle className="text-[#00E676]" size={20} />
                                    Inbox & Actions
                                    {actionItems.length > 0 && (
                                        <span className="bg-[#00E676] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{actionItems.length}</span>
                                    )}
                                </h3>
                            </div>
                            
                            {actionItems.length === 0 ? (
                                <div className="bg-card border border-border rounded-[24px] p-8 text-center">
                                    <CheckCircle2 size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
                                    <div className="text-sm font-bold text-foreground">You're all caught up!</div>
                                    <div className="text-xs text-muted-foreground mt-1">No film to review or intentions to set.</div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {actionItems.map(item => (
                                        <div key={item.id} className="bg-card border border-border hover:border-[#00E676]/50 transition-colors rounded-[20px] p-4 flex items-center justify-between group cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", 
                                                    item.type === 'FILM_REVIEW' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                                                )}>
                                                    {item.type === 'FILM_REVIEW' ? <PlayCircle size={18} /> : <FileEdit size={18} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold flex items-center gap-2">
                                                        {item.athlete_name}
                                                        {item.urgency === 'high' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{item.message}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 py-1 bg-muted rounded-full group-hover:bg-[#00E676] group-hover:text-black transition-colors">
                                                Review
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ACTIVE CLIENTS CRM */}
                        <section>
                            <div className="flex items-center justify-between mb-4 mt-8">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="text-foreground" size={20} />
                                    Active Subscriptions
                                </h3>
                            </div>
                            
                            {activeContracts.length === 0 ? (
                                <div className="bg-card border border-border rounded-[24px] p-12 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Users size={24} className="text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">No Active Athletes</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mb-6">You don't have any athletes subscribed to your tiers yet. Copy your storefront link and share it to get started!</p>
                                    <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-border">
                                        <ExternalLink size={16} /> Copy Storefront Link
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeContracts.map(contract => (
                                        <div key={contract.contract_id} className="bg-card border border-border rounded-[20px] p-5 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="font-bold text-lg leading-tight">{contract.athlete_name}</div>
                                                    <div className="text-xs font-bold text-[#00E676] uppercase tracking-wider mt-1">{contract.tier_name}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold border border-border">
                                                    {contract.athlete_name.charAt(0)}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 border-t border-border/50 pt-4">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground font-semibold">Film Reviews</span>
                                                    <span className="font-bold">0 / {contract.contract_templates?.film_reviews_per_month || 0}</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-[#00E676] h-full rounded-full" style={{ width: '0%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Performance & Resources (Placeholder for now) */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-[24px] p-6 text-center">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Platform Fee</h3>
                            <div className="text-2xl font-black mb-1">10%</div>
                            <p className="text-xs text-muted-foreground">Processed via CIC Stripe</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
