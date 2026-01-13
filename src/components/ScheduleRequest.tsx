"use client";

import { motion } from "framer-motion";
import { Calendar, ChevronRight } from "lucide-react";

interface ScheduleRequestProps {
    goalieName: string;
    coachName: string;
}

const AVAILABLE_SLOTS = [
    { id: 101, day: "Wed, Dec 14", time: "4:00 PM" },
    { id: 102, day: "Wed, Dec 14", time: "5:30 PM" },
    { id: 103, day: "Fri, Dec 16", time: "6:00 AM" },
    { id: 104, day: "Sat, Dec 17", time: "9:00 AM" },
    { id: 105, day: "Wed, Dec 21", time: "4:00 PM" },
    { id: 106, day: "Wed, Jan 04", time: "4:00 PM" },
];

export function ScheduleRequest({ goalieName, coachName }: ScheduleRequestProps) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-zinc-800 rounded-lg text-white">
                    <Calendar size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Request Session</h3>
                    <p className="text-xs text-zinc-500 font-medium">With: <span className="text-primary font-bold">{coachName}</span></p>
                </div>
            </div>

            <form className="space-y-4 relative z-10" onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Select Available Slot
                    </label>
                    <div className="relative">
                        <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm appearance-none">
                            <option value="">-- Choose a time --</option>
                            {AVAILABLE_SLOTS.map(slot => (
                                <option key={slot.id} value={slot.id}>
                                    {slot.day} @ {slot.time}
                                </option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 rotate-90" size={16} />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 text-right">
                        Showing availability for next 3 months
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Notes for Coach
                    </label>
                    <textarea
                        rows={3}
                        placeholder={`Start typing for ${goalieName.split(' ')[0]}...`}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-700 resize-none"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-primary to-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                >
                    Submit Request
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </form>
        </div>
    );
}
