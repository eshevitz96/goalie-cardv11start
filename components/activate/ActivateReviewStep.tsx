"use client";

import { useState } from "react";
import { Loader2, Check, User, Mail, Phone, Calendar, Ruler, Hash, Users, ArrowRight } from "lucide-react";

interface ActivateReviewStepProps {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: () => void;
    isLoading: boolean;
    email: string;
}

export function ActivateReviewStep({ formData, setFormData, onSubmit, isLoading, email }: ActivateReviewStepProps) {

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <Check size={32} className="text-emerald-500" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter font-black">Confirm Details</h1>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">

                    {/* Goalie Name */}
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                            <User size={10} /> Goalie Name
                        </label>
                        <input
                            value={formData.goalieName}
                            onChange={(e) => handleChange('goalieName', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none transition-colors"
                            placeholder="Full Name"
                        />
                    </div>

                    {/* Email (Read Only) */}
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                            <Mail size={10} /> Login Email
                        </label>
                        <input
                            value={email}
                            disabled
                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-muted-foreground text-sm cursor-not-allowed"
                        />
                    </div>

                    <div className="col-span-2 border-t border-border my-2"></div>

                    {/* Guardian Email */}
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-1">
                            Guardian Email <span className="text-emerald-500 text-[9px] border border-emerald-500/30 px-1 rounded bg-emerald-500/5">Optional</span>
                        </label>
                        <input
                            type="email"
                            value={formData.parentEmail}
                            onChange={(e) => handleChange('parentEmail', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none transition-colors"
                            placeholder="Enter parent email for separate access..."
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                            Enables Parent Portal access.
                        </p>
                    </div>

                    {/* Parent Name (Conditional) */}
                    {formData.parentEmail && formData.parentEmail.length > 5 && (
                        <div className="col-span-2 animate-in slide-in-from-top-2 fade-in">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Parent Name</label>
                            <input
                                value={formData.parentName}
                                onChange={(e) => handleChange('parentName', e.target.value)}
                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none transition-colors"
                                placeholder="Parent Name"
                            />
                        </div>
                    )}

                    <div className="col-span-2 border-t border-border my-2"></div>

                    {/* Stats Grid */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Grad Year</label>
                        <input
                            type="number"
                            value={formData.gradYear}
                            onChange={(e) => handleChange('gradYear', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none transition-colors"
                            placeholder="202X"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Birthday</label>
                        <input
                            type="date"
                            value={formData.birthday}
                            onChange={(e) => handleChange('birthday', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Team</label>
                        <input
                            value={formData.team}
                            onChange={(e) => handleChange('team', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none transition-colors"
                            placeholder="Current Team"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Primary Sport</label>
                        <select
                            value={formData.sport || 'Hockey'}
                            onChange={(e) => handleChange('sport', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none transition-colors appearance-none"
                        >
                            <option value="Hockey">Hockey</option>
                            <option value="Soccer">Soccer</option>
                            <option value="Lacrosse">Lacrosse</option>
                        </select>
                        <p className="text-[10px] text-muted-foreground mt-1 ml-1 italic">
                            Used to calibrate your season timeline.
                        </p>
                    </div>

                </div>
            </div>

            <button
                onClick={onSubmit}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Save & Continue <ArrowRight size={18} /></>}
            </button>
        </div>
    );
}
