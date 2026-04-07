"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PerformanceSnapshot } from "@/services/performance";
import { supabase } from "@/utils/supabase/client";

interface ScoreHistoryChartProps {
    snapshots: PerformanceSnapshot[];
}

const SOURCE_DOT_COLOR: Record<string, string> = {
    game:               "#a3e635",
    "game-session":     "#a3e635",
    protocol:           "#60a5fa",
    "protocol-session": "#60a5fa",
    manual:             "#f59e0b",
};

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

async function fetchSessionLabel(sourceType: string, sourceId: string): Promise<string> {
    if (!sourceId) return "—";
    try {
        if (sourceType === "game" || sourceType === "game-session") {
            const { data } = await supabase
                .from("game_sessions")
                .select("opponent")
                .eq("id", sourceId)
                .maybeSingle();
            return data?.opponent ? `vs. ${data.opponent}` : "Game";
        }
        if (sourceType === "protocol" || sourceType === "protocol-session") {
            return "Protocol Session";
        }
    } catch {}
    return "Session";
}

export function ScoreHistoryChart({ snapshots }: ScoreHistoryChartProps) {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [sessionLabel, setSessionLabel] = useState<string>("—");
    const [labelLoading, setLabelLoading] = useState(false);

    // Chronological order: oldest left → newest right
    const ordered = useMemo(() => [...snapshots].reverse(), [snapshots]);

    const W = 320;
    const H = 80;
    const PAD_X = 16;
    const PAD_Y = 12;

    const scores = ordered.map(s => s.score_after);
    const minScore = Math.max(0, Math.min(...scores) - 3);
    const maxScore = Math.min(100, Math.max(...scores) + 3);
    const range = maxScore - minScore || 1;

    function toX(i: number) {
        if (ordered.length === 1) return W / 2;
        return PAD_X + (i / (ordered.length - 1)) * (W - PAD_X * 2);
    }
    function toY(score: number) {
        return PAD_Y + (1 - (score - minScore) / range) * (H - PAD_Y * 2);
    }

    const pathD = ordered
        .map((s, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(s.score_after).toFixed(1)}`)
        .join(" ");

    const selected = selectedIdx !== null ? ordered[selectedIdx] : null;

    // Lazy-fetch session label when a dot is selected
    useEffect(() => {
        if (!selected) return;
        setSessionLabel("—");
        setLabelLoading(true);
        fetchSessionLabel(selected.source_type, selected.source_id).then(label => {
            setSessionLabel(label);
            setLabelLoading(false);
        });
    }, [selected?.id]);

    if (ordered.length === 0) {
        return (
            <div className="text-center py-10 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                No score history yet
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* SVG Sparkline */}
            <div className="relative w-full" style={{ height: H }}>
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full h-full"
                    preserveAspectRatio="none"
                >
                    {/* Subtle grid */}
                    {[0.33, 0.66].map((t, i) => (
                        <line
                            key={i}
                            x1={PAD_X} x2={W - PAD_X}
                            y1={PAD_Y + t * (H - PAD_Y * 2)}
                            y2={PAD_Y + t * (H - PAD_Y * 2)}
                            stroke="rgba(255,255,255,0.04)"
                            strokeWidth={1}
                        />
                    ))}

                    {/* Line path */}
                    {ordered.length > 1 && (
                        <path
                            d={pathD}
                            fill="none"
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Dots */}
                    {ordered.map((snap, i) => {
                        const x = toX(i);
                        const y = toY(snap.score_after);
                        const color = SOURCE_DOT_COLOR[snap.source_type] || "rgba(255,255,255,0.5)";
                        const isSelected = selectedIdx === i;
                        return (
                            <g
                                key={snap.id}
                                onClick={() => setSelectedIdx(isSelected ? null : i)}
                                style={{ cursor: "pointer" }}
                            >
                                {/* Large invisible hit target */}
                                <circle cx={x} cy={y} r={16} fill="transparent" />
                                {/* Selection ring */}
                                {isSelected && (
                                    <circle
                                        cx={x} cy={y} r={9}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={1}
                                        opacity={0.3}
                                    />
                                )}
                                {/* Dot */}
                                <circle
                                    cx={x} cy={y}
                                    r={isSelected ? 5 : 3.5}
                                    fill={color}
                                    opacity={isSelected ? 1 : 0.65}
                                    style={{ transition: "r 0.12s ease, opacity 0.12s ease" }}
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Date range */}
            <div className="flex justify-between text-[9px] font-mono text-white/20 px-0.5">
                <span>{formatDate(ordered[0].created_at)}</span>
                <span>{formatDate(ordered[ordered.length - 1].created_at)}</span>
            </div>

            {/* Selected dot: opponent + date + score + delta */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        key={selected.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                    >
                        {/* Left: opponent + date */}
                        <div className="min-w-0">
                            <p className="text-sm font-black text-foreground truncate">
                                {labelLoading ? "Loading..." : sessionLabel}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                                {formatDate(selected.created_at)}
                            </p>
                        </div>

                        {/* Right: score + delta */}
                        <div className="flex items-baseline gap-2 shrink-0">
                            <span className="text-3xl font-black tracking-tighter text-foreground">
                                {Math.round(selected.score_after)}
                            </span>
                            {selected.score_delta != null && (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                    selected.score_delta > 0
                                        ? "bg-emerald-500/15 text-emerald-400"
                                        : selected.score_delta < 0
                                            ? "bg-red-500/10 text-red-400"
                                            : "bg-white/5 text-white/25"
                                }`}>
                                    {selected.score_delta > 0 ? "+" : ""}
                                    {selected.score_delta.toFixed(1)}
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
