"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Send, CheckCircle2 } from "lucide-react";
import { submitReflection } from "@/app/actions";
import { useAuth } from "@/hooks/useAuth";

const SECTIONS = [
    {
        id: "role",
        title: "Tester Role",
        questions: [
            { id: "tester_role", label: "I am testing as a:", type: "select", options: ["Goalie", "Parent", "Coach"] }
        ]
    },
    {
        id: "ux",
        title: "User Experience",
        condition: (data: any) => data.tester_role === "Goalie" || !data.tester_role,
        questions: [
            { id: "login_flow", label: "Login Flow: Was it easy to sign in?", type: "scale" },
            { id: "first_impression", label: "First Impressions: Was it clear what to do next?", type: "text", hasComment: true, commentLabel: "Any specific thoughts?" },
            { id: "mobile_feel", label: "Mobile Feel: Does the layout feel natural?", type: "scale" },
            { id: "mood_checkin", label: "Mood Check-in: Did it feel responsive?", type: "yes_no" }
        ]
    },
    {
        id: "parent",
        title: "Parent / Guardian",
        condition: (data: any) => data.tester_role === "Parent",
        questions: [
            { id: "approval_msg", label: "Did you receive notifications for event requests?", type: "yes_no" },
            { id: "dashboard_visibility", label: "Does the Parent Dashboard clearly show your child's upcoming schedule?", type: "yes_no", hasComment: true, commentLabel: "What else would you like to see here?" },
            { id: "pricing_clarity", label: "Is the 'Pro' tier pricing clear?", type: "scale" },
            { id: "season_report", label: "Would a PDF Season Summary be valuable?", type: "scale" }
        ]
    },
    {
        id: "coach",
        title: "Coach / Pro",
        condition: (data: any) => data.tester_role === "Coach",
        questions: [
            { id: "sentiment_alert", label: "Did you see roster sentiment alerts?", type: "yes_no" },
            { id: "response_monitoring", label: "Can you track who hasn't responded in 24h?", type: "yes_no" }
        ]
    },
    {
        id: "black_card",
        title: "High-Ticket Value",
        questions: [
            { id: "accountability", label: "Would you pay more for Accountability vs just Content?", type: "select", options: ["Pay for Accountability", "Pay for Content", "Neither"], hasComment: true, commentLabel: "Why?" },
            { id: "black_card_appeal", label: "Would a 'Black Card' (Status/Access) appeal to you?", type: "scale" },
            { id: "inner_circle", label: "Do you feel like a 'Pro' using this app?", type: "scale" }
        ]
    },
    {
        id: "pricing",
        title: "Pricing Research",
        questions: [
            { id: "base_price", label: "Fair price for Base Tier (Logs + Drills)?", type: "number", prefix: "$" },
            { id: "pro_price", label: "Fair price for Pro Tier (AI + Feedback)?", type: "number", prefix: "$" },
            { id: "retention", label: "How long should we keep data?", type: "select", options: ["1 Year", "4 Years (HS Career)", "Forever"] }
        ]
    }
];

export function BetaSurveyForm() {
    const { userId, userRole } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Filter sections based on role selection
    const activeSections = SECTIONS.filter(s => !s.condition || s.condition(formData));
    const currentSection = activeSections[currentStep];

    const handleInputChange = (id: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    const handleNext = async () => {
        if (currentStep < activeSections.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Submit
            setIsSubmitting(true);
            try {
                const result = await submitReflection("BETA_SURVEY", {
                    author_role: formData.tester_role || userRole || "tester",
                    title: "BETA_SURVEY_RESPONSE",
                    content: JSON.stringify(formData, null, 2),
                    mood: "neutral",
                    activity_type: "survey"
                });

                if (result.success) {
                    setIsSuccess(true);
                } else {
                    alert("Submission failed: " + result.error);
                }
            } catch (e) {
                alert("Error submitting survey");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold">Feedback Received!</h2>
                <p className="text-muted-foreground">Thank you for helping us build the best version of GoalieCard.</p>
                <button onClick={() => window.location.href = "/"} className="text-primary hover:underline">Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
                {activeSections.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-2 flex-1 rounded-full transition-colors ${idx <= currentStep ? "bg-primary" : "bg-muted"}`}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSection.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <h2 className="text-2xl font-bold mb-6">{currentSection.title}</h2>

                    <div className="space-y-6">
                        {currentSection.questions.map((qRaw) => {
                            const q = qRaw as any;
                            return (
                                <div key={q.id} className="space-y-2">
                                    <label className="block text-sm font-bold text-muted-foreground">{q.label}</label>

                                    {q.type === "text" && (
                                        <textarea
                                            className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[100px]"
                                            value={formData[q.id] || ""}
                                            onChange={e => handleInputChange(q.id, e.target.value)}
                                        />
                                    )}

                                    {q.type === "number" && (
                                        <div className="relative">
                                            {q.prefix && <span className="absolute left-3 top-3 text-muted-foreground">{q.prefix}</span>}
                                            <input
                                                type="number"
                                                className={`w-full bg-secondary/50 border border-border rounded-xl p-3 focus:border-primary outline-none ${q.prefix ? "pl-8" : ""}`}
                                                value={formData[q.id] || ""}
                                                onChange={e => handleInputChange(q.id, e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {q.type === "select" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {q.options?.map((opt: string) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleInputChange(q.id, opt)}
                                                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${formData[q.id] === opt ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === "yes_no" && (
                                        <div className="flex gap-4">
                                            {["Yes", "No"].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleInputChange(q.id, opt)}
                                                    className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all ${formData[q.id] === opt ? (opt === "Yes" ? "bg-green-500 text-white border-green-500" : "bg-red-500 text-white border-red-500") : "bg-card border-border hover:border-foreground"}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === "scale" && (
                                        <div className="flex justify-between gap-2">
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => handleInputChange(q.id, num)}
                                                    className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all ${formData[q.id] === num ? "bg-primary text-primary-foreground border-primary scale-110" : "bg-card border-border hover:border-primary/50"}`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Optional Comment Box */}
                                    {q.hasComment && (
                                        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                            <input
                                                type="text"
                                                placeholder={q.commentLabel || "Any additional comments?"}
                                                className="w-full bg-muted/30 border-b border-border p-2 text-sm focus:border-primary outline-none transition-colors"
                                                value={formData[q.id + "_comment"] || ""}
                                                onChange={e => handleInputChange(q.id + "_comment", e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="pt-8 flex justify-between">
                        <button
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            disabled={currentStep === 0}
                            className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:text-foreground disabled:opacity-0 transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            {isSubmitting ? "Submitting..." : currentStep === activeSections.length - 1 ? "Submit Feedback" : "Next"}
                            {!isSubmitting && currentStep < activeSections.length - 1 && <ChevronRight size={18} />}
                            {!isSubmitting && currentStep === activeSections.length - 1 && <Send size={18} />}
                        </button>
                    </div>

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
