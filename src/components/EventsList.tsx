"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, QrCode } from "lucide-react";

export interface Event {
    id: number;
    name: string;
    date: string;
    location: string;
    status: "upcoming" | "open" | "past";
    image: string;
}

interface EventsListProps {
    events: Event[];
}

export function EventsList({ events }: EventsListProps) {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-end justify-between mb-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="text-pink-500" />
                    Event Passes
                </h3>
            </div>

            {events.length === 0 ? (
                <div className="text-center p-8 border border-zinc-800 border-dashed rounded-2xl text-zinc-500 text-sm">
                    No upcoming events.
                </div>
            ) : (
                <div className="grid gap-4">
                    {events.map((event, i) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row hover:border-zinc-700 transition-all"
                        >
                            {/* Event "Art" / Color Strip */}
                            <div className={`h-24 md:h-auto md:w-2 bg-gradient-to-br ${event.image}`} />

                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg leading-tight">{event.name}</h4>
                                        <div className="flex items-center gap-2">
                                            {event.status === "upcoming" && (
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                    Registered
                                                </span>
                                            )}
                                            <button className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-white group relative border border-transparent hover:border-zinc-700" title="Scan QR">
                                                <QrCode size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <Calendar size={12} /> {event.date}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <MapPin size={12} /> {event.location}
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
