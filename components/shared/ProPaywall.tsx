"use client";

import React, { useState } from 'react';
import { X, Check, ShieldCheck, ChevronRight } from 'lucide-react';

interface PlanBox {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    highlight?: string;
}

const PLANS: PlanBox[] = [
    {
        id: 'annual',
        name: 'Annual',
        price: '$15.00',
        period: '/mo',
        description: '7 Days Free',
        highlight: 'Save $120.00/yr'
    },
    {
        id: 'monthly',
        name: 'Monthly',
        price: '$25.00',
        period: '/mo',
        description: 'Billed monthly'
    }
];

export function ProPaywall({ onClose, onUpgrade }: { onClose?: () => void, onUpgrade?: (planId: string) => void }) {
    const [selectedPlan, setSelectedPlan] = useState('annual');

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-500 overflow-y-auto">
            {/* Top Navigation */}
            <div className="flex justify-between items-center p-6 sticky top-0 bg-black/80 backdrop-blur-md z-20">
                <div className="text-xl font-black tracking-[0.3em] uppercase text-white opacity-80">
                   G o a l i e <span className="text-primary italic">C a r d</span>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                    <X className="text-white w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 max-w-lg mx-auto w-full px-6 pb-20 space-y-12">
                {/* Visual Carousel (Represented as a stunning header) */}
                <div className="relative group pt-4">
                    <div className="aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden relative shadow-2xl">
                         <img 
                            src="/premium_goalie_aesthetic_1_1775331747194.png" 
                            alt="Premium Goalie" 
                            className="absolute inset-0 w-full h-full object-cover animate-in zoom-in duration-1000" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    </div>
                </div>

                {/* Primary Message */}
                <div className="space-y-4 text-center">
                    <h1 className="text-5xl font-black tracking-tighter text-white leading-tight">
                        Your free reset starts now
                    </h1>
                    <div className="space-y-1">
                        <p className="text-lg font-bold text-white/90">$0 today. Free for 7 days.</p>
                        <p className="text-sm text-gray-500 underline underline-offset-4 cursor-pointer hover:text-white transition-all">
                            Cancel anytime.
                        </p>
                    </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-6 pt-4">
                    {[
                        { title: "Personal Pro Coach Access", sub: "Designed by pro scouts and trainers" },
                        { title: "Advanced Performance Metrics", sub: "Unlock deep dive goalie analytics" },
                        { title: "Unlimited Storage & Sync", sub: "Across all your devices" }
                    ].map((benefit, i) => (
                        <div key={i} className="flex justify-between items-start group">
                            <div className="space-y-1 text-left">
                                <h3 className="text-lg font-bold text-white leading-none">{benefit.title}</h3>
                                <p className="text-sm text-gray-500">{benefit.sub}</p>
                            </div>
                            <Check className="text-white w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>

                {/* Plan Selection Boxes */}
                <div className="space-y-4 pt-10">
                    {PLANS.map((plan) => (
                        <button
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden group ${
                                selectedPlan === plan.id 
                                ? 'bg-white/5 border-white/20' 
                                : 'bg-[#0A0A0A] border-white/5 opacity-60 hover:opacity-100'
                            }`}
                        >
                             <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                                    <p className="text-sm text-gray-500 font-medium">{plan.description}</p>
                                    {plan.highlight && (
                                        <div className="mt-3 inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                            {plan.highlight}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white">{plan.price}</span>
                                    <span className="text-sm text-gray-500 font-bold">{plan.period}</span>
                                </div>
                             </div>
                             {selectedPlan === plan.id && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] -mr-8 -mt-8" />
                             )}
                        </button>
                    ))}
                </div>

                {/* Final CTA */}
                <div className="space-y-6 pt-6">
                    <button 
                        onClick={() => onUpgrade?.(selectedPlan)}
                        className="w-full bg-white text-black py-6 rounded-full font-black text-sm tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/5"
                    >
                        Start free trial 
                    </button>
                    
                    <button className="w-full flex items-center justify-center gap-2 text-gray-600 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                        Restore Purchases <ChevronRight size={12} />
                    </button>
                </div>

                <div className="pt-10 flex flex-col items-center gap-6 opacity-40 hover:opacity-100 transition-opacity pb-10">
                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="hover:text-white cursor-pointer">Terms & Conditions</span>
                        <span className="hover:text-white cursor-pointer">Privacy Policy</span>
                        <span className="hover:text-white cursor-pointer">How to cancel</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-700 font-bold uppercase tracking-[0.2em]">
                        <ShieldCheck className="w-3.5 h-3.5" /> SECURE STRIPE CHECKOUT
                    </div>
                </div>
            </div>
        </div>
    );
}
