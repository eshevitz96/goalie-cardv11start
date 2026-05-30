"use client";

import React, { useState } from 'react';
import { Shield, Camera, FileText, Check, AlertCircle, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface LegalAgreementProps {
    onAccepted?: () => void;
    showSubmit?: boolean;
    submitLabel?: string;
    isSubmitting?: boolean;
    error?: string | null;
}

export function LegalAgreementModule({ 
    onAccepted, 
    showSubmit = true, 
    submitLabel = "I Accept All Agreements",
    isSubmitting = false,
    error = null
}: LegalAgreementProps) {
    const [acceptedSections, setAcceptedSections] = useState({
        system: false,
        liability: false,
        media: false,
        privacy: false
    });

    const toggleSection = (section: keyof typeof acceptedSections) => {
        setAcceptedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const allAccepted = Object.values(acceptedSections).every(Boolean);

    const sections = [
        {
            id: 'system' as const,
            title: "System Terms of Service",
            icon: <FileText className="text-blue-500" size={18} />,
            summary: "Standard platform usage and athlete code of conduct.",
            content: "By using the Goalie Card platform, you agree to maintain a respectful environment. Data collected is for athletic development and coaching review. You agree not to reverse engineer or misappropriate platform tools for external commercial use."
        },
        {
            id: 'liability' as const,
            title: "Private Training Liability & Injury Waiver",
            icon: <Shield className="text-rose-500" size={18} />,
            summary: "Mandatory for all private and group training sessions.",
            content: "You acknowledge that high-intensity athletic training involves inherent risks of injury. You voluntarily assume all risks and release The Goalie Brand, its coaches, and partners from any liability for personal injury, damage, or loss sustained during training sessions. You confirm you are in good physical standing for high-level athletic activity."
        },
        {
            id: 'media' as const,
            title: "Media Rights & Video Release",
            icon: <Camera className="text-amber-500" size={18} />,
            summary: "Consent for training highlights and game film analysis.",
            content: "You grant The Goalie Brand the right to capture and use photo/video footage of training and games for analysis, social media, and marketing. You understand that game film is stored in our database for coaching review and to power your Performance Heatmaps."
        },
        {
            id: 'privacy' as const,
            title: "Data Privacy & Sharing Policy",
            icon: <Info className="text-emerald-500" size={18} />,
            summary: "How we protector and share your athletic metrics.",
            content: "Your athletic data (save percentages, heatmaps, coach notes) is shared with your assigned guardians and verified coaches. We do not sell your personal data to third parties. Performance metrics may be used anonymously to calibrate regional benchmarks."
        }
    ];

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="text-center mb-6">
                <h3 className="text-lg font-black text-foreground tracking-tight uppercase">V11 Legal Master Agreement</h3>
                <p className="text-xs text-muted-foreground">Please review and confirm each required section</p>
            </div>

            <div className="space-y-3">
                {sections.map((section) => (
                    <div 
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={twMerge(
                            "group cursor-pointer rounded-2xl border transition-all duration-300 p-4 relative overflow-hidden",
                            acceptedSections[section.id] 
                                ? "bg-primary/5 border-primary/30" 
                                : "bg-card border-border hover:border-muted-foreground/30"
                        )}
                    >
                        {/* Background Polish */}
                        <div className={twMerge(
                            "absolute top-0 right-0 h-24 w-24 rounded-full blur-[40px] opacity-10 pointer-events-none transition-opacity",
                            acceptedSections[section.id] ? "opacity-20" : "opacity-0"
                        )} />

                        <div className="flex gap-4">
                            <div className={twMerge(
                                "h-6 w-6 rounded-md border flex items-center justify-center shrink-0 mt-1 transition-all",
                                acceptedSections[section.id] ? "bg-primary border-primary text-white" : "border-muted-foreground/30 bg-background"
                            )}>
                                {acceptedSections[section.id] && <Check size={14} strokeWidth={3} />}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {section.icon}
                                    <h4 className="font-bold text-sm text-foreground">{section.title}</h4>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium mb-3 group-hover:text-foreground/70 transition-colors uppercase tracking-widest">{section.summary}</p>
                                
                                <div className="bg-muted/30 rounded-xl p-3 border border-border/50 max-h-24 overflow-y-auto">
                                    <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {showSubmit && (
                <button
                    disabled={!allAccepted || isSubmitting}
                    onClick={onAccepted}
                    className={twMerge(
                        "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl",
                        allAccepted && !isSubmitting
                            ? "bg-foreground text-background hover:bg-primary hover:text-white"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? "Finalizing Agreement..." : submitLabel}
                </button>
            )}
        </div>
    );
}
