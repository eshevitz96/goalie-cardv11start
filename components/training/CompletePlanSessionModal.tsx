"use client";

import React, { useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface CompletePlanSessionModalProps {
    isOpen: boolean;
    sessionTitle: string;
    sessionDate?: string;
    onClose: () => void;
    onConfirm: (effort: number, readiness: number) => Promise<void>;
    isLoading?: boolean;
}

export const CompletePlanSessionModal: React.FC<CompletePlanSessionModalProps> = ({
    isOpen,
    sessionTitle,
    sessionDate,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    const [effort, setEffort] = useState<number>(7);
    const [readiness, setReadiness] = useState<number>(7);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onConfirm(effort, readiness);
    };

    const getEffortColor = (val: number, isSelected: boolean) => {
        if (!isSelected) return "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100";
        if (val <= 4) return "bg-emerald-600 text-white border-emerald-600 shadow-sm";
        if (val <= 6) return "bg-blue-600 text-white border-blue-600 shadow-sm";
        if (val <= 8) return "bg-amber-600 text-white border-amber-600 shadow-sm";
        return "bg-rose-600 text-white border-rose-600 shadow-sm";
    };

    const getEffortLabel = (val: number) => {
        if (val <= 2) return "Very Light (Recovery / Mobility)";
        if (val <= 4) return "Light (Comfortable pace)";
        if (val <= 6) return "Moderate (Working hard, controlled)";
        if (val <= 8) return "Hard (Challenging, heavy effort)";
        return "Max Effort (All out, peak intensity)";
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-neutral-900">Mark Workout Complete</h3>
                            <p className="text-xs text-neutral-500 line-clamp-1">{sessionTitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Effort 1-10 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                                Session Effort (RPE 1–10)
                            </label>
                            <span className="text-xs font-semibold text-neutral-900">
                                Level {effort} / 10
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mb-3">
                            {getEffortLabel(effort)}
                        </p>

                        <div className="grid grid-cols-10 gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                                const isSelected = effort === num;
                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setEffort(num)}
                                        className={`h-11 rounded-lg border text-sm font-bold transition-all ${getEffortColor(num, isSelected)}`}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pre-Session Readiness 1-10 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                                Readiness / Energy Today (1–10)
                            </label>
                            <span className="text-xs font-semibold text-neutral-900">
                                {readiness} / 10
                            </span>
                        </div>
                        <div className="grid grid-cols-10 gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                                const isSelected = readiness === num;
                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setReadiness(num)}
                                        className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                                            isSelected
                                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                                        }`}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Complete & Log"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
