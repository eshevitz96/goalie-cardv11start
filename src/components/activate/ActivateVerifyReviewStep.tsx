"use client";

import { useState } from "react";
import { Loader2, User, Mail, Phone, Calendar, Hash, Users, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface ActivateVerifyReviewStepProps {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: () => void;
    isLoading: boolean;
    email: string;
    error: string | null;
    rosterData: any;
}

export function ActivateVerifyReviewStep({ formData, setFormData, onSubmit, isLoading, email, error, rosterData }: ActivateVerifyReviewStepProps) {

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const isNewUser = !rosterData;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <ShieldCheck size={32} className="text-primary" />
                </div>
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
                    {isNewUser ? "CREATE YOUR PROFILE" : "VERIFY YOUR DETAILS"}
                </h1>
                <p className="text-muted-foreground text-sm">
                    {isNewUser ? "Let's get your dashboard set up." : "We found your spot! Please confirm these details."}
                </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-2 gap-4">
                    {/* Goalie Name */}
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                            <User size={10} /> Goalie Name
                        </label>
                        <input
                            value={formData.goalieName}
                            onChange={(e) => handleChange('goalieName', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                            placeholder="Full Name"
                        />
                    </div>

                    {/* Email (Read Only) */}
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                            <Mail size={10} /> Account Email
                        </label>
                        <input
                            value={email}
                            disabled
                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-muted-foreground text-sm cursor-not-allowed"
                        />
                    </div>

                    <div className="col-span-2 border-t border-border my-2"></div>

                    {/* Team & Sport */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Team</label>
                        <input
                            value={formData.team}
                            onChange={(e) => handleChange('team', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                            placeholder="e.g. Toronto Marlboros"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Primary Sport</label>
                        <select
                            value={formData.sport || 'Hockey'}
                            onChange={(e) => handleChange('sport', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors appearance-none"
                        >
                            <option value="Hockey">Hockey</option>
                            <option value="Soccer">Soccer</option>
                            <option value="Lacrosse">Lacrosse</option>
                        </select>
                    </div>

                    {/* Grad Year & Birthday */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Grad Year</label>
                        <input
                            type="number"
                            value={formData.gradYear}
                            onChange={(e) => handleChange('gradYear', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                            placeholder="202X"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                            {isNewUser ? "Birthday" : "Verify Birthday"}
                            {!isNewUser && <ShieldCheck size={10} className="text-primary" />}
                        </label>
                        <input
                            type="date"
                            value={formData.birthday}
                            onChange={(e) => handleChange('birthday', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                        />
                    </div>

                    <div className="col-span-2 border-t border-border my-2"></div>

                    {/* Height & Weight */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Height (in)</label>
                        <input
                            type="number"
                            value={formData.height}
                            onChange={(e) => handleChange('height', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                            placeholder="e.g. 70"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Weight (lbs)</label>
                        <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleChange('weight', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                            placeholder="e.g. 175"
                        />
                    </div>

                    <div className="col-span-2 border-t border-border my-2"></div>

                    {/* Parent Info */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Parent Name</label>
                        <input
                            value={formData.parentName}
                            onChange={(e) => handleChange('parentName', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                            placeholder="Parent Name"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Parent Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                            placeholder="XXX-XXX-XXXX"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <button
                onClick={onSubmit}
                disabled={isLoading}
                className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Next: Baseline Questions <ArrowRight size={18} /></>}
            </button>
        </div>
    );
}
