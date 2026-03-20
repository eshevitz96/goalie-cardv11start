"use client";

import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RequestSessionWidgetProps {
    assignedCoach?: string;
    availableTimes?: string[];
}

export function RequestSessionWidget({ 
    assignedCoach = "Assigned Coach", 
    availableTimes = ["Mon 4:30 PM (Technical)", "Wed 5:00 PM (Film Review)", "Sat 10:00 AM (Field Work)"] 
}: RequestSessionWidgetProps) {
    const [selectedCoach, setSelectedCoach] = useState(assignedCoach);
    const [notes, setNotes] = useState("");

    return (
        <div className="glass rounded-[2rem] p-8 border border-border/50 flex flex-col gap-6 shadow-xl shadow-black/5 relative overflow-hidden bg-card/10">
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-foreground border border-border/50 shadow-sm">
                    <Calendar size={24} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                    <h3 className="font-black text-xl text-foreground tracking-tight">Request Session</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">With:</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md border border-border/50 cursor-pointer hover:bg-muted/80 transition-colors">
                            <span className="text-[11px] font-bold text-foreground">{selectedCoach}</span>
                            <ChevronDown size={12} className="text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-2 relative z-10">
                <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[.2em] mb-2 block">Available Times</label>
                    <div className="relative group">
                        <select 
                            className="w-full bg-background/50 backdrop-blur-sm border border-border/60 rounded-xl p-4 text-sm font-bold appearance-none focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-foreground group-hover:border-border"
                            defaultValue=""
                        >
                            <option value="" disabled>Select a coach first</option>
                            {availableTimes.map((time, i) => (
                                <option key={i} value={time}>{time}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[.2em] mb-2 block">Notes for Coach</label>
                    <textarea 
                        className="w-full bg-background/50 backdrop-blur-sm border border-border/60 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 h-28 resize-none placeholder:text-muted-foreground/30 transition-all hover:border-border text-foreground"
                        placeholder="Start typing for Test..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <Button 
                    className="w-full bg-foreground text-background hover:bg-foreground/90 py-4 h-auto rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mt-4 shadow-xl active:scale-[0.98] transition-all"
                >
                    Submit Request <ChevronRight size={16} />
                </Button>
            </div>
        </div>
    );
}
