"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

interface WallpaperPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (wallpaper: string) => void;
    current: string;
}

const WALLPAPERS = [
    { name: "Default Dark", value: "bg-background" },
    { name: "Midnight Gradient", value: "bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900" },
    { name: "Oceanic", value: "bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900" },
    { name: "Sunset", value: "bg-gradient-to-br from-indigo-900 via-purple-900 to-orange-900" },
    { name: "Deep Space", value: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black" },
    { name: "Clean Gray", value: "bg-zinc-900" },
    // Only use public absolute paths for images if needed, avoiding local file paths for backgrounds unless in public
];

export function WallpaperPicker({ isOpen, onClose, onSelect, current }: WallpaperPickerProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard" size="md">
            <div className="p-1">
                <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">Choose Wallpaper</h4>

                <div className="grid grid-cols-2 gap-4">
                    {WALLPAPERS.map((wp) => (
                        <div
                            key={wp.value}
                            onClick={() => onSelect(wp.value)}
                            className={`
                                relative aspect-video rounded-xl cursor-pointer overflow-hidden border-2 transition-all group
                                ${current === wp.value ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-white/20'}
                            `}
                        >
                            <div className={`absolute inset-0 ${wp.value}`} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                            {current === wp.value && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="bg-primary text-white rounded-full p-1">
                                        <Check size={16} />
                                    </div>
                                </div>
                            )}

                            <div className="absolute bottom-2 left-2 text-xs font-bold text-white drop-shadow-md">
                                {wp.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
}
