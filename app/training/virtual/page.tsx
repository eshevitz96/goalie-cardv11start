"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { CheckCircle2, PlayCircle, Star, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function VirtualCoachingMarketplace() {
    const [coaches, setCoaches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMarketplace = async () => {
            setIsLoading(true);
            
            // 1. Fetch all active templates joined with coach profiles
            const { data: templates, error } = await supabase
                .from('contract_templates')
                .select(`
                    *,
                    coach_profiles (
                        id,
                        display_name,
                        bio,
                        profile_picture_url
                    )
                `)
                .eq('is_active', true)
                .order('price_monthly_cents', { ascending: true });

            if (templates) {
                // 2. Group templates by coach
                const coachMap = new Map();
                templates.forEach(t => {
                    const coachInfo = t.coach_profiles;
                    if (!coachInfo) return; // Skip if no coach profile found
                    
                    if (!coachMap.has(coachInfo.id)) {
                        coachMap.set(coachInfo.id, {
                            ...coachInfo,
                            tiers: []
                        });
                    }
                    coachMap.get(coachInfo.id).tiers.push(t);
                });
                
                setCoaches(Array.from(coachMap.values()));
            }
            setIsLoading(false);
        };

        fetchMarketplace();
    }, []);

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-32">
            
            {/* Navigation */}
            <nav className="max-w-6xl mx-auto mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
            </nav>

            {/* Header section */}
            <header className="mb-14 max-w-4xl mx-auto text-center pt-2">
                <div className="inline-flex items-center gap-2 bg-[#00E676]/10 text-[#00E676] px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-[#00E676]/20">
                    <Shield size={14} /> GoalieCard Pro
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
                    1-on-1 Film & <span className="text-[#00E676]">Mentorship</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                    You can't fix what you can't see. Get the edge with professional tactical breakdowns, weekly accountability, and direct access to elite coaches—all integrated directly with your GoalieCard performance data.
                </p>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="text-sm font-bold text-muted-foreground animate-pulse">Loading coaches...</div>
                </div>
            ) : coaches.length === 0 ? (
                <div className="text-center py-20 max-w-md mx-auto">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Coaches Available</h3>
                    <p className="text-muted-foreground text-sm">Our elite coaches are currently at capacity. Check back soon for roster openings.</p>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto space-y-12">
                    {coaches.map((coach) => (
                        <div key={coach.id} className="bg-card border border-border rounded-[32px] overflow-hidden flex flex-col lg:flex-row shadow-lg shadow-black/20">
                            
                            {/* Coach Info Sidebar */}
                            <div className="lg:w-1/3 bg-muted/30 p-8 flex flex-col items-center text-center border-b lg:border-b-0 lg:border-r border-border">
                                <div className="w-32 h-32 rounded-full bg-background border-4 border-[#00E676]/20 flex items-center justify-center text-4xl font-black mb-5 overflow-hidden">
                                    {coach.profile_picture_url ? (
                                        <img src={coach.profile_picture_url} alt={coach.display_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-muted-foreground">{coach.display_name.charAt(0)}</span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-2">{coach.display_name}</h2>
                                <div className="flex items-center gap-1 text-[#00E676] mb-5">
                                    <Star size={14} className="fill-[#00E676]" />
                                    <Star size={14} className="fill-[#00E676]" />
                                    <Star size={14} className="fill-[#00E676]" />
                                    <Star size={14} className="fill-[#00E676]" />
                                    <Star size={14} className="fill-[#00E676]" />
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                    {coach.bio || "Professional goaltending coach specializing in mental performance, game IQ, and technical mastery at the elite level."}
                                </p>
                                <div className="mt-auto pt-4 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                    <Shield size={14} className="text-[#00E676]" /> Uses GoalieCard OS
                                </div>
                            </div>

                            {/* Contract Tiers */}
                            <div className="lg:w-2/3 p-8">
                                <h3 className="text-sm font-bold text-muted-foreground mb-6">Select a Training Tier</h3>
                                
                                <div className="grid gap-4 md:grid-cols-2">
                                    {coach.tiers.map((tier: any) => (
                                        <div key={tier.id} className="bg-background border border-border hover:border-[#00E676]/50 rounded-[24px] p-6 flex flex-col transition-all group relative overflow-hidden">
                                            {/* Glow effect on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#00E676]/0 via-transparent to-[#00E676]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            <div className="mb-4 relative z-10">
                                                <h4 className="text-xl font-bold tracking-tight">{tier.name}</h4>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-2xl font-black text-[#00E676]">${tier.price_monthly_cents / 100}</span>
                                                    <span className="text-sm font-bold text-muted-foreground">/ month</span>
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-muted-foreground flex-1 mb-6 relative z-10">{tier.description}</p>
                                            
                                            <div className="space-y-3 mb-8 relative z-10">
                                                <div className="flex items-center gap-3 text-sm font-semibold">
                                                    <PlayCircle size={18} className="text-[#00E676]" />
                                                    {tier.film_reviews_per_month} Tactical Film Review{tier.film_reviews_per_month !== 1 ? 's' : ''}
                                                </div>
                                                {tier.includes_sync && (
                                                    <div className="flex items-center gap-3 text-sm font-semibold">
                                                        <CheckCircle2 size={18} className="text-[#00E676]" />
                                                        1-on-1 Performance Sync
                                                    </div>
                                                )}
                                            </div>

                                            <button 
                                                onClick={() => alert("Checkout flow coming next! This will open the Stripe subscription portal.")}
                                                className="mt-auto w-full flex items-center justify-center gap-2 bg-foreground text-background group-hover:bg-[#00E676] group-hover:text-black py-3.5 rounded-xl text-sm font-bold transition-colors relative z-10"
                                            >
                                                Select Tier <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
